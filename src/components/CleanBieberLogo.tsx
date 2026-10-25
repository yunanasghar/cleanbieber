import React from 'react';

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
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Monogram CB Icon with subtle sparkle */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Subtle circular boundary ring */}
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeDasharray="2 2"
            className="opacity-40"
          />

          {/* Letter C curve */}
          <path
            d="M 22 11 C 14 11 10 15 10 20 C 10 25 14 29 22 29"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Letter B stems and lobes interconnected */}
          <path
            d="M 18 12 L 18 28 M 18 12 H 24 C 27 12 28.5 14 28.5 16.5 C 28.5 19 26.5 20 23.5 20 M 18 20 H 24 C 27.5 20 29 22 29 25 C 29 28 26.5 28 23 28 H 18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Sparkle star top-left */}
          <path
            d="M 8 10 L 9 12 L 11 13 L 9 14 L 8 16 L 7 14 L 5 13 L 7 12 Z"
            fill="currentColor"
            className="opacity-80"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className={`text-[17px] font-semibold tracking-tight ${textColor} leading-tight`}>
            CleanBieber
          </span>
        </div>
      )}
    </div>
  );
}
