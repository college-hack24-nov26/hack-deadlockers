import json
import logging
import re
import httpx
from typing import List, Optional
from pydantic import BaseModel, Field

from config import settings
from conversation_manager import Turn, TacticEvent

logger = logging.getLogger("scamchain-classifier")

VALID_TACTICS = {
    "authority_impersonation",
    "urgency_creation",
    "fear_manipulation",
    "otp_request",
    "financial_manipulation",
    "kyc_fraud",
    "digital_arrest",
    "remote_access",
    "reward_scam",
    "identity_manipulation",
}

PRE_GATE_PATTERNS = [
    # English / Hinglish
    r"\b(cbi|police|customs|trai|fedex|courier|rbi|cyber\s*crime|inspector|officer|narcotics)\b",
    r"\b(arrest|fir|court|warrant|illegal|drugs|passport|blocked|suspended|penalt(y|ies))\b",
    r"\b(digital\s*arrest|stay\s*on\s*call|camera\s*on|don'?t\s*disconnect)\b",
    r"\b(otp|mpin|pin|verification\s*code|password|cvv)\b",
    r"\b(kyc|aadhaar|aadhar|pan\s*card|update|expire)\b",
    r"\b(urgent|immediately|right\s*now|within\s*\d+\s*(mins?|minutes?|hours?)|turant|jaldi)\b",
    r"\b(anydesk|teamviewer|rustdesk|quicksupport|screen\s*share|apk|download|app)\b",
    r"\b(transfer|safe\s*account|security\s*deposit|refund|lottery|reward|cashback|prize)\b",
    # Devanagari (Hindi / Marathi)
    r"(पोलीस|अधिकारी|सीबीआय|कस्टम|गुन्हा|अटक|वारंट|एफआयआर|बेकायदेशीर|डिजिटल\s*अटक)",
    r"(ओटीपी|खाते|बँक|पैसे|ट्रान्सफर|सुरक्षित\s*खाते|केवायसी|आधार|पॅन|अपडेट|बंद\s*होईल)",
    r"(तात्काळ|त्वरित|लवकर|लगेच|सध्या|तुरंत|जल्दी|अभी|धमकी|शिक्षा|कोर्ट)"
]

PRE_GATE_REGEX = re.compile("|".join(PRE_GATE_PATTERNS), re.IGNORECASE)

class DetectedTacticItem(BaseModel):
    tactic: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: str
    explanation: str

class ClassifierOutput(BaseModel):
    tactics: List[DetectedTacticItem] = []

SYSTEM_PROMPT = """You are an expert fraud detection AI specialized in real-time scam-call analysis for Indian cybercrime vectors (Hindi, Marathi, English, Hinglish).
Your task is to classify the caller's LATEST utterance for fraudulent tactics using the provided conversation history (up to 6 previous utterances).

ALLOWED TACTICS:
1. authority_impersonation: Claiming to be Police, CBI, RBI, Customs, Fedex, TRAI, Court, Bank official.
2. urgency_creation: Forcing immediate action ("within 10 minutes", "right now", "turant karo").
3. fear_manipulation: Threatening arrest, FIR, jail, seized passport/narcotics, blocked account.
4. otp_request: Asking for OTP, SMS code, PIN, password. (Genuine banks NEVER ask).
5. financial_manipulation: Directing money transfer to "RBI safe account", clearance fee, verification fee.
6. kyc_fraud: Claiming KYC is suspended or needs urgent re-verification via link/document.
7. digital_arrest: Demanding the victim stay on video/audio call, prohibiting contacting family/police.
8. remote_access: Instructing to install AnyDesk, TeamViewer, RustDesk, QuickSupport, or unknown APK.
9. reward_scam: Fake lottery winnings, rewards, unearned cashback, high-return gifts.
10. identity_manipulation: Harvesting PAN, Aadhaar, debit/credit card numbers.

CRITICAL RULES:
- If the conversation is benign greeting, delivery inquiry, casual chit-chat, or ordinary bank notification without sensitive requests, return {"tactics": []}.
- Genuine banks NEVER ask for OTP, passwords, or installing remote screen sharing apps.
- The user is the recipient; user phrases or confusion are NOT scam tactics. Classify CALLER behavior only.
- Output MUST strictly be valid JSON matching the schema: {"tactics": [{"tactic": "...", "confidence": 0.0-1.0, "evidence": "exact words", "explanation": "English sentence"}]}

FEW-SHOT EXAMPLES:
Context: "Hello sir, I am calling from Fedex courier Mumbai."
Utterance: "Your parcel contains illegal narcotics and your case is transferred to CBI crime branch."
Output: {"tactics": [
  {"tactic": "authority_impersonation", "confidence": 0.95, "evidence": "transferred to CBI crime branch", "explanation": "Caller falsely claims to represent CBI crime branch."},
  {"tactic": "fear_manipulation", "confidence": 0.92, "evidence": "parcel contains illegal narcotics", "explanation": "Caller threatens legal consequences over alleged contraband."}
]}

Context: "तुमचे वीज बिल भरलेले नाही."
Utterance: "लगेच या लिंकवर क्लिक करा नाहीतर आज रात्री वीज कापली जाईल."
Output: {"tactics": [
  {"tactic": "urgency_creation", "confidence": 0.90, "evidence": "लगेच या लिंकवर क्लिक करा", "explanation": "Caller demands immediate action to avoid disconnection."},
  {"tactic": "fear_manipulation", "confidence": 0.85, "evidence": "आज रात्री वीज कापली जाईल", "explanation": "Caller threatens immediate cutoff of utility service."}
]}

Context: "Sir for verification send me the 6 digit code received on your phone."
Utterance: "Aapke phone pe OTP aaya hoga, jaldi batao warna account freeze ho jayega."
Output: {"tactics": [
  {"tactic": "otp_request", "confidence": 0.98, "evidence": "Aapke phone pe OTP aaya hoga, jaldi batao", "explanation": "Caller explicitly requests an OTP under threat of freezing the account."},
  {"tactic": "fear_manipulation", "confidence": 0.88, "evidence": "warna account freeze ho jayega", "explanation": "Caller uses fear of account suspension to coerce compliance."}
]}
"""

class TacticClassifier:
    """
    Classifies caller utterances using local Ollama (or Gemini/Groq free fallbacks).
    Uses multilingual pre-gating to skip harmless chit-chat and conserve CPU cycles.
    """
    def __init__(self):
        self.provider = settings.llm.provider
        self.client = httpx.AsyncClient(timeout=15.0)

    def pre_gate_check(self, text: str, has_prior_tactics: bool = False) -> bool:
        """Returns True if the utterance warrants LLM classification."""
        if has_prior_tactics:
            # If scam tactics were already spotted earlier in this call, analyze subsequent turns
            return True
        return bool(PRE_GATE_REGEX.search(text))

    async def classify_utterance(self, turn: Turn, context_str: str, has_prior_tactics: bool = False) -> List[TacticEvent]:
        # Pre-gate optimization
        if not self.pre_gate_check(turn.text, has_prior_tactics):
            logger.debug(f"Pre-gate skipped neutral utterance: '{turn.text}'")
            return []

        user_content = f"""CONVERSATION CONTEXT:
{context_str}

LATEST CALLER UTTERANCE:
[{turn.lang.upper()}] "{turn.text}"

Analyze the latest utterance for the 10 scam tactics. Respond strictly with JSON:"""

        raw_json_str = None
        for attempt in range(2): # Try once, retry on parse failure
            try:
                if self.provider == "gemini_free" and settings.llm.gemini_api_key:
                    raw_json_str = await self._call_gemini(user_content)
                elif self.provider == "groq_free" and settings.llm.groq_api_key:
                    raw_json_str = await self._call_groq(user_content)
                else:
                    raw_json_str = await self._call_ollama(user_content)

                if raw_json_str:
                    data = json.loads(raw_json_str)
                    parsed = ClassifierOutput.model_validate(data)
                    events = []
                    for item in parsed.tactics:
                        if item.tactic in VALID_TACTICS and item.confidence >= 0.40:
                            events.append(TacticEvent(
                                tactic=item.tactic,
                                confidence=round(item.confidence, 2),
                                evidence=item.evidence or turn.text,
                                explanation=item.explanation or f"Detected {item.tactic}",
                                t=turn.t1
                            ))
                    return events
            except Exception as e:
                logger.warning(f"Classification attempt {attempt+1} failed: {e}")

        return []

    async def _call_ollama(self, user_content: str) -> Optional[str]:
        url = f"{settings.llm.ollama_url.rstrip('/')}/api/chat"
        payload = {
            "model": settings.llm.ollama_model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1}
        }
        resp = await self.client.post(url, json=payload)
        if resp.status_code == 200:
            res_json = resp.json()
            return res_json.get("message", {}).get("content", "")
        else:
            logger.warning(f"Ollama returned HTTP {resp.status_code}: {resp.text}")
            return None

    async def _call_gemini(self, user_content: str) -> Optional[str]:
        # Free-tier Gemini REST API
        key = settings.llm.gemini_api_key
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
        payload = {
            "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1}
        }
        resp = await self.client.post(url, json=payload)
        if resp.status_code == 200:
            res_json = resp.json()
            text = res_json["candidates"][0]["content"]["parts"][0]["text"]
            return text
        return None

    async def _call_groq(self, user_content: str) -> Optional[str]:
        # Free-tier Groq API
        key = settings.llm.groq_api_key
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}"}
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        resp = await self.client.post(url, json=payload, headers=headers)
        if resp.status_code == 200:
            res_json = resp.json()
            return res_json["choices"][0]["message"]["content"]
        return None

