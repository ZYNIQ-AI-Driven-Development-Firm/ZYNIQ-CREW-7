import React from 'react';
import { CrewMarketplaceItem } from './MarketplaceCard';
import { TagPill, Badge, XPBar } from './SharedComponents';

interface CrewPreviewPanelProps {
  crew: CrewMarketplaceItem | null;
  onClose: () => void;
  onDeploy?: (crew: CrewMarketplaceItem) => void;
  onViewFullProfile?: (crew: CrewMarketplaceItem) => void;
}

const CREW_ROLES = [
  { id: 'orchestrator', name: 'Orchestrator', icon: '🎯', color: 'text-[#ea2323]' },
  { id: 'researcher', name: 'Researcher', icon: '🔍', color: 'text-cyan-400' },
  { id: 'developer', name: 'Developer', icon: '💻', color: 'text-green-400' },
  { id: 'analyst', name: 'Analyst', icon: '📊', color: 'text-purple-400' },
  { id: 'writer', name: 'Writer', icon: '✍️', color: 'text-yellow-400' },
  { id: 'designer', name: 'Designer', icon: '🎨', color: 'text-pink-400' },
  { id: 'reviewer', name: 'Reviewer', icon: '✅', color: 'text-blue-400' },
];

export const CrewPreviewPanel: React.FC<CrewPreviewPanelProps> = ({
  crew,
  onClose,
  onDeploy,
  onViewFullProfile,
}) => {
  if (!crew) return null;

  const recentMissions = [
    { id: '1', name: 'E-commerce Platform Build', outcome: 'success', date: '2 days ago', xpGained: 450 },
    { id: '2', name: 'Marketing Campaign Analysis', outcome: 'success', date: '5 days ago', xpGained: 380 },
    { id: '3', name: 'Financial Model Creation', outcome: 'success', date: '1 week ago', xpGained: 520 },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-gradient-to-br from-[#0B0F19] to-[#05070B] border-l border-white/10 shadow-2xl z-50 overflow-y-auto animate-slideInRight">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{crew.name}</h2>
              <div className="flex flex-wrap gap-2">
                {crew.typeTags.map((tag, idx) => (
                  <TagPill key={idx} variant="primary">{tag}</TagPill>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Large Portrait */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#ea2323]/10 to-cyan-500/10 border border-white/10">
            {crew.avatarImageUrl ? (
              <img 
                src={crew.avatarImageUrl} 
                alt={crew.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323]/30 to-cyan-500/30 rounded-full animate-pulse" />
                  <div className="absolute inset-6 border-2 border-[#ea2323]/40 rounded-full" />
                  <div className="absolute inset-12 border border-cyan-500/40 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-7xl font-bold text-[#ea2323]">
                    {crew.name.charAt(0)}
                  </div>
                </div>
              </div>
            )}
            {crew.isFeatured && (
              <div className="absolute top-4 left-4">
                <Badge variant="featured">Featured</Badge>
              </div>
            )}
            {crew.rarity !== 'common' && (
              <div className="absolute top-4 right-4">
                <Badge variant={crew.rarity === 'prime' ? 'prime' : 'featured'}>
                  {crew.rarity.charAt(0).toUpperCase() + crew.rarity.slice(1)}
                </Badge>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-[#ea2323]">{crew.level}</div>
              <div className="text-xs text-white/50 mt-1">Level</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-cyan-400">{crew.missionsCompleted}</div>
              <div className="text-xs text-white/50 mt-1">Missions</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-green-400">{crew.successRate}%</div>
              <div className="text-xs text-white/50 mt-1">Success</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <div className="text-2xl font-bold text-yellow-400">{crew.rating.toFixed(1)} ⭐</div>
              <div className="text-xs text-white/50 mt-1">Rating</div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold mb-3">Experience Progress</h3>
            <XPBar 
              current={crew.xp} 
              max={crew.xpMax} 
              level={crew.level}
              showLabel={true}
              animated={true}
            />
          </div>

          {/* Roles Breakdown */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold mb-4">Crew Formation (7 Specialists)</h3>
            <div className="grid grid-cols-2 gap-3">
              {CREW_ROLES.map((role) => (
                <div 
                  key={role.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <span className="text-2xl">{role.icon}</span>
                  <div>
                    <div className={`font-semibold ${role.color}`}>{role.name}</div>
                    <div className="text-xs text-white/50">Specialist</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Missions */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold mb-4">Recent Mission History</h3>
            <div className="space-y-2">
              {recentMissions.map((mission) => (
                <div 
                  key={mission.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${mission.outcome === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {mission.outcome === 'success' ? '✓' : '✗'}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{mission.name}</div>
                      <div className="text-xs text-white/50">{mission.date}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-purple-400">
                    +{mission.xpGained} XP
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="font-bold mb-4">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="featured">100+ Missions</Badge>
              <Badge variant="verified">Verified Owner</Badge>
              {crew.onChainTokenId && <Badge variant="prime">On-Chain Proof</Badge>}
              <Badge variant="new">High Success Rate</Badge>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-white/60">Price per Mission</div>
                <div className="text-3xl font-bold text-[#ea2323]">
                  {crew.pricePerMission} <span className="text-lg">{crew.priceCurrency}</span>
                </div>
              </div>
              {crew.onChainTokenId && (
                <div className="px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-xs text-cyan-400">On-Chain Token</div>
                  <div className="text-xs font-mono text-white/50 mt-1">
                    #{crew.onChainTokenId.slice(0, 8)}...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 sticky bottom-0 bg-gradient-to-t from-[#05070B] pt-4">
            <button
              onClick={() => onDeploy?.(crew)}
              className="flex-1 px-6 py-4 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-bold text-lg shadow-lg shadow-[#ea2323]/30"
            >
              Deploy This Crew
            </button>
            <button
              onClick={() => onViewFullProfile?.(crew)}
              className="flex-1 px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-bold text-lg"
            >
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
