import React from 'react';
import { PIPELINE_STAGES } from '../../services/mockData';
import { 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Zap, 
  Layers, 
  Terminal, 
  Sparkles,
  ShieldAlert,
  GitBranch
} from 'lucide-react';

export const ModelsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-xs text-cyber-cyan uppercase font-bold tracking-wider">
          <Cpu className="w-4 h-4" /> Multi-Stage Detection Topology
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Sequence-Aware AI Pipeline Architecture
        </h2>
        <p className="text-xs text-slate-400 font-sans max-w-3xl leading-relaxed">
          Unlike legacy keyword scanners, ScamChain detects the **chronological progression** and **combination of psychological tactics** (e.g. Authority Claim → Threat → Coercive Digital Arrest → Wire Transfer). Individual components operate asynchronously with end-to-end latency under 600ms.
        </p>
      </div>

      {/* Visual Pipeline Flow Sequence */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyber-cyan" /> End-to-End Processing Topology
        </h3>

        {/* Visual pipeline block steps */}
        <div className="space-y-4">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-5 rounded-2xl bg-cyber-surface/40 border border-cyber-border/70 hover:border-cyber-cyan/40 transition-all space-y-3 relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 flex items-center justify-center text-xs font-bold font-mono">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{stage.name}</h4>
                    <p className="text-[11px] text-cyber-cyan font-mono">{stage.engine}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-cyber-emerald bg-cyber-emerald/10 px-2.5 py-1 rounded-full border border-cyber-emerald/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Healthy</span>
                  </span>
                  <span className="text-slate-400 bg-cyber-bg px-2.5 py-1 rounded-lg border border-cyber-border">
                    Latency: <b className="text-white">{stage.latencyMs}ms</b>
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {stage.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1 text-slate-400">
                <div className="p-2.5 rounded-lg bg-cyber-bg/60 border border-cyber-border/40 truncate">
                  <span className="text-slate-500 uppercase text-[9px] block">Input Stream:</span>
                  <span className="text-slate-300 font-mono">{stage.inputFormat}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyber-bg/60 border border-cyber-border/40 truncate">
                  <span className="text-slate-500 uppercase text-[9px] block">Output Schema:</span>
                  <span className="text-cyber-cyan font-mono">{stage.outputFormat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sequence Awareness Deep Dive Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyber-card via-cyber-card to-cyber-surface/60 border border-cyber-border shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-cyber-red font-bold text-sm uppercase">
          <GitBranch className="w-4 h-4" /> Why Keyword Scanners Fail & Why Sequence-Aware AI Wins
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          <div className="p-4 rounded-xl bg-cyber-bg/70 border border-cyber-border/60 space-y-2">
            <h5 className="font-bold text-slate-400 uppercase font-mono text-[11px]">
              ❌ Traditional Keyword Matching
            </h5>
            <p className="text-slate-300 leading-relaxed">
              Triggers heavy false alarms when benign callers say words like "police station" or "verification". Conversely, scammers easily bypass keyword filters by using regional euphemisms ("parikshan", "shanti se suno").
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyber-red/10 border border-cyber-red/30 space-y-2">
            <h5 className="font-bold text-cyber-red uppercase font-mono text-[11px]">
              ✓ ScamChain Multi-Stage Sequence Model
            </h5>
            <p className="text-slate-200 leading-relaxed">
              Models fraud as a chronological Directed Acyclic Graph (DAG). An OTP demand by itself is normal in 2FA; however, an <b>OTP request preceded by a Law Enforcement claim and Digital Arrest order</b> triggers an immediate 100% Critical Alert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

