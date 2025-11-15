import React from 'react';
import { useWallet } from './useWallet';

export const TokenBalanceChip: React.FC = () => {
  const { balance, isConnected, address } = useWallet();

  if (!isConnected || !address) {
    return null;
  }

  const formatBalance = (bal: number) => {
    if (bal >= 1000000) {
      return `${(bal / 1000000).toFixed(1)}M`;
    }
    if (bal >= 1000) {
      return `${(bal / 1000).toFixed(1)}K`;
    }
    return bal.toFixed(2);
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
        {/* C7T Token Icon */}
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-[#ea2323]/30">
            C7
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        </div>

        {/* Balance Display */}
        <div className="flex flex-col">
          <span className="text-xs text-white/50 leading-none mb-0.5">C7T</span>
          <span className="text-sm font-bold leading-none">{formatBalance(balance)}</span>
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] rounded-full flex items-center justify-center font-bold shadow-lg shadow-[#ea2323]/30">
              C7
            </div>
            <div>
              <div className="font-bold">C7T Token</div>
              <div className="text-xs text-white/50">Crew-7 Utility Token</div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center p-2 rounded-lg bg-white/5">
              <span className="text-sm text-white/60">Your Balance</span>
              <span className="font-mono font-bold">{balance.toFixed(2)} C7T</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-white/60">
            <div className="flex items-start gap-2">
              <span className="text-[#ea2323] font-bold">•</span>
              <span>Rent AI crews from the marketplace</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#ea2323] font-bold">•</span>
              <span>Purchase crews for permanent ownership</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#ea2323] font-bold">•</span>
              <span>Earn tokens by renting out your crews</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#ea2323] font-bold">•</span>
              <span>Gain XP and level up your crews</span>
            </div>
          </div>

          {balance < 10 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="text-xs text-yellow-400">
                ⚠️ Low balance. Request test tokens in settings.
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40 text-center">
            Running in test mode
          </div>
        </div>
      </div>
    </div>
  );
};
