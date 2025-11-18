/**
 * Portfolio Stat Chip Component
 * 
 * Reusable metric display chip for crew/agent portfolio cards.
 * Shows icons, labels, values, and optional trends.
 */

import React from 'react';

export interface PortfolioStatChipProps {
  /** Icon to display (emoji or React element) */
  icon: React.ReactNode;
  
  /** Label text */
  label: string;
  
  /** Value to display */
  value: string | number;
  
  /** Optional subtitle/unit */
  subtitle?: string;
  
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Optional trend indicator */
  trend?: 'up' | 'down' | 'neutral';
  
  /** Custom CSS class */
  className?: string;
}

export const PortfolioStatChip: React.FC<PortfolioStatChipProps> = ({
  icon,
  label,
  value,
  subtitle,
  variant = 'default',
  size = 'md',
  trend,
  className = '',
}) => {
  // Variant colors
  const variantStyles = {
    default: 'bg-white/5 border-white/10 text-white',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-1.5 gap-1.5',
    md: 'px-3 py-2 gap-2',
    lg: 'px-4 py-3 gap-3',
  };
  
  const iconSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };
  
  const labelSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };
  
  const valueSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Trend indicators
  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };
  
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-white/50',
  };
  
  return (
    <div
      className={`
        flex items-center ${sizeStyles[size]}
        rounded-lg border backdrop-blur-sm
        ${variantStyles[variant]}
        transition-all duration-200 hover:bg-white/10 hover:border-white/20
        ${className}
      `}
    >
      {/* Icon */}
      <div className={`${iconSizes[size]} flex-shrink-0`}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className={`${labelSizes[size]} text-white/60 uppercase tracking-wide font-medium`}>
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className={`${valueSizes[size]} font-bold`}>
            {value}
          </span>
          {subtitle && (
            <span className={`${labelSizes[size]} text-white/40`}>
              {subtitle}
            </span>
          )}
          {trend && (
            <span className={`${labelSizes[size]} ${trendColors[trend]} font-medium`}>
              {trendIcons[trend]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Rarity Badge Component
 * Displays rarity tier with appropriate styling and glow
 */
export interface RarityBadgeProps {
  rarity: 'common' | 'advanced' | 'elite' | 'prime';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const rarityConfig = {
    common: {
      label: 'Common',
      color: 'from-gray-500 to-gray-600',
      glow: 'shadow-gray-500/30',
      border: 'border-gray-500/50',
    },
    advanced: {
      label: 'Advanced',
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-cyan-500/50',
      border: 'border-cyan-500/50',
    },
    elite: {
      label: 'Elite',
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/50',
      border: 'border-purple-500/50',
    },
    prime: {
      label: 'Prime',
      color: 'from-yellow-400 via-red-500 to-pink-500',
      glow: 'shadow-red-500/70',
      border: 'border-red-500/50',
    },
  };
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };
  
  const config = rarityConfig[rarity];
  
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 ${sizeStyles[size]}
        rounded-full bg-gradient-to-r ${config.color}
        border ${config.border} shadow-lg ${config.glow}
        font-bold text-white uppercase tracking-wider
        ${className}
      `}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {showLabel && config.label}
    </div>
  );
};

/**
 * Level Badge Component
 * Displays level with XP-themed styling
 */
export interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };
  
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 ${sizeStyles[size]}
        rounded-lg bg-gradient-to-r from-[#ea2323] to-[#ff4444]
        border border-red-400/50 shadow-lg shadow-red-500/30
        font-bold text-white
        ${className}
      `}
    >
      {showLabel && <span className="text-white/80 text-[0.8em]">LVL</span>}
      <span>{level}</span>
    </div>
  );
};

export default PortfolioStatChip;
