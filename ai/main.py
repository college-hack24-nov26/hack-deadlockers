import asyncio
import json
import logging
import time
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from audio_stream_processor import AudioStreamProcessor, Utterance
from speech_to_text import SpeechToTextEngine, TranscriptResult
from conversation_manager import ConversationManager, Turn, TacticEvent
from tactic_classifier import TacticClassifier
from sequence_analyzer import analyze_sequence
from risk_engine import RiskEngine
from alert_generator import generate_alert

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("scamchain-main")

app = FastAPI(title="ScamChain AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared AI engine singletons
stt_engine: Optional[SpeechToTextEngine] = None
tactic_classifier: Optional[TacticClassifier] = None
risk_engine: Optional[RiskEngine] = None
conversation_manager: Optional[ConversationManager] = None

@app.on_event("startup")
async def startup_event():
    global stt_engine, tactic_classifier, risk_engine, conversation_manager
    logger.info("Initializing ScamChain AI engines...")
    try:
        stt_engine = SpeechToTextEngine()
    except Exception as e:
        logger.error(f"Error loading STT Engine: {e}")
        stt_engine = None

    tactic_classifier = TacticClassifier()
    risk_engine = RiskEngine()
    conversation_manager = ConversationManager(context_turns=settings.llm.context_turns)
    logger.info("ScamChain AI ready.")

class ActiveCallSession:
    def __init__(self, call_id: str, websocket: WebSocket):
        self.call_id = call_id
        self.websocket = websocket
        self.audio_bytes = 0
        self.utterance_count = 0
        self.transcript_count = 0
        self.started_at = time.time()
        self.last_status_sent = 0
        self.last_sent_risk_score: Optional[float] = None
        self.last_sent_risk_level: Optional[str] = None
        self.audio_queue = asyncio.Queue(maxsize=500)
        self.processor = AudioStreamProcessor(
            sample_rate=settings.vad.sample_rate,
            silence_ms=settings.vad.min_silence_duration_ms,
            max_duration_s=settings.vad.max_speech_duration_s,
            min_speech_ms=settings.vad.min_speech_duration_ms,
        )
        self.worker_task: Optional[asyncio.Task] = None
        self.analysis_tasks: set[asyncio.Task] = set()
        self.send_lock = asyncio.Lock()
        self.is_running = True

    async def send_json(self, data: dict):
        try:
            async with self.send_lock:
                await self.websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to send JSON to {self.call_id}: {e}")

sessions: Dict[str, ActiveCallSession] = {}

def llm_is_configured() -> bool:
    if settings.llm.provider == "groq_free":
        return bool(settings.llm.groq_api_key)
    if settings.llm.provider == "gemini_free":
        return bool(settings.llm.gemini_api_key or settings.llm.groq_api_key)
    return settings.llm.provider == "ollama"

@app.get("/health")
async def health_check():
    stt_ready = stt_engine is not None and stt_engine.model is not None
    return {
        "status": "ok" if stt_ready else "degraded",
        "stt_loaded": stt_ready,
        "stt_ready": stt_ready,
        "llm_provider": settings.llm.provider,
        "risk_engine_ready": risk_engine is not None,
        "local_fallback": "high-confidence tactic rules",
        "mode": "pipeline_active",
        "active_calls": len(sessions),
    }

async def process_call_audio(session: ActiveCallSession):
    """Background worker task for processing audio frames from the queue."""
    logger.info(f"Worker task started for call {session.call_id}")
    loop = asyncio.get_event_loop()

    try:
        while session.is_running:
            try:
                frame = await asyncio.wait_for(session.audio_queue.get(), timeout=0.5)
            except asyncio.TimeoutError:
                now = time.time()
                if now - session.last_status_sent >= 1.0:
                    session.last_status_sent = now
                    events = conversation_manager.get_tactics(session.call_id)
                    if events:
                        elapsed = max(now - session.started_at, max(event.t for event in events))
                        risk_eval = risk_engine.calculate_risk(
                            session.call_id,
                            events,
                            current_time=elapsed,
                        )
                        await send_risk_and_alert(session, risk_eval, force=False)
                    await session.send_json({
                        "type": "status",
                        "state": "listening" if stt_engine and stt_engine.model else "degraded",
                        "audio_bytes": session.audio_bytes,
                        "utterances": session.utterance_count,
                        "transcripts": session.transcript_count,
                        "queue_depth": session.audio_queue.qsize(),
                        "llm_provider": settings.llm.provider,
                        "llm_configured": llm_is_configured(),
                    })
                continue

            session.audio_bytes += len(frame)
            session.audio_queue.task_done()

            # Feed to VAD & utterance segmenter
            committed_utterances = session.processor.feed(frame)

            for utt in committed_utterances:
                session.utterance_count += 1
                logger.info(f"[{session.call_id}] Speech committed: {utt.duration}s! Transcribing with faster-whisper...")
                # Transcribe offloaded to thread executor
                t_vad_stt_start = time.time()
                transcript: Optional[TranscriptResult] = None
                if stt_engine and stt_engine.model:
                    transcript = await loop.run_in_executor(
                        None,
                        stt_engine.transcribe,
                        session.call_id,
                        utt.audio_pcm,
                        utt.t0,
                        utt.t1,
                        utt.id
                    )

                if transcript and transcript.text:
                    stt_latency = round(time.time() - t_vad_stt_start, 3)
                    logger.info(f"[{session.call_id}] Transcript ({transcript.lang}, {stt_latency}s): {transcript.text}")
                    turn = Turn(
                        id=transcript.id,
                        text=transcript.text,
                        lang=transcript.lang,
                        t0=transcript.t0,
                        t1=transcript.t1
                    )
                    await analyze_transcript(session, turn)

            # Emit periodic status update (every 1 second)
            now = time.time()
            if now - session.last_status_sent >= 1.0:
                session.last_status_sent = now
                events = conversation_manager.get_tactics(session.call_id)
                if events:
                    elapsed = max(now - session.started_at, max(event.t for event in events))
                    risk_eval = risk_engine.calculate_risk(
                        session.call_id,
                        events,
                        current_time=elapsed,
                    )
                    await send_risk_and_alert(session, risk_eval, force=False)
                await session.send_json({
                    "type": "status",
                    "state": "listening" if stt_engine and stt_engine.model else "degraded",
                    "audio_bytes": session.audio_bytes,
                    "utterances": session.utterance_count,
                    "transcripts": session.transcript_count,
                    "queue_depth": session.audio_queue.qsize(),
                    "llm_provider": settings.llm.provider,
                    "llm_configured": llm_is_configured(),
                })

    except asyncio.CancelledError:
        logger.info(f"Worker task cancelled for call {session.call_id}")
    except Exception as e:
        logger.exception(f"Error in audio worker task for {session.call_id}: {e}")


async def analyze_transcript(session: ActiveCallSession, turn: Turn):
    """Score each transcript immediately, then refine it with the configured AI model."""
    session.transcript_count += 1
    await session.send_json({
        "type": "transcript",
        "id": turn.id,
        "text": turn.text,
        "lang": turn.lang,
        "t0": turn.t0,
        "t1": turn.t1,
        "final": True,
    })

    conversation_manager.add_turn(session.call_id, turn)
    context_str = conversation_manager.format_context_for_prompt(session.call_id, turn)
    prior_events = conversation_manager.get_tactics(session.call_id)
    quick_tactics = tactic_classifier.classify_heuristically(turn)
    conversation_manager.set_turn_tactics(session.call_id, turn.id, quick_tactics)

    # Emit an immediate provisional score before an Ollama/API round trip.
    preview = risk_engine.calculate_risk(
        session.call_id,
        conversation_manager.get_tactics(session.call_id),
        current_time=max(time.time() - session.started_at, turn.t1),
        commit=False,
    )
    await send_tactics(session, turn.id, quick_tactics)
    await send_risk_and_alert(session, preview)

    task = asyncio.create_task(
        refine_transcript_with_ai(session, turn, context_str, bool(prior_events or quick_tactics), quick_tactics)
    )
    session.analysis_tasks.add(task)
    task.add_done_callback(session.analysis_tasks.discard)


async def refine_transcript_with_ai(session: ActiveCallSession, turn: Turn, context_str: str, has_prior_tactics: bool, fallback_tactics):
    classifier_started = time.time()
    try:
        ai_tactics = await tactic_classifier.classify_utterance(
            turn,
            context_str,
            has_prior_tactics=has_prior_tactics,
        )
    except Exception:
        logger.exception("[%s] AI classification failed for turn %s", session.call_id, turn.id)
        ai_tactics = []

    if not session.is_running:
        return

    logger.info(
        "[%s] Classifier (%.3fs): %s",
        session.call_id,
        time.time() - classifier_started,
        [item.tactic for item in ai_tactics],
    )

    # If classification is unavailable or empty, retain the fast local evidence.
    selected_tactics = ai_tactics or fallback_tactics
    conversation_manager.set_turn_tactics(session.call_id, turn.id, selected_tactics)
    await send_tactics(session, turn.id, selected_tactics)
    risk_eval = risk_engine.calculate_risk(
        session.call_id,
        conversation_manager.get_tactics(session.call_id),
        current_time=max(time.time() - session.started_at, turn.t1),
    )
    await send_risk_and_alert(session, risk_eval)


async def send_tactics(session: ActiveCallSession, turn_id: str, items):
    await session.send_json({
        "type": "tactics",
        "turn_id": turn_id,
        "items": [
            {
                "tactic": item.tactic,
                "confidence": item.confidence,
                "evidence": item.evidence,
                "explanation": item.explanation,
                "t": item.t,
                "turn_id": turn_id,
            }
            for item in items
        ],
    })


async def send_risk_and_alert(session: ActiveCallSession, risk_eval, force: bool = True):
    changed = (
        session.last_sent_risk_score is None
        or round(risk_eval.score) != round(session.last_sent_risk_score)
        or risk_eval.level != session.last_sent_risk_level
    )
    if force or changed:
        await session.send_json({
            "type": "risk",
            "score": risk_eval.score,
            "level": risk_eval.level,
            "trend": risk_eval.trend,
            "patterns": risk_eval.patterns,
        })
        alert = generate_alert(risk_eval.level, risk_eval.active_tactics)
        await session.send_json({
            "type": "alert",
            "level": alert.level,
            "message": alert.message,
            "action": alert.action,
        })
        session.last_sent_risk_score = risk_eval.score
        session.last_sent_risk_level = risk_eval.level

@app.websocket("/ws/analyze/{call_id}")
async def analyze_call(websocket: WebSocket, call_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for call: {call_id}")

    session = ActiveCallSession(call_id, websocket)
    sessions[call_id] = session
    session.worker_task = asyncio.create_task(process_call_audio(session))

    llm_configured = llm_is_configured()
    stt_ready = bool(stt_engine and stt_engine.model)
    if not stt_ready:
        initial_message = "AI connected, but speech recognition is unavailable. Audio risk scoring cannot start until the STT model loads."
    elif not llm_configured:
        initial_message = "Groq API key is missing; local tactic and risk scoring will continue."
    else:
        initial_message = "AI analysis connected; live speech scoring is ready."

    await session.send_json({
        "type": "status",
        "state": "listening" if stt_ready else "degraded",
        "audio_bytes": 0,
        "stt_ready": bool(stt_engine and stt_engine.model),
        "llm_provider": settings.llm.provider,
        "llm_configured": llm_configured,
        "message": initial_message,
    })

    try:
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                raw_bytes = message["bytes"]
                if session.audio_queue.full():
                    try:
                        session.audio_queue.get_nowait()
                        session.audio_queue.task_done()
                    except asyncio.QueueEmpty:
                        pass
                    await session.send_json({
                        "type": "status",
                        "state": "degraded",
                        "audio_bytes": session.audio_bytes,
                        "utterances": session.utterance_count,
                        "transcripts": session.transcript_count,
                        "llm_provider": settings.llm.provider,
                        "llm_configured": llm_is_configured(),
                        "warning": "Queue full, dropping oldest frame"
                    })
                session.audio_queue.put_nowait(raw_bytes)

            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type")
                    if msg_type == "start":
                        logger.info(f"Start signal received for call {call_id}")
                    elif msg_type == "transcript":
                        text = str(payload.get("text", "")).strip()
                        if text:
                            turn = Turn(
                                id=str(payload.get("id") or f"text_{int(time.time() * 1000)}"),
                                text=text,
                                lang=str(payload.get("lang") or "auto"),
                                t0=float(payload.get("t0") or 0.0),
                                t1=float(payload.get("t1") or payload.get("t0") or 0.0),
                            )
                            await analyze_transcript(session, turn)
                    elif msg_type == "stop":
                        logger.info(f"Stop signal received for call {call_id}")
                        break
                except Exception as ex:
                    logger.warning(f"Invalid text JSON received: {ex}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for call {call_id}")
    except Exception as e:
        logger.warning(f"WebSocket error for call {call_id}: {e}")
    finally:
        session.is_running = False
        for task in session.analysis_tasks:
            task.cancel()
        if session.worker_task:
            session.worker_task.cancel()
        if stt_engine:
            stt_engine.reset_call(call_id)
        if risk_engine:
            risk_engine.reset_call(call_id)
        if conversation_manager:
            conversation_manager.reset_call(call_id)
        sessions.pop(call_id, None)
        logger.info(f"Cleaned up session for call {call_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=False)
