import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const getColors = () => {
    switch (level) {
      case 'Critical':
        return 'bg-red-50 text-[#FF3B30] border-red-200/80 shadow-sm';
      case 'High':
        return 'bg-orange-50 text-[#FF9500] border-orange-200/80 shadow-sm';
      case 'Medium':
        return 'bg-amber-50 text-[#D97706] border-amber-200/80 shadow-sm';
      case 'Low':
      default:
        return 'bg-emerald-50 text-[#34C759] border-emerald-200/80 shadow-sm';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-[11px]';
      case 'lg':
        return 'px-3.5 py-1.5 text-xs font-semibold';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-xs font-medium';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-tight font-sans ${getColors()} ${getSizeClasses()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        level === 'Critical' 
          ? 'bg-[#FF3B30] animate-pulse' 
          : level === 'High' 
          ? 'bg-[#FF9500]' 
          : level === 'Medium' 
          ? 'bg-[#D97706]' 
          : 'bg-[#34C759]'
      }`} />
      <span className="font-semibold">{level}</span>
      {score !== undefined && <span className="opacity-80 font-mono">({Math.round(score)}%)</span>}
    </span>
  );
};
