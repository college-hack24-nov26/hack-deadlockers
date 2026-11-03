import React, { useState } from 'react';
import { NavTab } from '../../types';
import { 
  Search, 
  Bell, 
  PhoneCall, 
  PlayCircle, 
  ShieldCheck, 
  Phone, 
  ChevronRight,
  Flame,
  Lock
} from 'lucide-react';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  dialNumber: string;
  setDialNumber: (val: string) => void;
  onStartCall: (toId?: string) => void;
  onSimulate: (key: 'digitalArrest' | 'otpScam' | 'benignCall') => void;
  isCallActive: boolean;
  myId: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  dialNumber,
  setDialNumber,
  onStartCall,
  onSimulate,
  isCallActive,
  myId
}) => {
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview Dashboard';
      case 'live-call': return 'Live Call Intelligence';
      case 'history': return 'Forensic Call Records';
      case 'settings': return 'Settings';
    }
  };

  return (
    <header className="h-16 px-6 bg-white/85 backdrop-blur-xl border-b border-[#E5E5EA] flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-apple-sm">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#86868B] hover:text-[#1D1D1F] cursor-pointer font-medium" onClick={() => onSelectTab('overview')}>
          ScamChain
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-[#86868B]" />
        <span className="text-[#1D1D1F] font-semibold">{getBreadcrumbTitle()}</span>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Call Dialer Input */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-full bg-[#F2F2F7] border border-slate-200/80">
          <div className="flex items-center px-2 py-0.5 gap-1 text-[#86868B] text-xs">
            <Phone className="w-3.5 h-3.5 text-[#0071E3]" />
            <span className="text-[11px] text-[#86868B]">To:</span>
          </div>
          <input
            type="text"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            placeholder="e.g. 1002"
            className="w-20 bg-transparent text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none font-medium font-mono"
          />
          <button
            onClick={() => onStartCall()}
            disabled={isCallActive}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#34C759] hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call
          </button>
        </div>

        {/* Live Simulation Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSimMenu(!showSimMenu)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-[#E5E5EA] text-xs font-semibold text-[#0071E3] transition-all shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>Simulate Scam</span>
          </button>

          {showSimMenu && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E5EA] rounded-2xl shadow-apple-modal p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowSimMenu(false)}
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#86868B] tracking-wider">
                Evaluation Scenarios
              </div>
              <button
                onClick={() => { onSimulate('digitalArrest'); setShowSimMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-slate-700 hover:text-[#FF3B30] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Flame className="w-3.5 h-3.5 text-[#FF3B30]" /> Digital Arrest (CBI)
                </span>
                <span className="text-[11px] text-[#FF3B30] font-bold">100%</span>
              </button>
              <button
                onClick={() => { onSimulate('otpScam'); setShowSimMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50 text-slate-700 hover:text-[#FF9500] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#FF9500]" /> Bank OTP Phishing
                </span>
                <span className="text-[11px] text-[#FF9500] font-bold">98%</span>
              </button>
              <button
                onClick={() => { onSimulate('benignCall'); setShowSimMenu(false); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-[#34C759] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#34C759]" /> Safe Resident Call
                </span>
                <span className="text-[11px] text-[#34C759] font-bold">0%</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F2F2F7] border border-transparent focus-within:border-[#0071E3] text-xs text-[#86868B] transition-all">
          <Search className="w-3.5 h-3.5 text-[#86868B]" />
          <input
            type="text"
            placeholder="Search threats..."
            className="w-36 bg-transparent text-[#1D1D1F] placeholder-[#86868B] focus:outline-none text-xs"
          />
        </div>

        {/* System Line Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F2F7] text-xs font-medium text-[#1D1D1F]">
          <span className="w-2 h-2 rounded-full bg-[#34C759]" />
          <span>Line: <b>{myId}</b></span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] flex items-center justify-center transition-colors shadow-sm"
          >
            <Bell className="w-4 h-4" />
          </button>

          {showNotifMenu && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E5EA] rounded-2xl shadow-apple-modal p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setShowNotifMenu(false)}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-[#1D1D1F]">Live Alerts</span>
                <span className="text-[10px] text-[#0071E3] font-semibold">Real-Time</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-100 space-y-1">
                <div className="font-bold text-[#FF3B30] text-[11px]">
                  CBI Impersonation Surge
                </div>
                <p className="text-slate-600 text-[11px] leading-snug">Multiple Digital Arrest scripts detected in regional circle.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
