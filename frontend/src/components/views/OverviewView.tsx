import React from 'react';
import { CallRecord, NavTab } from '../../types';
import { WebRTCState } from '../../services/webrtc';
import { RiskBadge } from '../common/RiskBadge';
import { AudioWaveform } from '../common/AudioWaveform';
import { 
  ShieldCheck, 
  ShieldAlert, 
  PhoneCall, 
  PhoneOff, 
  TrendingUp, 
  ArrowUpRight, 
  Activity, 
  Radio, 
  Eye, 
  Flame, 
  Globe 
} from 'lucide-react';

interface OverviewViewProps {
  onSelectTab: (tab: NavTab) => void;
  callState: WebRTCState;
  onStartCall: (toId?: string) => void;
  onEndCall: () => void;
  onSimulate: (key: 'digitalArrest' | 'otpScam' | 'benignCall') => void;
  onInspectCall: (call: CallRecord) => void;
  historicCalls: CallRecord[];
  dialNumber: string;
  setDialNumber: (val: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onSelectTab,
  callState,
  onStartCall,
  onEndCall,
  onSimulate,
  onInspectCall,
  historicCalls,
  dialNumber,
  setDialNumber
}) => {
  const isCallActive = callState.callState === 'connected' || callState.callState === 'calling';
  const recentThreats = historicCalls.slice(0, 5);

  const stats = [
    {
      title: 'Total Calls Analyzed',
      value: '1,284',
      change: '+14.2%',
      isPositive: true,
      timeframe: 'vs last week',
      icon: <PhoneCall className="w-5 h-5 text-[#0071E3]" />,
      bg: 'bg-blue-50/60 text-[#0071E3]'
    },
    {
      title: 'Scam Calls Detected',
      value: '142',
      change: '11.1%',
      isPositive: false,
      timeframe: 'fraud rate',
      icon: <ShieldAlert className="w-5 h-5 text-[#FF3B30]" />,
      bg: 'bg-red-50/60 text-[#FF3B30]'
    },
    {
      title: 'Losses Prevented',
      value: '₹48.2 L',
      change: '+22.5%',
      isPositive: true,
      timeframe: 'estimated savings',
      icon: <ShieldCheck className="w-5 h-5 text-[#34C759]" />,
      bg: 'bg-emerald-50/60 text-[#34C759]'
    },
    {
      title: 'Detection Accuracy',
      value: '98.6%',
      change: '+0.8%',
      isPositive: true,
      timeframe: '0.4s MTTD latency',
      icon: <Activity className="w-5 h-5 text-[#FF9500]" />,
      bg: 'bg-amber-50/60 text-[#FF9500]'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Apple Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#0071E3]/10 text-[#0071E3]">
            <span>Active AI Shield v2.4</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1D1D1F] font-sans">
            Your conversations. <span className="text-[#0071E3]">Your protection.</span>
          </h1>
          <p className="text-sm text-[#6E6E73] max-w-2xl leading-relaxed">
            Real-time conversational threat intelligence that analyzes voice nuances, detects psychological deception scripts, and stops scams before money is lost.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => onSimulate('digitalArrest')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-[#FF3B30] text-xs font-semibold border border-red-200/60 transition-all shadow-sm"
          >
            <Flame className="w-4 h-4" /> Simulate Digital Arrest
          </button>
          <button
            onClick={() => onSelectTab('live-call')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-all shadow-md shadow-[#0071E3]/20"
          >
            <Radio className="w-4 h-4" /> Live Call Monitor
          </button>
        </div>
      </div>

      {/* 4 Statistics Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:shadow-apple-hover transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#86868B] font-medium tracking-tight">
                {s.title}
              </span>
              <div className={`p-2.5 rounded-2xl ${s.bg}`}>
                {s.icon}
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
                {s.value}
              </span>
              <span className="text-xs font-semibold text-[#34C759] flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> {s.change}
              </span>
            </div>

            <div className="text-[11px] text-[#86868B]">
              {s.timeframe}
            </div>
          </div>
        ))}
      </div>

      {/* Live Monitoring Hero Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl flex items-center justify-center ${
              isCallActive ? 'bg-red-50 text-[#FF3B30]' : 'bg-blue-50 text-[#0071E3]'
            }`}>
              <Radio className={`w-6 h-6 ${isCallActive ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight">
                  Conversational Threat Surveillance
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                  isCallActive 
                    ? 'bg-red-100 text-[#FF3B30] animate-pulse'
                    : 'bg-emerald-100 text-[#34C759]'
                }`}>
                  {isCallActive ? 'Active Call In Progress' : 'Standby • Ready'}
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Continuously analyzes acoustic frames and semantics across incoming voice stream.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {!isCallActive ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Target Phone ID"
                  className="px-3.5 py-2 rounded-full bg-[#F2F2F7] border border-transparent focus:border-[#0071E3] text-xs text-[#1D1D1F] placeholder-[#86868B] w-36 focus:outline-none font-medium font-mono"
                />
                <button
                  onClick={() => onStartCall()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Start Call
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectTab('live-call')}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D1D1F] text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0071E3]" /> View Full Analysis
                </button>
                <button
                  onClick={onEndCall}
                  className="px-4 py-2 rounded-full bg-[#FF3B30] hover:bg-red-600 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <PhoneOff className="w-3.5 h-3.5" /> End Call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F8F9FA] border border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Connected Peer</span>
            <p className="text-sm font-semibold text-[#1D1D1F] font-mono mt-0.5">
              {isCallActive ? (callState.peerId || 'Connected Line') : 'None (Standby)'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Call Duration</span>
            <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">
              {isCallActive ? `${String(Math.floor(callState.durationSec / 60)).padStart(2, '0')}:${String(callState.durationSec % 60).padStart(2, '0')}` : '00:00'}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Current Risk Score</span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`text-base font-extrabold font-mono ${
                callState.riskScore >= 80 ? 'text-[#FF3B30]' : callState.riskScore >= 60 ? 'text-[#FF9500]' : callState.riskScore >= 30 ? 'text-[#D97706]' : 'text-[#34C759]'
              }`}>
                {callState.riskScore}%
              </span>
              <RiskBadge level={callState.riskLevel} size="sm" />
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Audio Spectrogram</span>
            <div className="mt-0.5">
              <AudioWaveform active={isCallActive} level={callState.remoteLevel} bars={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Threats Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FF3B30]" /> Recent Flagged Conversations
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5">
              Recent suspected scam calls mitigated across protected endpoints.
            </p>
          </div>

          <button
            onClick={() => onSelectTab('history')}
            className="flex items-center gap-1 text-xs text-[#0071E3] font-semibold hover:underline"
          >
            <span>View All Records</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[#86868B] uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-3">Caller</th>
                <th className="py-3 px-3">Language</th>
                <th className="py-3 px-3">Threat Type</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentThreats.map((call) => (
                <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-[#1D1D1F] font-mono">{call.callerId}</div>
                    <div className="text-[10px] text-[#86868B]">{call.id}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Globe className="w-3.5 h-3.5 text-[#0071E3]" /> {call.language}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-medium text-[#1D1D1F]">
                    {call.scamType}
                  </td>
                  <td className="py-3.5 px-3">
                    <RiskBadge level={call.riskLevel} score={call.riskScore} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 text-[#86868B]">
                    {call.timestamp}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onInspectCall(call)}
                      className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0071E3] text-xs transition-colors font-semibold"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
