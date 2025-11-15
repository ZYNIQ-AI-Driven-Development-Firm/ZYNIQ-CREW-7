import React, { useState } from 'react';
import { useWallet } from '../Wallet/useWallet';

interface RentCrewModalProps {
  crewId: string;
  crewName: string;
  rentalPrice: number;
  ownerName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RentCrewModal: React.FC<RentCrewModalProps> = ({
  crewId,
  crewName,
  rentalPrice,
  ownerName = 'Anonymous',
  onClose,
  onSuccess,
}) => {
  const { balance, isConnected } = useWallet();
  const [duration, setDuration] = useState<number>(24); // hours
  const [isRenting, setIsRenting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalCost = rentalPrice * (duration / 24); // Price is per day
  const insufficientBalance = balance < totalCost;

  const handleRent = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (insufficientBalance) {
      setError('Insufficient C7T balance');
      return;
    }

    setIsRenting(true);
    setError('');

    try {
      const response = await fetch(`/api/marketplace/${crewId}/rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_hours: duration }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to rent crew');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to rent crew');
    } finally {
      setIsRenting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-lg w-full">
        <h3 className="text-2xl font-bold mb-2">Rent AI Crew</h3>
        <p className="text-white/60 mb-6">Temporary access to this crew for your missions</p>

        {success ? (
          <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-lg text-green-400">Rental Confirmed!</div>
            <div className="text-sm text-white/60 mt-2">Crew is now available in your workspace</div>
          </div>
        ) : (
          <>
            {/* Crew Info */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-bold text-lg">{crewName}</div>
                  <div className="text-sm text-white/60">Owned by {ownerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50">Price per day</div>
                  <div className="font-bold text-[#ea2323]">{rentalPrice.toFixed(2)} C7T</div>
                </div>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Rental Duration</label>
              <div className="grid grid-cols-3 gap-3">
                {[24, 72, 168].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDuration(hours)}
                    className={`p-3 rounded-xl border transition-all ${
                      duration === hours
                        ? 'border-[#ea2323]/50 bg-[#ea2323]/10 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    <div className="text-lg font-bold">{hours / 24}</div>
                    <div className="text-xs">{hours === 24 ? 'day' : 'days'}</div>
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="1"
                max="168"
                step="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mt-4 accent-[#ea2323]"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>1 hour</span>
                <span>{duration} hours</span>
                <span>7 days</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Your Balance</span>
                <span className="font-mono font-bold">{balance.toFixed(2)} C7T</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-white/60">Rental Cost</span>
                <span className="font-mono font-bold text-[#ea2323]">-{totalCost.toFixed(2)} C7T</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Balance After</span>
                  <span className={`font-mono font-bold text-lg ${insufficientBalance ? 'text-red-400' : 'text-green-400'}`}>
                    {(balance - totalCost).toFixed(2)} C7T
                  </span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {insufficientBalance && !error && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                ⚠️ Insufficient balance. You need {(totalCost - balance).toFixed(2)} more C7T.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isRenting}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRent}
                disabled={isRenting || insufficientBalance || !isConnected}
                className="flex-1 px-4 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ea2323]/30"
              >
                {isRenting ? 'Renting...' : `Rent for ${totalCost.toFixed(2)} C7T`}
              </button>
            </div>

            <p className="mt-4 text-xs text-white/40 text-center">
              Crew will be available for {duration} hours from confirmation
            </p>
          </>
        )}
      </div>
    </div>
  );
};
