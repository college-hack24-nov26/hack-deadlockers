import React, { useState } from 'react';
import { THREAT_ANALYTICS } from '../../services/mockData';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { ShieldAlert, AlertTriangle, Globe, MapPin, Filter, ArrowUpRight, ShieldCheck, Flame } from 'lucide-react';

export const ThreatsView: React.FC = () => {
  const [filterPeriod, setFilterPeriod] = useState('7d');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-cyber-red" />
            Global Threat Vectors & Tactic Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Aggregated conversational deception vectors, regional attack clusters, and emerging fraud scripts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Timeframe:
          </span>
          {['24h', '7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                filterPeriod === p
                  ? 'bg-cyber-cyan text-black border-cyber-cyan font-bold'
                  : 'bg-cyber-surface text-slate-400 hover:text-white border-cyber-border'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid 1: Scam Categories Pie & Language Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Common Scam Categories */}
        <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-cyber-red" /> Dominant Fraud Archetypes
            </h3>
            <span className="text-xs text-slate-500">142 Cases</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={THREAT_ANALYTICS.categories}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {THREAT_ANALYTICS.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#080D18" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0E1524', borderColor: '#253044', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-cyber-border/40">
            {THREAT_ANALYTICS.categories.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                  <span className="text-slate-300 truncate max-w-xs">{cat.name}</span>
                </div>
                <span className="font-bold text-white">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spoken Dialect & Code-Switch Distribution */}
        <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyber-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyber-cyan" /> Dialect Code-Switching Breakdown
            </h3>
            <span className="text-xs text-slate-500">Whisper Lang ID</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={THREAT_ANALYTICS.languages}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                >
                  {THREAT_ANALYTICS.languages.map((entry, index) => (
                    <Cell key={`cell-lang-${index}`} fill={entry.fill} stroke="#080D18" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0E1524', borderColor: '#253044', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-cyber-border/40">
            {THREAT_ANALYTICS.languages.map((l, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.fill }} />
                  <span className="text-slate-300">{l.name}</span>
                </div>
                <span className="font-bold text-white">{l.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid 2: Psychological Tactic Frequency Horizontal Bar Chart */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-cyber-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyber-amber" /> 10-Tactic Vector Trigger Frequency
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Frequency of extracted psychological manipulation markers across the monitored voice corpus.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30">
            Groq LPU Validated
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={THREAT_ANALYTICS.tacticsFrequency}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 140, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748B" fontSize={11} />
              <YAxis dataKey="tactic" type="category" stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0E1524', borderColor: '#253044', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
              />
              <Bar dataKey="occurrences" fill="#00D4FF" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 3: Active Advisory Bulletin Feed */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyber-red" /> Regional Threat Advisories & Origin Clusters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-cyber-surface/50 border border-cyber-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyber-red">Mewat / Jamtara Cluster</span>
              <span className="text-[10px] text-slate-500">Active High</span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Electricity bill cut-off phishing with instructions to install malicious APKs over WhatsApp.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyber-surface/50 border border-cyber-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyber-red">Delhi NCR / Mumbai VoIP</span>
              <span className="text-[10px] text-slate-500">Critical Wave</span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              Coordinated Digital Arrest scripts using fake Supreme Court stamps and police uniforms on video calls.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-cyber-surface/50 border border-cyber-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyber-amber">Bengaluru Tech Corridor</span>
              <span className="text-[10px] text-slate-500">Elevated</span>
            </div>
            <p className="text-xs text-slate-300 font-sans">
              FedEx international parcel customs extortion with non-traceable cryptocurrency payment requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

