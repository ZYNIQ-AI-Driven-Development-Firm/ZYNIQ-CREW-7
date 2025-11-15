import React, { useState } from 'react';
import { TagPill, NeonStatChip, XPBar, RarityGlowFrame } from './SharedComponents';

export interface CrewMarketplaceItem {
  id: string;
  name: string;
  slug: string;
  typeTags: string[];
  category: string;
  level: number;
  xp: number;
  xpMax: number;
  missionsCompleted: number;
  successRate: number;
  rating: number;
  rarity: 'common' | 'advanced' | 'elite' | 'prime';
  pricePerMission: number;
  priceCurrency: string;
  avatarImageUrl?: string;
  onChainTokenId?: string | null;
  chainId?: string | null;
  isFeatured?: boolean;
}

interface MarketplaceCardProps {
  crew: CrewMarketplaceItem;
  onClick?: (crew: CrewMarketplaceItem) => void;
  onDeploy?: (crew: CrewMarketplaceItem) => void;
  onFavorite?: (crew: CrewMarketplaceItem) => void;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  crew,
  onClick,
  onDeploy,
  onFavorite,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    onFavorite?.(crew);
  };

  const handleDeploy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeploy?.(crew);
  };

  return (
    <RarityGlowFrame rarity={crew.rarity}>
      <div
        className={`relative bg-gradient-to-br from-[#0B0F19] to-[#05070B] p-5 cursor-pointer transition-all duration-300 ${
          isHovered ? 'scale-105' : 'scale-100'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick?.(crew)}
      >
        {/* Hybrid-C Mesh Portrait */}
        <div className="relative mb-4 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#ea2323]/10 to-cyan-500/10 border border-white/10">
          {crew.avatarImageUrl ? (
            <img 
              src={crew.avatarImageUrl} 
              alt={crew.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-32 h-32">
                {/* Hybrid-C Mesh Entity Placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/20 to-cyan-500/20 rounded-full animate-pulse" />
                <div className="absolute inset-4 border-2 border-[#ea2323]/30 rounded-full" />
                <div className="absolute inset-8 border border-cyan-500/30 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-[#ea2323]">
                  {crew.name.charAt(0)}
                </div>
              </div>
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <span className={`text-lg ${isFavorited ? 'text-[#ea2323]' : 'text-white/50'}`}>
              {isFavorited ? '❤️' : '🤍'}
            </span>
          </button>
        </div>

        {/* Crew Info */}
        <div className="space-y-3">
          {/* Name & Tags */}
          <div>
            <h3 className="text-lg font-bold mb-2">{crew.name}</h3>
            <div className="flex flex-wrap gap-1.5">
              {crew.typeTags.slice(0, 3).map((tag, idx) => (
                <TagPill key={idx} variant="primary">
                  {tag}
                </TagPill>
              ))}
            </div>
          </div>

          {/* XP Bar */}
          <XPBar 
            current={crew.xp} 
            max={crew.xpMax} 
            level={crew.level}
            showLabel={false}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <NeonStatChip 
              label="Missions" 
              value={crew.missionsCompleted}
              icon="🎯"
              color="cyan"
            />
            <NeonStatChip 
              label="Success" 
              value={`${crew.successRate}%`}
              icon="✓"
              color="green"
            />
            <NeonStatChip 
              label="Rating" 
              value={crew.rating.toFixed(1)}
              icon="⭐"
              color="yellow"
            />
            <NeonStatChip 
              label="Level" 
              value={crew.level}
              icon="📊"
              color="purple"
            />
          </div>

          {/* Price */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-white/50">Price per mission</div>
                <div className="text-xl font-bold text-[#ea2323]">
                  {crew.pricePerMission} <span className="text-sm">{crew.priceCurrency}</span>
                </div>
              </div>
              {crew.onChainTokenId && (
                <div className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
                  On-Chain
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions (shown on hover) */}
          {isHovered && (
            <div className="flex gap-2 pt-2 animate-fadeIn">
              <button
                onClick={handleDeploy}
                className="flex-1 px-3 py-2 rounded-lg bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold text-sm shadow-lg shadow-[#ea2323]/30"
              >
                Deploy
              </button>
              <button
                onClick={() => onClick?.(crew)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-semibold text-sm"
              >
                Details
              </button>
            </div>
          )}
        </div>
      </div>
    </RarityGlowFrame>
  );
};
