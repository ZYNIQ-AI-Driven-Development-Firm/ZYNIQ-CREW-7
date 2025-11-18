/**
 * Enhanced Crew Portfolio Card Component
 * 
 * Premium portfolio display for crews with:
 * - Hybrid-C robot portrait
 * - XP progress bar with animations
 * - Performance metrics grid
 * - Rarity tier and level badges
 * - Evolution timeline
 * - Web3 NFT metadata integration
 */

import React from 'react';
import { XPProgressBar } from './XPProgressBar';
import { PortfolioStatChip, RarityBadge, LevelBadge } from './PortfolioStatChip';
import type { CrewNftMetadata } from '../../src/lib/web3/metadata';

export interface EnhancedCrewPortfolioCardProps {
  /** Crew metadata (can be from Web3 or internal data) */
  metadata: CrewNftMetadata;
  
  /** Show evolution timeline */
  showTimeline?: boolean;
  
  /** Show detailed metrics */
  showDetailedMetrics?: boolean;
  
  /** Card layout variant */
  variant?: 'horizontal' | 'vertical';
  
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Enable animations */
  animated?: boolean;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Custom CSS class */
  className?: string;
}

export const EnhancedCrewPortfolioCard: React.FC<EnhancedCrewPortfolioCardProps> = ({
  metadata,
  showTimeline = true,
  showDetailedMetrics = true,
  variant = 'horizontal',
  size = 'md',
  animated = true,
  onClick,
  className = '',
}) => {
  // Rarity-based glow colors
  const rarityGlows = {
    common: 'hover:shadow-gray-500/20',
    advanced: 'hover:shadow-cyan-500/30',
    elite: 'hover:shadow-purple-500/30',
    prime: 'hover:shadow-red-500/40',
  };
  
  const rarityBorders = {
    common: 'border-gray-500/20',
    advanced: 'border-cyan-500/20',
    elite: 'border-purple-500/20',
    prime: 'border-red-500/30',
  };
  
  // Size-based padding
  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div
      className={`
        ${sizeStyles[size]} rounded-3xl
        bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]
        border ${rarityBorders[metadata.rarity_tier]}
        transition-all duration-300
        ${rarityGlows[metadata.rarity_tier]}
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {variant === 'horizontal' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Portrait */}
          <div className="flex-shrink-0">
            <PortraitSection metadata={metadata} size={size} animated={animated} />
          </div>
          
          {/* Right: Details */}
          <div className="flex-1 min-w-0 space-y-4">
            <HeaderSection metadata={metadata} />
            <XPSection metadata={metadata} animated={animated} />
            <MetricsGrid metadata={metadata} detailed={showDetailedMetrics} />
            {showTimeline && <EvolutionTimeline metadata={metadata} />}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PortraitSection metadata={metadata} size={size} animated={animated} />
          <HeaderSection metadata={metadata} />
          <XPSection metadata={metadata} animated={animated} />
          <MetricsGrid metadata={metadata} detailed={showDetailedMetrics} />
          {showTimeline && <EvolutionTimeline metadata={metadata} />}
        </div>
      )}
    </div>
  );
};

/**
 * Portrait section with Hybrid-C robot image and badges
 */
const PortraitSection: React.FC<{
  metadata: CrewNftMetadata;
  size: 'sm' | 'md' | 'lg';
  animated: boolean;
}> = ({ metadata, size, animated }) => {
  const imageSize = {
    sm: 'w-32 h-32',
    md: 'w-40 h-40 lg:w-48 lg:h-48',
    lg: 'w-48 h-48 lg:w-64 lg:h-64',
  };
  
  return (
    <div className="relative">
      {/* Portrait */}
      <div className={`${imageSize[size]} relative rounded-2xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-white/5 to-white/0`}>
        <img
          src={metadata.image}
          alt={metadata.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(metadata.name)}&background=0a0a0a&color=ea2323&size=256`;
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-2">
        <RarityBadge rarity={metadata.rarity_tier} size="sm" />
        <LevelBadge level={metadata.level} size="sm" />
      </div>
      
      {/* Market status indicator */}
      {metadata.market_status !== 'not_listed' && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-green-500/90 text-white text-[10px] font-bold uppercase backdrop-blur-sm">
          {metadata.market_status === 'for_rent' ? '🔥 Available' : '💰 For Sale'}
        </div>
      )}
    </div>
  );
};

/**
 * Header with name, type, and formation
 */
const HeaderSection: React.FC<{ metadata: CrewNftMetadata }> = ({ metadata }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl font-bold text-white leading-tight">
          {metadata.name}
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ea2323]/10 border border-[#ea2323]/30 text-xs font-semibold text-[#ea2323] whitespace-nowrap">
          <span>⚡</span>
          <span>{metadata.crew_type}</span>
        </div>
      </div>
      
      <p className="text-sm text-white/60 line-clamp-2">
        {metadata.description}
      </p>
      
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Formation: {metadata.formation} Agents
        </span>
        <span>•</span>
        <span>{metadata.missions_completed} Missions</span>
      </div>
    </div>
  );
};

/**
 * XP Progress Section
 */
const XPSection: React.FC<{ metadata: CrewNftMetadata; animated: boolean }> = ({ metadata, animated }) => {
  return (
    <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
      <XPProgressBar
        currentXP={metadata.xp}
        nextLevelXP={metadata.xp_required_for_next_level}
        currentLevel={metadata.level}
        size="md"
        animated={animated}
      />
    </div>
  );
};

/**
 * Metrics Grid
 */
const MetricsGrid: React.FC<{ metadata: CrewNftMetadata; detailed: boolean }> = ({ metadata, detailed }) => {
  const metrics = [
    {
      icon: '🎯',
      label: 'Success Rate',
      value: `${metadata.success_rate.toFixed(1)}%`,
      variant: metadata.success_rate >= 90 ? 'success' : metadata.success_rate >= 70 ? 'default' : 'warning',
    },
    {
      icon: '⭐',
      label: 'Rating',
      value: metadata.client_rating.toFixed(1),
      subtitle: '/ 5.0',
      variant: metadata.client_rating >= 4.5 ? 'success' : 'default',
    },
    {
      icon: '🚀',
      label: 'Missions',
      value: metadata.missions_completed.toLocaleString(),
      variant: 'default',
    },
    {
      icon: '⏱️',
      label: 'Hours',
      value: metadata.hours_worked_estimate?.toLocaleString() || '0',
      variant: 'default',
    },
  ];
  
  if (detailed && metadata.artifacts_count) {
    metrics.push({
      icon: '📦',
      label: 'Artifacts',
      value: metadata.artifacts_count.toLocaleString(),
      variant: 'info',
    });
  }
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {metrics.map((metric, index) => (
        <PortfolioStatChip
          key={index}
          icon={metric.icon}
          label={metric.label}
          value={metric.value}
          subtitle={metric.subtitle}
          variant={metric.variant as any}
          size="sm"
        />
      ))}
    </div>
  );
};

/**
 * Evolution Timeline
 */
const EvolutionTimeline: React.FC<{ metadata: CrewNftMetadata }> = ({ metadata }) => {
  const stages = [
    { icon: '🎯', label: 'Missions', value: metadata.missions_completed },
    { icon: '⚡', label: 'XP', value: metadata.xp },
    { icon: '🏆', label: 'Level', value: metadata.level },
    { icon: '💎', label: 'Rarity', value: metadata.rarity_tier.charAt(0).toUpperCase() + metadata.rarity_tier.slice(1) },
  ];
  
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-white/5 to-white/0 border border-white/5">
      <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
        Evolution Path
      </div>
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="text-2xl">{stage.icon}</div>
              <div className="text-xs font-bold text-white">{stage.value}</div>
              <div className="text-[10px] text-white/50">{stage.label}</div>
            </div>
            {index < stages.length - 1 && (
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#ea2323] to-[#06b6d4] opacity-30" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default EnhancedCrewPortfolioCard;
