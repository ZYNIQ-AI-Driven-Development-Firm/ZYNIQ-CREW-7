import React from 'react';

interface TagPillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
}

export const TagPill: React.FC<TagPillProps> = ({ 
  children, 
  active = false, 
  onClick,
  variant = 'default' 
}) => {
  const variants = {
    default: active 
      ? 'bg-[#ea2323]/20 border-[#ea2323]/50 text-[#ea2323]' 
      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30',
    primary: 'bg-[#ea2323]/10 border-[#ea2323]/30 text-[#ea2323]',
    secondary: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider transition-all ${variants[variant]} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'featured' | 'prime' | 'new' | 'verified';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'featured' }) => {
  const variants = {
    featured: 'bg-gradient-to-r from-[#ea2323] to-[#ff2e2e] shadow-[0_0_16px_rgba(234,35,35,0.5)]',
    prime: 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-[0_0_16px_rgba(234,179,8,0.5)]',
    new: 'bg-gradient-to-r from-green-500 to-green-600 shadow-[0_0_16px_rgba(34,197,94,0.5)]',
    verified: 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-[0_0_16px_rgba(59,130,246,0.5)]',
  };

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white ${variants[variant]}`}>
      {children}
    </div>
  );
};

interface NeonStatChipProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'red' | 'cyan' | 'green' | 'yellow' | 'purple';
}

export const NeonStatChip: React.FC<NeonStatChipProps> = ({ 
  label, 
  value, 
  icon,
  color = 'red' 
}) => {
  const colors = {
    red: 'border-[#ea2323]/30 text-[#ea2323]',
    cyan: 'border-cyan-500/30 text-cyan-400',
    green: 'border-green-500/30 text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
    purple: 'border-purple-500/30 text-purple-400',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white/5 backdrop-blur-sm ${colors[color]}`}>
      {icon && <span className="text-sm">{icon}</span>}
      <div className="flex flex-col leading-none">
        <span className="text-[0.6rem] uppercase tracking-wider text-white/50">{label}</span>
        <span className="font-bold text-sm mt-0.5">{value}</span>
      </div>
    </div>
  );
};

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
  animated?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ 
  current, 
  max, 
  level,
  showLabel = true,
  animated = true 
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/70">Level {level}</span>
          <span className="text-xs text-white/50">{current} / {max} XP</span>
        </div>
      )}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#ea2323] via-[#ff2e2e] to-[#ea2323] rounded-full transition-all duration-1000 ${
            animated ? 'animate-shimmer' : ''
          }`}
          style={{ 
            width: `${percentage}%`,
            backgroundSize: '200% 100%'
          }}
        />
      </div>
    </div>
  );
};

interface RarityGlowFrameProps {
  children: React.ReactNode;
  rarity: 'common' | 'advanced' | 'elite' | 'prime';
  className?: string;
}

export const RarityGlowFrame: React.FC<RarityGlowFrameProps> = ({ 
  children, 
  rarity,
  className = ''
}) => {
  const rarityStyles = {
    common: {
      border: 'border-white/10',
      glow: '',
      badge: null,
    },
    advanced: {
      border: 'border-cyan-500/30',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
      badge: 'Advanced',
    },
    elite: {
      border: 'border-purple-500/40',
      glow: 'shadow-[0_0_24px_rgba(168,85,247,0.4)] animate-glow-pulse',
      badge: 'Elite',
    },
    prime: {
      border: 'border-yellow-500/50',
      glow: 'shadow-[0_0_32px_rgba(234,179,8,0.5)] animate-glow-pulse',
      badge: 'Prime',
    },
  };

  const style = rarityStyles[rarity];

  return (
    <div className={`relative ${className}`}>
      <div className={`relative rounded-2xl border ${style.border} ${style.glow} overflow-hidden`}>
        {children}
      </div>
      {style.badge && (
        <div className="absolute -top-2 -right-2">
          <Badge variant={rarity === 'prime' ? 'prime' : 'featured'}>
            {style.badge}
          </Badge>
        </div>
      )}
    </div>
  );
};
