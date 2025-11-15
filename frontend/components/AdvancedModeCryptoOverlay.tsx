import React, { useState } from 'react';

interface CryptoOverlayData {
  isRented?: boolean;
  rentalCost?: number;
  ownerName?: string;
  earningsToOwner?: number;
  estimatedRunCost?: number;
  crewLevel?: number;
  crewXP?: number;
}

interface AdvancedModeCryptoOverlayProps {
  data: CryptoOverlayData;
  visible?: boolean;
}

export const AdvancedModeCryptoOverlay: React.FC<AdvancedModeCryptoOverlayProps> = ({
  data,
  visible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!visible || (!data.isRented && !data.estimatedRunCost)) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm">
      {/* Collapsed State */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 p-4 rounded-2xl bg-[#0a0a0a]/90 border border-[#ea2323]/30 backdrop-blur-xl shadow-2xl shadow-[#ea2323]/20 hover:border-[#ea2323]/50 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] flex items-center justify-center font-bold shadow-lg shadow-[#ea2323]/30">
            C7
          </div>
          <div className="text-left">
            <div className="text-xs text-white/50">Economics Active</div>
            <div className="font-semibold">Tap for details</div>
          </div>
          <div className="text-[#ea2323] animate-pulse">●</div>
        </button>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="p-5 rounded-3xl bg-[#0a0a0a]/95 border border-[#ea2323]/30 backdrop-blur-xl shadow-2xl shadow-[#ea2323]/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] flex items-center justify-center text-xs font-bold shadow-lg shadow-[#ea2323]/30">
                C7
              </div>
              <span className="font-bold">Mission Economics</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Rental Info */}
          {data.isRented && (
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚠️</span>
                <span className="text-sm font-semibold text-yellow-400">Rented Crew</span>
              </div>
              <div className="text-xs text-white/70 mb-3">
                You are using a rented crew. Earnings from this mission will be split with the owner.
              </div>
              {data.ownerName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Owner:</span>
                  <span className="font-medium">{data.ownerName}</span>
                </div>
              )}
              {data.rentalCost !== undefined && (
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-white/50">Rental Cost:</span>
                  <span className="font-mono font-bold text-yellow-400">
                    {data.rentalCost.toFixed(2)} C7T/day
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Cost Breakdown */}
          <div className="space-y-2 mb-4">
            {data.estimatedRunCost !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-xs text-white/50">Est. Run Cost</div>
                  <div className="text-xs text-white/40 mt-0.5">API + Compute</div>
                </div>
                <div className="font-mono font-bold text-[#ea2323]">
                  {data.estimatedRunCost.toFixed(4)} C7T
                </div>
              </div>
            )}

            {data.earningsToOwner !== undefined && data.earningsToOwner > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="text-xs text-white/50">Owner Revenue Share</div>
                  <div className="text-xs text-white/40 mt-0.5">Goes to {data.ownerName || 'Owner'}</div>
                </div>
                <div className="font-mono font-bold text-yellow-400">
                  +{data.earningsToOwner.toFixed(4)} C7T
                </div>
              </div>
            )}
          </div>

          {/* Crew Stats */}
          {(data.crewLevel !== undefined || data.crewXP !== undefined) && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="text-xs font-semibold text-purple-400 mb-2">Crew Progress</div>
              <div className="flex items-center justify-between">
                {data.crewLevel !== undefined && (
                  <div className="text-xs">
                    <span className="text-white/50">Level:</span>{' '}
                    <span className="font-bold text-purple-400">{data.crewLevel}</span>
                  </div>
                )}
                {data.crewXP !== undefined && (
                  <div className="text-xs">
                    <span className="text-white/50">XP:</span>{' '}
                    <span className="font-bold text-purple-400">{data.crewXP}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-white/40 mt-2">
                This mission will add XP to the crew's profile
              </div>
            </div>
          )}

          {/* Info Footer */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>💡</span>
              <span>Economic data updates in real-time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
