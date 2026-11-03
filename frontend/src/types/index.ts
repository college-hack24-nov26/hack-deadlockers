export type NavTab = 
  | 'overview' 
  | 'live-call' 
  | 'history'
  | 'settings';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TacticItem {
  tactic: string;
  confidence: number;
  evidence?: string;
  explanation?: string;
  t?: number;
  turn_idx?: number;
  turn_id?: string;
}

export interface TranscriptTurn {
  id: string;
  speaker: 'Caller' | 'Receiver';
  lang: string;
  text: string;
  t0: number;
  t1?: number;
  highlightWords?: string[];
  tactics?: TacticItem[];
}

export interface RiskState {
  score: number;
  level: RiskLevel;
  trend: 'rising' | 'falling' | 'stable';
  activeTactics: string[];
}

export interface AlertState {
  level: RiskLevel;
  message: string;
  action: string;
}

export interface CallRecord {
  id: string;
  callerId: string;
  receiverId: string;
  timestamp: string;
  duration: string;
  durationSec: number;
  language: string;
  riskScore: number;
  riskLevel: RiskLevel;
  scamType: string;
  tactics: string[];
  status: 'Blocked' | 'Flagged' | 'Monitored' | 'Resolved';
  transcriptSnippet: string;
  fullTranscript?: TranscriptTurn[];
  explanation?: string;
}

export interface PipelineStageInfo {
  id: string;
  name: string;
  engine: string;
  status: 'active' | 'standby' | 'optimizing';
  latencyMs: number;
  description: string;
  inputFormat: string;
  outputFormat: string;
}

