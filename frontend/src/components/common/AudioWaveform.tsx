import React from 'react';

interface AudioWaveformProps {
  active: boolean;
  level?: number;
  bars?: number;
  color?: string;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  active,
  level = 30,
  bars = 24,
  color = '#0071E3',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-[3px] h-8 px-2 py-1 ${className}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const variance = Math.sin(i * 0.6) * 0.4 + 0.6;
        const normalizedLevel = active ? Math.max(15, Math.min(100, level * variance)) : 10;
        const barHeight = active ? `${Math.round((normalizedLevel / 100) * 26 + 4)}px` : '4px';

        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-150"
            style={{
              height: barHeight,
              backgroundColor: active ? color : '#E5E5EA',
              opacity: active ? (i % 2 === 0 ? 0.95 : 0.7) : 0.6,
            }}
          />
        );
      })}
    </div>
  );
};
