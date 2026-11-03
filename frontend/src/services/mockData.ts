import { CallRecord, PipelineStageInfo } from '../types';

export const HISTORIC_CALLS: CallRecord[] = [
  {
    id: 'CALL-9821',
    callerId: '+91 98201 44821',
    receiverId: '1001',
    timestamp: 'Today, 14:28',
    duration: '03:42',
    durationSec: 222,
    language: 'Hindi / Hinglish',
    riskScore: 98,
    riskLevel: 'Critical',
    scamType: 'Digital Arrest / CBI Impersonation',
    tactics: ['authority_impersonation', 'fear_manipulation', 'isolation_tactic', 'credential_harvesting'],
    status: 'Blocked',
    transcriptSnippet: 'Main Cyber Crime Cell se bol raha hoon, aapke naam par arrest warrant nikla hai...',
    explanation: 'Caller impersonated CBI officer, fabricated drug parcel confiscation, ordered victim into illegal "digital arrest" and demanded immediate fund verification transfer to safe account.',
    fullTranscript: [
      { id: '1', speaker: 'Caller', lang: 'Hindi', text: 'Namaste, main CBI Cyber Crime Branch se Senior Inspector Rajesh bol raha hoon.', t0: 2 },
      { id: '2', speaker: 'Receiver', lang: 'Hindi', text: 'Haan ji, kya baat hai sir?', t0: 8 },
      { id: '3', speaker: 'Caller', lang: 'Hindi', text: 'Aapke Aadhaar se linked ek courier Mumbai Customs ne pakda hai jisme 140 gram MDMA mila hai.', t0: 14 },
      { id: '4', speaker: 'Caller', lang: 'Hindi', text: 'Supreme Court ne aapke khilaaf non-bailable warrant issue kiya hai. Aap abhi se Digital Arrest mein hain.', t0: 24 },
      { id: '5', speaker: 'Caller', lang: 'Hinglish', text: 'Apne room ka door lock karo aur kisi ko mat batao. Apna account verify karne ke liye safe account mein transfer karo.', t0: 38 },
    ]
  },
  {
    id: 'CALL-9819',
    callerId: '+91 84210 99120',
    receiverId: '1001',
    timestamp: 'Today, 11:15',
    duration: '01:54',
    durationSec: 114,
    language: 'English',
    riskScore: 88,
    riskLevel: 'Critical',
    scamType: 'Electricity KYC Cut-off Threat',
    tactics: ['urgency_pressure', 'kyc_threat', 'credential_harvesting'],
    status: 'Blocked',
    transcriptSnippet: 'Your power bill is pending. Electricity will be disconnected tonight by 9:30 PM...',
    explanation: 'Caller created artificial deadline for utility disconnection and instructed downloading QuickSupport remote screen viewer to capture UPI credentials.',
    fullTranscript: [
      { id: '1', speaker: 'Caller', lang: 'English', text: 'Dear consumer, your electricity bill update is pending from last month.', t0: 3 },
      { id: '2', speaker: 'Caller', lang: 'English', text: 'Your power line will be disconnected tonight at 9:30 PM by state electricity board.', t0: 12 },
      { id: '3', speaker: 'Receiver', lang: 'English', text: 'I already paid through Google Pay yesterday.', t0: 20 },
      { id: '4', speaker: 'Caller', lang: 'English', text: 'Server update failed. Immediately download our electricity app from link or send OTP.', t0: 28 },
    ]
  },
  {
    id: 'CALL-9812',
    callerId: '+91 70215 33019',
    receiverId: '1002',
    timestamp: 'Yesterday, 18:40',
    duration: '02:18',
    durationSec: 138,
    language: 'Marathi',
    riskScore: 76,
    riskLevel: 'High',
    scamType: 'Bank Account KYC Block Threat',
    tactics: ['authority_impersonation', 'kyc_threat', 'financial_manipulation'],
    status: 'Flagged',
    transcriptSnippet: 'Aaple SBI khate KYC niyamit nalyamule band kele jaat aahe...',
    explanation: 'Scammer claimed SBI bank manager identity in Marathi, threatening freeze on bank account unless victim verified debit card CVV.',
  },
  {
    id: 'CALL-9804',
    callerId: '+91 91370 22104',
    receiverId: '1001',
    timestamp: 'Yesterday, 15:22',
    duration: '04:10',
    durationSec: 250,
    language: 'English',
    riskScore: 68,
    riskLevel: 'High',
    scamType: 'FedEx Customs Parcel Scam',
    tactics: ['authority_impersonation', 'fear_manipulation', 'financial_manipulation'],
    status: 'Flagged',
    transcriptSnippet: 'This is automated notice from FedEx customs desk, package with illegal passport held...',
  },
  {
    id: 'CALL-9799',
    callerId: '+91 98230 11990',
    receiverId: '1002',
    timestamp: '2 Nov, 12:05',
    duration: '00:52',
    durationSec: 52,
    language: 'Hinglish',
    riskScore: 42,
    riskLevel: 'Medium',
    scamType: 'Credit Card Limit Upgrade Phish',
    tactics: ['financial_manipulation', 'lottery_reward'],
    status: 'Monitored',
    transcriptSnippet: 'Sir aapke credit card par 5 lakh ka pre-approved limit increase offer hai...',
  },
  {
    id: 'CALL-9781',
    callerId: '+91 22 2840 9180',
    receiverId: '1001',
    timestamp: '1 Nov, 16:30',
    duration: '03:15',
    durationSec: 195,
    language: 'English',
    riskScore: 8,
    riskLevel: 'Low',
    scamType: 'Benign / Society Meeting Reminder',
    tactics: [],
    status: 'Resolved',
    transcriptSnippet: 'Hello Ajay, just calling to remind everyone regarding Sunday AGM meeting at club house...',
  },
  {
    id: 'CALL-9774',
    callerId: '+91 99200 44102',
    receiverId: '1001',
    timestamp: '1 Nov, 10:12',
    duration: '01:45',
    durationSec: 105,
    language: 'Hindi',
    riskScore: 5,
    riskLevel: 'Low',
    scamType: 'Benign / Delivery Partner Call',
    tactics: [],
    status: 'Resolved',
    transcriptSnippet: 'Bhaiya Zomato se delivery partner bol raha hoon, gate ka passcode bata dijiye...',
  }
];

export const PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: 'audio_ingest',
    name: '1. WebRTC & AudioWorklet Stream',
    engine: 'pcm-worklet.js (Web Audio API)',
    status: 'active',
    latencyMs: 12,
    description: 'Hardware mic capture with AGC/Noise cancellation, downsampled to 16kHz Int16 Mono PCM in 250ms streaming frames.',
    inputFormat: 'MediaStream 48kHz Float32',
    outputFormat: 'Binary Int16 PCM (8000 bytes/frame)'
  },
  {
    id: 'vad_segmentation',
    name: '2. Hybrid Voice Activity Detection (VAD)',
    engine: 'Silero VAD ONNX + RMS Energy Gate',
    status: 'active',
    latencyMs: 18,
    description: 'Neural silence boundary detector combined with acoustic energy filter (prob >= 0.30 or RMS >= 0.02) with 600ms trailing commitment.',
    inputFormat: '16kHz Int16 Buffer',
    outputFormat: 'Speech Utterance Chunks (0.8s - 15.0s)'
  },
  {
    id: 'stt_engine',
    name: '3. Multilingual Speech-to-Text',
    engine: 'faster-whisper (CTranslate2 Int8/Float16)',
    status: 'active',
    latencyMs: 185,
    description: 'Hardware-quantized transformer model delivering rapid beam-search transcription with deduplication hashes.',
    inputFormat: 'Normalized Audio Array',
    outputFormat: 'UTF-8 Transcribed Text + Timestamps'
  },
  {
    id: 'lang_id',
    name: '4. Dialect & Code-Switch Classifier',
    engine: 'Unicode Heuristic + Phonetic Lexicon',
    status: 'active',
    latencyMs: 4,
    description: 'Detects spoken language boundaries across Hindi, Marathi, English, and Romanized Hinglish dialect.',
    inputFormat: 'Raw Utterance String',
    outputFormat: 'ISO-639 Lang Tag (hi, mr, en, hinglish)'
  },
  {
    id: 'tactic_classifier',
    name: '5. 10-Tactic Fraud Classifier',
    engine: 'Regex Pre-Gate + Groq Cloud LPU (Qwen-3.8-27B)',
    status: 'active',
    latencyMs: 380,
    description: 'High-speed structured extraction mapping psychological vectors: Authority, Fear, Urgency, Isolation, OTP/Creds, and Extortion.',
    inputFormat: 'Rolling Conversation Turn + Context Window',
    outputFormat: 'TacticEvent[] with confidence & evidence spans'
  },
  {
    id: 'sequence_analyzer',
    name: '6. Multi-Stage Attack Tree Analyzer',
    engine: 'Deterministic State-Machine & DAG Matcher',
    status: 'active',
    latencyMs: 2,
    description: 'Tracks progression across Stage 0 (Setup) -> Stage 1 (Threat) -> Stage 2 (Isolation) -> Stage 4 (Extraction).',
    inputFormat: 'Chronological Tactic History',
    outputFormat: 'Pattern Signature & Stage Multiplier'
  },
  {
    id: 'risk_engine',
    name: '7. Non-Linear Risk & Explainable Alert Engine',
    engine: 'Noisy-OR Fusion + Asymmetric Rise/Fall Filter',
    status: 'active',
    latencyMs: 5,
    description: 'Calculates continuous 0-100 risk with fast alpha-rise (0.85) and slow alpha-fall (0.20), sensitive-ask floor, and natural language explanation.',
    inputFormat: 'Tactic Stream + Temporal Context',
    outputFormat: 'Risk Score (0-100) + Threat Alert + Recommended Action'
  }
];

export const THREAT_ANALYTICS = {
  categories: [
    { name: 'Digital Arrest / CBI Impersonation', count: 48, percentage: 38, fill: '#FF4757' },
    { name: 'Banking / OTP Phishing', count: 32, percentage: 25, fill: '#FFB020' },
    { name: 'Utility / Electricity KYC Cut-off', count: 24, percentage: 19, fill: '#00D4FF' },
    { name: 'Remote Access Tool (AnyDesk/TeamViewer)', count: 14, percentage: 11, fill: '#8B5CF6' },
    { name: 'Customs / Courier Drug Threat', count: 9, percentage: 7, fill: '#EC4899' },
  ],
  languages: [
    { name: 'Hindi', value: 46, fill: '#FF4757' },
    { name: 'Hinglish (Colloquial)', value: 28, fill: '#FFB020' },
    { name: 'English', value: 18, fill: '#00D4FF' },
    { name: 'Marathi', value: 8, fill: '#10B981' },
  ],
  tacticsFrequency: [
    { tactic: 'Authority Impersonation', occurrences: 92 },
    { tactic: 'Fear & Intimidation', occurrences: 84 },
    { tactic: 'Urgency & Pressure', occurrences: 76 },
    { tactic: 'Isolation & Secrecy', occurrences: 58 },
    { tactic: 'Credential / OTP Asking', occurrences: 52 },
    { tactic: 'Financial Wire Manipulation', occurrences: 44 },
    { tactic: 'KYC Expiration Threat', occurrences: 39 },
    { tactic: 'Remote Software Install', occurrences: 18 },
  ],
  trends: [
    { day: 'Mon', calls: 142, scams: 16, riskAvg: 22 },
    { day: 'Tue', calls: 184, scams: 22, riskAvg: 28 },
    { day: 'Wed', calls: 168, scams: 18, riskAvg: 24 },
    { day: 'Thu', calls: 210, scams: 29, riskAvg: 34 },
    { day: 'Fri', calls: 245, scams: 38, riskAvg: 41 },
    { day: 'Sat', calls: 190, scams: 24, riskAvg: 31 },
    { day: 'Sun', calls: 145, scams: 15, riskAvg: 19 },
  ]
};

// Interactive Live Simulation Scripts for Demonstrations
export const SIMULATION_SCRIPTS = {
  digitalArrest: [
    {
      delayMs: 1500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Hello, this is Senior Inspector Rajesh Verma calling from Central Bureau of Investigation (CBI), New Delhi Cyber Crime Headquarters.',
      tactics: [
        { tactic: 'authority_impersonation', confidence: 0.98, evidence: 'CBI New Delhi Cyber Crime Headquarters', explanation: 'Impersonating central law enforcement authority' }
      ],
      score: 39.5,
      level: 'Medium' as const,
      explanation: 'Caller opened by explicitly claiming to be a CBI Inspector from Cyber Crime Headquarters to establish psychological dominance.'
    },
    {
      delayMs: 3800,
      speaker: 'Caller' as const,
      lang: 'hi',
      text: 'Aapke Aadhaar card aur phone number se linked ek parcel Mumbai International Airport Customs ne seize kiya hai jisme illegal narcotics aur 150 gram cocaine mili hai.',
      tactics: [
        { tactic: 'fear_manipulation', confidence: 0.97, evidence: 'parcel seize kiya... illegal narcotics cocaine', explanation: 'Fabricating serious criminal allegations involving contraband' }
      ],
      score: 73.3,
      level: 'High' as const,
      explanation: 'Caller escalated threat to serious narcotics smuggling charges, creating severe panic and legal vulnerability.'
    },
    {
      delayMs: 4200,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Supreme Court has issued a non-bailable arrest warrant against your name. Under Indian Cyber Law, you are now placed under Digital Arrest.',
      tactics: [
        { tactic: 'isolation_tactic', confidence: 0.96, evidence: 'placed under Digital Arrest... non-bailable warrant', explanation: 'Inventing fictitious "Digital Arrest" coercive measure' }
      ],
      score: 96.0,
      level: 'Critical' as const,
      explanation: 'Critical scam signature detected: "Digital Arrest" is an internationally recognized coercive cyber fraud tactic with zero legal standing.'
    },
    {
      delayMs: 4000,
      speaker: 'Caller' as const,
      lang: 'hi',
      text: 'Apne kamre ka darwaza band karo, video call continuously on rakho aur kisi family member ya vakil ko contact mat karna warna immediate physical police dispatch hogi.',
      tactics: [
        { tactic: 'secrecy_demand', confidence: 0.98, evidence: 'darwaza band karo... kisi ko contact mat karna', explanation: 'Strict isolation and secrecy enforcement to prevent third-party intervention' }
      ],
      score: 99.4,
      level: 'Critical' as const,
      explanation: 'Aggressive isolation tactic enforced. Scammer demands victim remain in solitude on video call to prevent outside verification.'
    },
    {
      delayMs: 4500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'To clear your name and receive clearance NOC, you must transfer your entire savings to the Reserve Bank of India temporary security escrow account within 20 minutes, or share your netbanking OTP.',
      tactics: [
        { tactic: 'financial_manipulation', confidence: 0.99, evidence: 'transfer your entire savings... RBI temporary escrow', explanation: 'Extortion demand under the guise of security verification' },
        { tactic: 'credential_harvesting', confidence: 0.97, evidence: 'share your netbanking OTP', explanation: 'Direct phishing for financial authentication credentials' }
      ],
      score: 100.0,
      level: 'Critical' as const,
      explanation: 'Financial extortion stage executed: Demanding wire transfer of personal savings coupled with OTP credential request. Full Digital Arrest flow confirmed.'
    }
  ],

  otpScam: [
    {
      delayMs: 1500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Good morning sir, I am calling from HDFC Bank Central Security Operations. We noticed unauthorized transaction attempts on your account.',
      tactics: [{ tactic: 'authority_impersonation', confidence: 0.95, evidence: 'HDFC Bank Central Security Operations', explanation: 'Impersonating financial institution security team' }],
      score: 35.0,
      level: 'Medium' as const,
      explanation: 'Caller claiming to represent bank security team alerting about suspicious activity.'
    },
    {
      delayMs: 3500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'A debit transaction of Rs 89,450 to an international merchant is currently pending. To cancel this fraudulent charge, we have triggered a cancellation OTP to your phone.',
      tactics: [{ tactic: 'urgency_pressure', confidence: 0.94, evidence: 'Rs 89,450 pending... cancellation OTP', explanation: 'Artificial urgency using high-value debit threat' }],
      score: 68.5,
      level: 'High' as const,
      explanation: 'Urgency created with high financial loss claim; laying groundwork for OTP extraction.'
    },
    {
      delayMs: 3800,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Please read back the 6-digit verification code received from HDFC Bank so our automated firewall can block the transfer immediately.',
      tactics: [{ tactic: 'credential_harvesting', confidence: 0.99, evidence: 'read back the 6-digit verification code', explanation: 'Direct phishing of one-time authorization code' }],
      score: 98.5,
      level: 'Critical' as const,
      explanation: 'Critical threat: Bank representative demanding an OTP. Sensitive-ask floor triggered (OTP demand after bank authority claim).'
    }
  ],

  benignCall: [
    {
      delayMs: 1500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Hi Shivam, this is Ajay from your housing society management committee.',
      tactics: [],
      score: 0.0,
      level: 'Low' as const,
      explanation: 'Normal conversational greeting between residents. No pressure or fraud indicators detected.'
    },
    {
      delayMs: 3200,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'We are organizing the annual maintenance checkup for water filters this upcoming Saturday morning from 10 AM to 1 PM.',
      tactics: [],
      score: 0.0,
      level: 'Low' as const,
      explanation: 'Informational message regarding routine building maintenance schedule.'
    },
    {
      delayMs: 3500,
      speaker: 'Caller' as const,
      lang: 'en',
      text: 'Just wanted to confirm if you will be home, or if we should schedule a technician for next week instead.',
      tactics: [],
      score: 0.0,
      level: 'Low' as const,
      explanation: 'Standard logistical coordination. Safe conversation with zero risk characteristics.'
    }
  ]
};

