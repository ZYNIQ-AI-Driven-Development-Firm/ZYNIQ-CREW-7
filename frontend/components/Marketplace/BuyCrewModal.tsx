import React, { useState } from 'react';
import { useWallet } from '../Wallet/useWallet';

interface BuyCrewModalProps {
  crewId: string;
  crewName: string;
  purchasePrice: number;
  ownerName?: string;
  description?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BuyCrewModal: React.FC<BuyCrewModalProps> = ({
  crewId,
  crewName,
  purchasePrice,
  ownerName = 'Anonymous',
  description,
  onClose,
  onSuccess,
}) => {
  const { balance, isConnected } = useWallet();
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const insufficientBalance = balance < purchasePrice;

  const handleBuy = async () => {
    if (!confirmed) {
      setError('Please confirm you understand this is a permanent purchase');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (insufficientBalance) {
      setError('Insufficient C7T balance');
      return;
    }

    setIsBuying(true);
    setError('');

    try {
      const response = await fetch(`/api/marketplace/${crewId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to purchase crew');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to purchase crew');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-lg w-full">
        <h3 className="text-2xl font-bold mb-2">Purchase AI Crew</h3>
        <p className="text-white/60 mb-6">Permanent ownership with full control and rental rights</p>

        {success ? (
          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="font-bold text-lg text-green-400">Purchase Complete!</div>
            <div className="text-sm text-white/60 mt-2">You now own this crew</div>
            <div className="text-xs text-white/40 mt-3">You can now rent it out or use it for your missions</div>
          </div>
        ) : (
          <>
            {/* Crew Info */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-xl">{crewName}</div>
                  <div className="text-sm text-white/60 mt-1">Current owner: {ownerName}</div>
                  {description && (
                    <div className="text-sm text-white/50 mt-2">{description}</div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Purchase Price</span>
                  <span className="font-bold text-2xl text-[#ea2323]">{purchasePrice.toFixed(2)} C7T</span>
                </div>
              </div>
            </div>

            {/* Ownership Benefits */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="font-semibold mb-3">What You Get:</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Permanent ownership and unlimited usage</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Ability to rent out and earn passive C7T</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Full control over pricing and availability</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Reputation and XP accumulation</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 font-bold">✓</span>
                  <span>Can resell on marketplace anytime</span>
                </div>
              </div>
            </div>

            {/* Balance Check */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Your Balance</span>
                <span className="font-mono font-bold">{balance.toFixed(2)} C7T</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Purchase Cost</span>
                <span className="font-mono font-bold text-[#ea2323]">-{purchasePrice.toFixed(2)} C7T</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Balance After</span>
                  <span className={`font-mono font-bold text-lg ${insufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                    {(balance - purchasePrice).toFixed(2)} C7T
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4 cursor-pointer hover:bg-yellow-500/15 transition-all">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 accent-[#ea2323]"
              />
              <span className="text-sm text-yellow-200">
                I understand this is a permanent purchase and cannot be refunded. Ownership will transfer immediately.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {insufficientBalance && !error && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                ⚠️ Insufficient balance. You need {(purchasePrice - balance).toFixed(2)} more C7T.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isBuying}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={isBuying || insufficientBalance || !isConnected || !confirmed}
                className="flex-1 px-4 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ea2323]/30"
              >
                {isBuying ? 'Processing...' : `Buy for ${purchasePrice.toFixed(2)} C7T`}
              </button>
            </div>

            <p className="mt-4 text-xs text-white/40 text-center">
              Running in test mode. No real blockchain transaction required.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
