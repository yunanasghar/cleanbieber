import React from 'react';
import { CheckSquare } from 'lucide-react';

interface CleanBieberLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export default function CleanBieberLogo({
  className = '',
  size = 32,
  showText = true,
  textColor = 'text-white',
}: CleanBieberLogoProps) {
  // Compute icon size relative to box
  const iconSize = Math.max(14, Math.round(size * 0.55));

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Original CleanBieber Icon: Blue square with CheckSquare */}
      <div
        className="shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shadow-blue-500/25"
        style={{ width: size, height: size }}
      >
        <CheckSquare style={{ width: iconSize, height: iconSize }} className="stroke-[2.5]" />
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`text-[17px] font-bold tracking-tight ${textColor} leading-tight`}>
            Clean<span className="text-blue-500">Bieber</span>
          </span>
        </div>
      )}
    </div>
  );
}
