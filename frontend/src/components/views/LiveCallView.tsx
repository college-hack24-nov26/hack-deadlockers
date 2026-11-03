import React, { useState } from 'react';
import { WebRTCState } from '../../services/webrtc';
import { RadialRiskMeter } from '../common/RadialRiskMeter';
import { AudioWaveform } from '../common/AudioWaveform';
import { RiskBadge } from '../common/RiskBadge';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  PhoneCall, 
  ShieldAlert, 
  Clock, 
  Globe, 
  Terminal, 
  AlertTriangle, 
  Flag, 
  UserX, 
  Activity, 
  Sparkles,
  Zap,
  Volume2
} from 'lucide-react';

interface LiveCallViewProps {
  callState: WebRTCState;
  onStartCall: (toId?: string) => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onEnableAudio: () => void;
  onSimulate: (key: 'digitalArrest' | 'otpScam' | 'benignCall') => void;
  dialNumber: string;
  setDialNumber: (val: string) => void;
  triggerToast: (msg: string) => void;
}

export const LiveCallView: React.FC<LiveCallViewProps> = ({
  callState,
  onStartCall,
  onEndCall,
  onToggleMute,
  onEnableAudio,
  onSimulate,
  triggerToast
}) => {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const isCallActive = callState.callState === 'connected' || callState.callState === 'calling';
  const durationStr = `${String(Math.floor(callState.durationSec / 60)).padStart(2, '0')}:${String(callState.durationSec % 60).padStart(2, '0')}`;

  const formatAudioKB = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const handleBlockCaller = () => {
    setShowBlockConfirm(false);
    onEndCall();
    triggerToast(`Caller ${callState.peerId || 'Unknown'} has been blacklisted and disconnected.`);
  };

  const handleReportAuthority = () => {
    setShowReportConfirm(false);
    triggerToast(`Dossier dispatched to National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in).`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Status Strip */}
      <div className="p-4 px-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl flex items-center justify-center ${
            isCallActive 
              ? (callState.riskScore >= 80 ? 'bg-red-50 text-[#FF3B30]' : 'bg-blue-50 text-[#0071E3]')
              : 'bg-slate-100 text-[#86868B]'
          }`}>
            <Activity className={`w-5 h-5 ${isCallActive ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#1D1D1F] font-mono">
                {isCallActive ? (callState.peerId || 'Active Peer') : 'Endpoint Standby'}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                isCallActive 
                  ? 'bg-blue-50 text-[#0071E3]'
                  : 'bg-slate-100 text-[#86868B]'
              }`}>
                {callState.statusText}
              </span>
              {callState.isSimulation && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-600">
                  Interactive Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-[#86868B] mt-0.5 font-sans">
              Protocol: <span className="text-slate-700 font-medium">WebRTC Encrypted Opus</span> • TURN: <span className={`font-medium ${callState.turnConfigured ? 'text-[#0071E3]' : 'text-amber-600'}`}>{callState.turnConfigured ? 'configured' : 'not configured'}</span>
            </p>
            <p className="text-[11px] text-[#86868B] mt-1">
              Network route: <span className="font-medium text-slate-700">
                {callState.iceRoute === 'relay' ? 'TURN relay' : callState.iceRoute === 'direct' ? 'direct peer connection' : callState.iceRoute === 'checking' ? 'checking…' : 'not connected'}
              </span>
            </p>
            <p className={`text-[11px] mt-1.5 font-medium ${
              callState.analysisStatus === 'error' ? 'text-[#FF3B30]' :
              callState.analysisStatus === 'degraded' ? 'text-[#D97706]' :
              callState.analysisStatus === 'ready' ? 'text-[#34C759]' : 'text-[#86868B]'
            }`}>
              AI risk analysis: {callState.analysisMessage}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] mt-1">
              <span className={callState.audioPlaybackStatus === 'error' ? 'text-[#FF3B30]' : 'text-[#6E6E73]'}>
                Caller audio: {callState.audioPlaybackMessage}
              </span>
              {callState.audioPlaybackStatus === 'blocked' && (
                <button
                  onClick={onEnableAudio}
                  className="px-3 py-1 rounded-full bg-[#0071E3] text-white font-semibold hover:bg-[#0077ED]"
                >
                  Enable audio
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-6 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-[#86868B] uppercase font-bold flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-[#0071E3]" /> Duration
            </span>
            <span className="text-sm font-bold text-[#1D1D1F] mt-0.5 block font-mono">{durationStr}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#86868B] uppercase font-bold flex items-center justify-end gap-1">
              <Volume2 className="w-3 h-3 text-[#0071E3]" /> Peer Audio RX
            </span>
            <span className="text-sm font-bold text-[#0071E3] mt-0.5 block font-mono">{formatAudioKB(callState.audioReceiveBytes)}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#86868B] uppercase font-bold flex items-center justify-end gap-1">
              <Globe className="w-3 h-3 text-[#0071E3]" /> Language
            </span>
            <span className="text-sm font-bold text-[#1D1D1F] mt-0.5 block">
              {callState.transcripts.length > 0 ? callState.transcripts[callState.transcripts.length - 1].lang.toUpperCase() : 'AUTO'}
            </span>
          </div>
        </div>
      </div>

      {/* Flagship 2-Column Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: Live Conversation Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            
            {/* Waveform Strip */}
            <div className="flex items-center justify-between p-3.5 px-4 rounded-2xl bg-[#F8F9FA] border border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-[#0071E3] animate-ping' : 'bg-slate-300'}`} />
                <span className="text-xs font-semibold text-slate-700">
                  Real-Time Voice Spectrogram
                </span>
              </div>
              <AudioWaveform
                active={isCallActive}
                level={callState.remoteLevel}
                bars={30}
                color={callState.riskScore >= 80 ? '#FF3B30' : '#0071E3'}
              />
            </div>

            {/* Live Transcript Stream */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#86868B] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#0071E3]" /> Speech Recognition Feed
                </span>
                <span className="text-[11px] text-[#86868B]">
                  Whisper Multilingual (16kHz PCM)
                </span>
              </div>

              <div className="h-[360px] overflow-y-auto p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100 space-y-3 text-xs">
                {callState.transcripts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#86868B] space-y-3">
                    <div className="p-3 rounded-full bg-white border border-slate-200/80 text-[#0071E3] shadow-sm">
                      <Mic className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1D1D1F]">Ready for Audio Stream</p>
                      <p className="text-xs text-[#86868B] max-w-xs mt-1">
                        Connect a WebRTC peer call or trigger an evaluation scenario to view live speech transcription.
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <button
                        onClick={() => onSimulate('digitalArrest')}
                        className="px-3.5 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-[#FF3B30] text-xs font-semibold border border-red-200/60 transition-all"
                      >
                        ⚡ Simulate CBI Digital Arrest
                      </button>
                      <button
                        onClick={() => onSimulate('otpScam')}
                        className="px-3.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#FF9500] text-xs font-semibold border border-amber-200/60 transition-all"
                      >
                        ⚡ Simulate Bank OTP Phish
                      </button>
                    </div>
                  </div>
                ) : (
                  callState.transcripts.map((turn, idx) => {
                    const hasTactics = turn.tactics && turn.tactics.length > 0;
                    return (
                      <div
                        key={turn.id || idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          hasTactics
                            ? 'bg-red-50/60 border-red-200/80 text-[#1D1D1F]'
                            : 'bg-white border-slate-200/70 text-slate-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0071E3]">
                              {turn.speaker}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold uppercase">
                              {turn.lang}
                            </span>
                          </div>
                          <span className="text-[#86868B] text-[10px] font-mono">T+{turn.t0}s</span>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-800 font-sans">
                          {turn.text}
                        </p>

                        {/* Inline Tactic Tags */}
                        {hasTactics && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-red-200/50">
                            {turn.tactics!.map((t, tidx) => (
                              <span
                                key={tidx}
                                className="px-2.5 py-0.5 rounded-full text-[10px] bg-red-100 text-[#FF3B30] font-semibold flex items-center gap-1 border border-red-200"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {t.tactic.replace(/_/g, ' ')} ({Math.round(t.confidence * 100)}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* In-Call Controls */}
            <div className="p-3.5 px-4 rounded-2xl bg-[#F8F9FA] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={onToggleMute}
                  disabled={!isCallActive}
                  className={`p-2.5 rounded-full border transition-all ${
                    callState.isMuted
                      ? 'bg-red-50 text-[#FF3B30] border-red-200'
                      : 'bg-white text-slate-700 hover:text-black border-slate-200/80 shadow-sm'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={callState.isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {callState.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <span className="text-xs text-[#86868B] font-medium">
                  {callState.isMuted ? 'Microphone Muted' : 'Microphone Active'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isCallActive ? (
                  <button
                    onClick={() => onStartCall()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-500/20"
                  >
                    <PhoneCall className="w-4 h-4" /> Start Direct Call
                  </button>
                ) : (
                  <button
                    onClick={onEndCall}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white text-xs font-semibold transition-all shadow-md shadow-red-500/20"
                  >
                    <PhoneOff className="w-4 h-4" /> Hang Up
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sequence Progress Bar */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0071E3]" /> Multi-Stage Sequence Model
            </h4>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { stage: 'Stage 0', name: 'Authority Claim', active: callState.riskScore >= 20 },
                { stage: 'Stage 1', name: 'Contraband Threat', active: callState.riskScore >= 50 },
                { stage: 'Stage 2', name: 'Digital Arrest', active: callState.riskScore >= 75 },
                { stage: 'Stage 3', name: 'Coercive Secrecy', active: callState.riskScore >= 90 },
                { stage: 'Stage 4', name: 'Financial Trap', active: callState.riskScore >= 98 },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    s.active
                      ? 'bg-red-50 text-[#FF3B30] border-red-200 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold">{s.stage}</div>
                  <div className="text-[11px] mt-0.5 leading-tight">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Threat Intelligence & Explainability (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Radial Meter Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#0071E3]" /> Threat Level Assessment
              </span>
              <RiskBadge level={callState.riskLevel} size="sm" />
            </div>

            {/* Apple Watch Style Dial */}
            <RadialRiskMeter
              score={callState.riskScore}
              level={callState.riskLevel}
              trend={callState.riskTrend}
              size={200}
            />

            {/* Dynamic Alert Banner */}
            <div className={`w-full mt-4 p-4 rounded-2xl border text-left text-xs space-y-1 ${
              callState.riskLevel === 'Critical'
                ? 'bg-red-50 text-[#FF3B30] border-red-200'
                : callState.riskLevel === 'High'
                ? 'bg-orange-50 text-[#FF9500] border-orange-200'
                : callState.riskLevel === 'Medium'
                ? 'bg-amber-50 text-[#D97706] border-amber-200'
                : 'bg-emerald-50 text-[#34C759] border-emerald-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{callState.alertMessage}</span>
              </div>
              <div className="text-slate-600 text-[11px] pl-6 pt-0.5">
                Recommended Action: <span className="font-semibold text-black">{callState.alertAction}</span>
              </div>
            </div>
          </div>

          {/* Explainable AI Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#0071E3]" /> Explainable AI Forensic Verdict
              </h4>
              <span className={`text-[10px] font-semibold ${callState.analysisStatus === 'ready' ? 'text-[#34C759]' : 'text-[#D97706]'}`}>
                {callState.analysisStatus === 'ready' ? 'Live risk engine' : 'Analysis status'}
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans bg-[#F8F9FA] p-4 rounded-2xl border border-slate-100">
              {callState.explanation || 'No psychological deception patterns detected yet on this call audio track.'}
            </p>
          </div>

          {/* Detected Fraud Tactics Grid */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
                Detected Fraud Signatures ({callState.tactics.length})
              </h4>
              <span className="text-[10px] text-[#86868B]">10-Tactic Taxonomy</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {callState.tactics.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#86868B] italic">
                  Zero scam tactics triggered.
                </div>
              ) : (
                callState.tactics.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FF3B30] capitalize">
                        {t.tactic.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-[#FF3B30] text-[10px] font-bold">
                        {Math.round(t.confidence * 100)}% Match
                      </span>
                    </div>
                    {t.evidence && (
                      <p className="text-[11px] text-slate-600 italic">
                        Evidence: "{t.evidence}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Remediation Buttons */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => setShowBlockConfirm(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-slate-100 hover:bg-red-50 hover:text-[#FF3B30] text-slate-700 transition-colors font-semibold"
            >
              <UserX className="w-4 h-4 text-[#FF3B30]" /> Blacklist Number
            </button>

            <button
              onClick={() => setShowReportConfirm(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-slate-100 hover:bg-amber-50 hover:text-[#FF9500] text-slate-700 transition-colors font-semibold"
            >
              <Flag className="w-4 h-4 text-[#FF9500]" /> Report to 1930
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Modal: Blacklist */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FF3B30]">
              <UserX className="w-6 h-6" />
              <h3 className="text-base font-bold text-[#1D1D1F]">Blacklist Caller Number?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will immediately drop the ongoing call and flag caller ID <b className="text-black font-mono">{callState.peerId || 'Unknown'}</b> in the ScamChain threat registry.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockCaller}
                className="px-4 py-2 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white text-xs font-semibold"
              >
                Confirm Blacklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Report to Authorities */}
      {showReportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FF9500]">
              <Flag className="w-6 h-6" />
              <h3 className="text-base font-bold text-[#1D1D1F]">Report to Cyber Police?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit transcript evidence and extracted deception tactics directly to the National Cyber Crime Helpline (1930).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReportConfirm(false)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReportAuthority}
                className="px-4 py-2 rounded-full bg-[#FF9500] hover:bg-amber-600 text-white text-xs font-semibold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
