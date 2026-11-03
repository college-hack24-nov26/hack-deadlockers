import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RadialRiskMeterProps {
  score: number;
  level: RiskLevel;
  trend?: 'rising' | 'falling' | 'stable';
  size?: number;
}

export const RadialRiskMeter: React.FC<RadialRiskMeterProps> = ({
  score,
  level,
  trend = 'stable',
  size = 210
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * (circumference * 0.75);

  const getColorInfo = () => {
    if (score >= 80 || level === 'Critical') {
      return {
        stroke: '#FF3B30',
        glow: 'rgba(255, 59, 48, 0.2)',
        bg: 'bg-red-50 text-[#FF3B30] border-red-200',
        text: 'text-[#FF3B30]',
        label: 'CRITICAL THREAT',
        icon: <ShieldAlert className="w-8 h-8 text-[#FF3B30] animate-pulse" />
      };
    }
    if (score >= 60 || level === 'High') {
      return {
        stroke: '#FF9500',
        glow: 'rgba(255, 149, 0, 0.2)',
        bg: 'bg-orange-50 text-[#FF9500] border-orange-200',
        text: 'text-[#FF9500]',
        label: 'HIGH RISK',
        icon: <AlertTriangle className="w-8 h-8 text-[#FF9500]" />
      };
    }
    if (score >= 30 || level === 'Medium') {
      return {
        stroke: '#D97706',
        glow: 'rgba(217, 119, 6, 0.15)',
        bg: 'bg-amber-50 text-[#D97706] border-amber-200',
        text: 'text-[#D97706]',
        label: 'SUSPICIOUS',
        icon: <AlertTriangle className="w-8 h-8 text-[#D97706]" />
      };
    }
    return {
      stroke: '#34C759',
      glow: 'rgba(52, 199, 89, 0.15)',
      bg: 'bg-emerald-50 text-[#34C759] border-emerald-200',
      text: 'text-[#34C759]',
      label: 'SAFE CONVERSATION',
      icon: <ShieldCheck className="w-8 h-8 text-[#34C759]" />
    };
  };

  const col = getColorInfo();

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-135">
          {/* Apple Clean Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
          />
          {/* Active Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={col.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="mb-0.5">
            {col.icon}
          </div>
          <div className="flex items-baseline">
            <span className="text-4xl font-extrabold tracking-tight font-sans text-[#1D1D1F]">
              {Math.round(score)}
            </span>
            <span className="text-base font-semibold text-[#86868B] ml-0.5">%</span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
            Risk Score
          </span>
        </div>
      </div>

      {/* Threat Status Badge & Trend */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${col.bg}`}
        >
          {col.label}
        </span>

        {trend === 'rising' && (
          <span className="flex items-center text-xs font-semibold text-[#FF3B30] gap-0.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            <TrendingUp className="w-3.5 h-3.5" /> Escalating
          </span>
        )}
        {trend === 'falling' && (
          <span className="flex items-center text-xs font-semibold text-[#34C759] gap-0.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <TrendingDown className="w-3.5 h-3.5" /> Decreasing
          </span>
        )}
        {trend === 'stable' && (
          <span className="flex items-center text-xs font-medium text-[#86868B] gap-0.5 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <Minus className="w-3.5 h-3.5" /> Stable
          </span>
        )}
      </div>
    </div>
  );
};
