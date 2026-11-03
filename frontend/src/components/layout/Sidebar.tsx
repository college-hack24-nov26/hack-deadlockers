import React from 'react';
import { NavTab } from '../../types';
import { 
  ShieldAlert, 
  Activity, 
  Radio, 
  History, 
  Zap, 
  Server,
  Settings as SettingsIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCallActive: boolean;
  riskLevel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCallActive,
  riskLevel
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { 
      id: 'live-call', 
      label: 'Live Call Analysis', 
      icon: <Radio className="w-4 h-4" />, 
      badge: isCallActive ? (riskLevel || 'LIVE') : undefined 
    },
    { id: 'history', label: 'Call History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#FBFBFD] border-r border-[#E5E5EA] flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E5E5EA]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#0A84FF] text-white shadow-md shadow-[#0071E3]/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-[#1D1D1F] font-sans">
                  Scam<span className="text-[#0071E3]">Chain</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 font-semibold rounded-md bg-[#0071E3]/10 text-[#0071E3]">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] font-medium">Threat Defense</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-[#86868B] uppercase">
            Menu
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const isLive = item.id === 'live-call' && isCallActive;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-white text-[#0071E3] font-semibold shadow-sm border border-slate-200/80'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F2F2F7] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`transition-colors ${isActive ? 'text-[#0071E3]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${
                    isLive ? 'bg-red-100 text-[#FF3B30] animate-pulse' : 'bg-blue-100 text-[#0071E3]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Telemetry & Status */}
      <div className="p-4 border-t border-[#E5E5EA]/80 space-y-3">
        {/* AI & Relay Health Indicator */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#6E6E73] flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-[#0071E3]" /> AI Engine
            </span>
            <span className="flex items-center gap-1 text-[#34C759] font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              Active
            </span>
          </div>
          <div className="text-[11px] text-[#86868B] truncate">
            Groq LPU (Qwen-3.8) + Whisper
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-[#6E6E73] flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#0071E3]" /> Voice transport
            </span>
            <span className="text-[#0071E3] font-semibold">WebRTC</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pt-1 px-1">
          <div className="w-8 h-8 rounded-full bg-[#0071E3] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            SK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#1D1D1F] truncate">Shivam Khade</div>
            <div className="text-[11px] text-[#86868B] truncate">Security Analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
