import React from 'react';
import { CallRecord } from '../../types';
import { RiskBadge } from './RiskBadge';
import { X, ShieldAlert, Clock, Phone, Globe, Shield, Terminal, FileText, CheckCircle2 } from 'lucide-react';

interface CallInspectModalProps {
  call: CallRecord | null;
  onClose: () => void;
}

export const CallInspectModal: React.FC<CallInspectModalProps> = ({ call, onClose }) => {
  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white border border-slate-200/80 rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Apple Style Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-[#0071E3] shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1D1D1F] font-sans">{call.id}</h3>
                <RiskBadge level={call.riskLevel} score={call.riskScore} size="sm" />
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  {call.status}
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">{call.scamType}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#1D1D1F] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86868B] flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#0071E3]" /> Caller ID
              </span>
              <p className="text-sm font-semibold text-[#1D1D1F] font-mono mt-1">{call.callerId}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86868B] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#0071E3]" /> Duration
              </span>
              <p className="text-sm font-semibold text-[#1D1D1F] mt-1">{call.duration}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86868B] flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#0071E3]" /> Language
              </span>
              <p className="text-sm font-semibold text-[#1D1D1F] mt-1">{call.language}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[#86868B] flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#0071E3]" /> Risk Score
              </span>
              <p className="text-sm font-bold font-mono text-[#FF3B30] mt-1">{call.riskScore}%</p>
            </div>
          </div>

          {/* Explainable AI Forensic Verdict */}
          {call.explanation && (
            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#FF3B30] text-xs font-bold uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5" /> Explainable AI Forensic Verdict
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {call.explanation}
              </p>
            </div>
          )}

          {/* Detected Fraud Tactics Chips */}
          <div>
            <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2.5">
              Detected Tactic Signatures ({call.tactics.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {call.tactics.map((tactic, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700 font-medium flex items-center gap-1.5 border border-slate-200/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
                  {tactic.replace(/_/g, ' ')}
                </span>
              ))}
              {call.tactics.length === 0 && (
                <span className="text-xs text-[#86868B] italic">No malicious tactics triggered during this session.</span>
              )}
            </div>
          </div>

          {/* Complete Call Transcript */}
          <div>
            <h4 className="text-xs font-bold text-[#86868B] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0071E3]" /> Forensic Call Transcript
            </h4>
            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 max-h-56 overflow-y-auto">
              {call.fullTranscript && call.fullTranscript.length > 0 ? (
                call.fullTranscript.map((turn) => (
                  <div key={turn.id} className="text-xs space-y-0.5 pb-2 border-b border-slate-200/50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className={`font-semibold ${turn.speaker === 'Caller' ? 'text-[#0071E3]' : 'text-slate-600'}`}>
                        {turn.speaker} [{turn.lang}]
                      </span>
                      <span>T+{turn.t0}s</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">{turn.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-600 italic">
                  "{call.transcriptSnippet}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <span className="text-xs text-[#86868B] flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-[#34C759]" /> Cryptographically verified session
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
