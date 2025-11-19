/**
 * XP Progress Bar Component
 * 
 * Displays crew/agent XP progression with holographic gradient,
 * glow animations, and level information.
 * 
 * Features:
 * - Animated fill with smooth transitions
 * - Holographic gradient (cyan → red → purple)
 * - Glowing borders and shadows
 * - Level badges on both ends
 * - Percentage display
 * - Responsive sizing
 */

import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

export interface XPProgressBarProps {
  /** Current XP value */
  currentXP: number;
  
  /** XP required for next level */
  nextLevelXP: number;
  
  /** Current level */
  currentLevel: number;
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show percentage text */
  showPercentage?: boolean;
  
  /** Show level badges */
  showLevels?: boolean;
  
  /** Enable glow animation */
  animated?: boolean;
  
  /** Custom CSS class */
  className?: string;
}

export const XPProgressBar: React.FC<XPProgressBarProps> = ({
  currentXP,
  nextLevelXP,
  currentLevel,
  size = 'md',
  showPercentage = true,
  showLevels = true,
  animated = true,
  className = '',
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  
  // Calculate XP within current level
  const previousLevelXP = currentLevel > 1 ? getPreviousLevelThreshold(currentLevel) : 0;
  const xpInCurrentLevel = currentXP - previousLevelXP;
  const xpNeededForLevel = nextLevelXP - previousLevelXP;
  const percentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForLevel) * 100));
  
  // Size classes
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };
  
  // Animate fill on mount and when XP changes
  useEffect(() => {
    if (fillRef.current && animated) {
      animate(fillRef.current, {
        width: [`0%`, `${percentage}%`],
        opacity: [0, 1],
        easing: 'easeOutCubic',
        duration: 1500,
      });
    }
  }, [percentage, animated]);
  
  // Pulse glow animation
  useEffect(() => {
    if (barRef.current && animated) {
      animate(barRef.current, {
        boxShadow: [
          '0 0 10px rgba(234, 35, 35, 0.3), 0 0 20px rgba(6, 182, 212, 0.2)',
          '0 0 15px rgba(234, 35, 35, 0.5), 0 0 30px rgba(6, 182, 212, 0.3)',
          '0 0 10px rgba(234, 35, 35, 0.3), 0 0 20px rgba(6, 182, 212, 0.2)',
        ],
        easing: 'easeInOutSine',
        duration: 3000,
        loop: true,
      });
    }
  }, [animated]);
  
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Level badges and percentage */}
      <div className="flex items-center justify-between">
        {showLevels && (
          <div className={`flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className="font-semibold text-white">LVL</span>
            <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[#ea2323] to-[#ff4444] text-white font-bold">
              {currentLevel}
            </span>
          </div>
        )}
        
        {showPercentage && (
          <span className={`${textSizes[size]} font-medium text-white/70`}>
            {percentage.toFixed(1)}%
          </span>
        )}
        
        {showLevels && (
          <div className={`flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className="font-semibold text-white/50">NEXT</span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 font-bold border border-white/20">
              {currentLevel + 1}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div
        ref={barRef}
        className={`relative w-full ${sizeClasses[size]} rounded-full bg-black/40 border border-white/10 overflow-hidden`}
        style={{
          boxShadow: animated 
            ? '0 0 10px rgba(234, 35, 35, 0.3), 0 0 20px rgba(6, 182, 212, 0.2)'
            : 'none',
        }}
      >
        {/* Holographic fill */}
        <div
          ref={fillRef}
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
          style={{
            width: animated ? '0%' : `${percentage}%`,
            background: 'linear-gradient(90deg, #06b6d4 0%, #ea2323 50%, #a855f7 100%)',
            boxShadow: '0 0 15px rgba(234, 35, 35, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
              animation: 'shimmer 3s infinite',
            }}
          />
        </div>
        
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '4px 4px',
          }}
        />
      </div>
      
      {/* XP values */}
      <div className={`flex items-center justify-between ${textSizes[size]} text-white/50`}>
        <span className="font-mono">
          {xpInCurrentLevel.toLocaleString()} XP
        </span>
        <span className="font-mono">
          {xpNeededForLevel.toLocaleString()} XP
        </span>
      </div>
    </div>
  );
};

/**
 * Get the XP threshold for the previous level
 * This should match the XP_LEVEL_THRESHOLDS from metadata.ts
 */
function getPreviousLevelThreshold(currentLevel: number): number {
  const thresholds = [
    0,      // Level 1
    1000,   // Level 2
    2500,   // Level 3
    5000,   // Level 4
    8000,   // Level 5
    12000,  // Level 6
    18000,  // Level 7
    25000,  // Level 8
    35000,  // Level 9
    50000,  // Level 10
  ];
  
  if (currentLevel <= 1) return 0;
  if (currentLevel > thresholds.length) return thresholds[thresholds.length - 1];
  return thresholds[currentLevel - 2] || 0;
}

// Add shimmer animation to global CSS if not already present
if (typeof document !== 'undefined') {
  const styleId = 'xp-bar-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(200%); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default XPProgressBar;
