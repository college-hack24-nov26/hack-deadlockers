import React from 'react';
import { THREAT_ANALYTICS } from '../../services/mockData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid 
} from 'recharts';
import { BarChart3, TrendingUp, Activity, CheckCircle, Shield, Zap, Clock } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const riskHistogram = [
    { range: '0-20% (Safe)', count: 840, fill: '#10B981' },
    { range: '21-40% (Mild)', count: 180, fill: '#10B981' },
    { range: '41-60% (Suspicious)', count: 92, fill: '#FFB020' },
    { range: '61-80% (High Risk)', count: 78, fill: '#FB923C' },
    { range: '81-100% (Critical)', count: 94, fill: '#FF4757' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-cyber-cyan" />
          Conversational Telemetry & Detection Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-sans">
          Longitudinal analysis of call volumes, fraud conversion velocity, model confidence ratings, and pipeline latency.
        </p>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-md space-y-2">
          <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyber-cyan" /> Mean Time to Detect (MTTD)
          </span>
          <div className="text-2xl font-extrabold text-white">4.2s</div>
          <span className="text-[10px] text-cyber-emerald flex items-center font-bold">
            <TrendingUp className="w-3 h-3 mr-0.5" /> 820ms faster than baseline
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-md space-y-2">
          <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyber-cyan" /> Mean Confidence Rating
          </span>
          <div className="text-2xl font-extrabold text-white">96.4%</div>
          <span className="text-[10px] text-slate-500">Across 10 deception vectors</span>
        </div>

        <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-md space-y-2">
          <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyber-cyan" /> False Positive Rate
          </span>
          <div className="text-2xl font-extrabold text-cyber-emerald">&lt; 0.4%</div>
          <span className="text-[10px] text-cyber-emerald font-bold">Asymmetric filter verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border shadow-md space-y-2">
          <span className="text-[11px] text-slate-400 uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyber-cyan" /> End-to-End Latency
          </span>
          <div className="text-2xl font-extrabold text-cyber-cyan">580ms</div>
          <span className="text-[10px] text-slate-500">Audio chunk to UI meter</span>
        </div>
      </div>

      {/* Area Chart: 7-Day Trend (Calls vs Scams) */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Weekly Call Volume vs Detected Threat Progression
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Comparing daily total processed calls against flagged scam conversations.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-300">
              <span className="w-3 h-3 rounded bg-cyber-cyan" /> Total Calls
            </span>
            <span className="flex items-center gap-1 text-cyber-red">
              <span className="w-3 h-3 rounded bg-cyber-red" /> Malicious
            </span>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={THREAT_ANALYTICS.trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="callGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="scamGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4757" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#FF4757" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1B2537" strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1524', borderColor: '#253044', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="calls" stroke="#00D4FF" strokeWidth={2} fillOpacity={1} fill="url(#callGradient)" />
              <Area type="monotone" dataKey="scams" stroke="#FF4757" strokeWidth={2} fillOpacity={1} fill="url(#scamGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart: Risk Score Distribution Histogram */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Risk Score Distribution Histogram
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Population distribution of calls across risk bands (bimodal distribution shows clear separation of benign vs scam calls).
            </p>
          </div>
          <span className="text-xs text-cyber-emerald">Bimodal Separation</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskHistogram} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1B2537" strokeDasharray="3 3" />
              <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1524', borderColor: '#253044', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="count" fill="#00D4FF" radius={[6, 6, 0, 0]}>
                {riskHistogram.map((entry, index) => (
                  <Bar key={`cell-${index}`} dataKey="count" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

