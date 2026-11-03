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
        self.started_at = time.time()
        self.last_status_sent = 0
        self.audio_queue = asyncio.Queue(maxsize=500)
        self.processor = AudioStreamProcessor(
            sample_rate=settings.vad.sample_rate,
            silence_ms=settings.vad.min_silence_duration_ms,
            max_duration_s=settings.vad.max_speech_duration_s
        )
        self.worker_task: Optional[asyncio.Task] = None
        self.is_running = True

    async def send_json(self, data: dict):
        try:
            await self.websocket.send_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to send JSON to {self.call_id}: {e}")

sessions: Dict[str, ActiveCallSession] = {}

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "stt_loaded": stt_engine is not None and stt_engine.model is not None,
        "llm_provider": settings.llm.provider,
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
                continue

            session.audio_bytes += len(frame)
            session.audio_queue.task_done()

            # Feed to VAD & utterance segmenter
            committed_utterances = session.processor.feed(frame)

            for utt in committed_utterances:
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

                    # 1. Send live transcript to client
                    await session.send_json({
                        "type": "transcript",
                        "id": transcript.id,
                        "text": transcript.text,
                        "lang": transcript.lang,
                        "t0": transcript.t0,
                        "t1": transcript.t1,
                        "final": True
                    })

                    # 2. Conversation management
                    turn = Turn(
                        id=transcript.id,
                        text=transcript.text,
                        lang=transcript.lang,
                        t0=transcript.t0,
                        t1=transcript.t1
                    )
                    conversation_manager.add_turn(session.call_id, turn)
                    context_str = conversation_manager.format_context_for_prompt(session.call_id, turn)
                    prior_tactics = conversation_manager.get_tactics(session.call_id)

                    # 3. Tactic classification
                    t_llm_start = time.time()
                    new_tactics = await tactic_classifier.classify_utterance(
                        turn, context_str, has_prior_tactics=(len(prior_tactics) > 0)
                    )
                    llm_latency = round(time.time() - t_llm_start, 3)
                    logger.info(f"[{session.call_id}] Classifier ({llm_latency}s): {[t.tactic for t in new_tactics]}")

                    if new_tactics:
                        conversation_manager.add_tactics(session.call_id, new_tactics)
                        await session.send_json({
                            "type": "tactics",
                            "items": [
                                {
                                    "tactic": item.tactic,
                                    "confidence": item.confidence,
                                    "evidence": item.evidence,
                                    "explanation": item.explanation,
                                    "t": item.t
                                }
                                for item in new_tactics
                            ]
                        })

                    # 4. Sequence analysis & Risk Engine
                    all_events = conversation_manager.get_tactics(session.call_id)
                    risk_eval = risk_engine.calculate_risk(session.call_id, all_events)

                    await session.send_json({
                        "type": "risk",
                        "score": risk_eval.score,
                        "level": risk_eval.level,
                        "trend": risk_eval.trend,
                        "patterns": risk_eval.patterns
                    })

                    # 5. Alert generator
                    alert = generate_alert(risk_eval.level, risk_eval.active_tactics)
                    await session.send_json({
                        "type": "alert",
                        "level": alert.level,
                        "message": alert.message,
                        "action": alert.action
                    })

            # Emit periodic status update (every 1 second)
            now = time.time()
            if now - session.last_status_sent >= 1.0:
                session.last_status_sent = now
                await session.send_json({
                    "type": "status",
                    "state": "listening",
                    "audio_bytes": session.audio_bytes,
                    "queue_depth": session.audio_queue.qsize(),
                })

    except asyncio.CancelledError:
        logger.info(f"Worker task cancelled for call {session.call_id}")
    except Exception as e:
        logger.exception(f"Error in audio worker task for {session.call_id}: {e}")

@app.websocket("/ws/analyze/{call_id}")
async def analyze_call(websocket: WebSocket, call_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for call: {call_id}")

    session = ActiveCallSession(call_id, websocket)
    sessions[call_id] = session
    session.worker_task = asyncio.create_task(process_call_audio(session))

    await session.send_json({
        "type": "status",
        "state": "listening",
        "audio_bytes": 0,
        "message": "AI Scam Shield connected"
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
                        "warning": "Queue full, dropping oldest frame"
                    })
                session.audio_queue.put_nowait(raw_bytes)

            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type")
                    if msg_type == "start":
                        logger.info(f"Start signal received for call {call_id}")
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
