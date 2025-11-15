import React, { useEffect, useState } from 'react';
import { useWallet } from '../components/Wallet/useWallet';

interface TokenTransaction {
  id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  description?: string;
  created_at: string;
}

interface TokenStats {
  total_earned: number;
  total_spent: number;
  transactions: TokenTransaction[];
}

export const WalletAndTokens: React.FC = () => {
  const { address, balance, isConnected, disconnect, refreshBalance } = useWallet();
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestingTokens, setRequestingTokens] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadTokenStats();
    }
  }, [isConnected]);

  const loadTokenStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/tokens/stats');
      if (!response.ok) throw new Error('Failed to load token stats');
      const data = await response.json();
      setTokenStats(data);
    } catch (err: any) {
      console.error('Failed to load token stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTestTokens = async () => {
    setRequestingTokens(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/wallet/request-test-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to request tokens');
      }

      const data = await response.json();
      setSuccess(`Successfully received ${data.amount} C7T test tokens!`);
      refreshBalance();
      loadTokenStats();
    } catch (err: any) {
      setError(err.message || 'Failed to request test tokens');
    } finally {
      setRequestingTokens(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-white/60 mb-6">
            Please connect your wallet to view token information and transaction history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet & Tokens</h1>
        <p className="text-white/60">
          Manage your C7T tokens and view transaction history
        </p>
      </div>

      {/* Wallet Info Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sm text-white/50 mb-1">Connected Wallet</div>
            <div className="font-mono text-lg font-medium break-all">{address}</div>
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all font-semibold text-sm"
          >
            Disconnect
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Network</div>
            <div className="font-semibold">Test Network (Mock Mode)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">C7T Balance</div>
            <div className="text-2xl font-bold text-[#ea2323]">{balance.toFixed(2)}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-xs text-white/50 mb-1">Chain ID</div>
            <div className="font-semibold">1337 (Local)</div>
          </div>
        </div>
      </div>

      {/* Test Tokens Button */}
      <div className="p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Need Test Tokens?</h3>
            <p className="text-sm text-white/60 mb-3">
              Request 100 C7T test tokens to try out marketplace features. You can request tokens once per day.
            </p>
            {success && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-3">
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-3">
                {error}
              </div>
            )}
          </div>
          <button
            onClick={handleRequestTestTokens}
            disabled={requestingTokens}
            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/40 hover:bg-yellow-500/30 transition-all font-semibold disabled:opacity-50"
          >
            {requestingTokens ? 'Requesting...' : 'Request Tokens'}
          </button>
        </div>
      </div>

      {/* Token Stats */}
      {tokenStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-white/50 mb-1">Total Earned</div>
            <div className="text-3xl font-bold text-green-400">{tokenStats.total_earned.toFixed(2)} C7T</div>
            <div className="text-sm text-white/60 mt-2">From crew rentals</div>
          </div>

          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
            <div className="text-xs text-white/50 mb-1">Total Spent</div>
            <div className="text-3xl font-bold text-red-400">{tokenStats.total_spent.toFixed(2)} C7T</div>
            <div className="text-sm text-white/60 mt-2">On rentals & purchases</div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
        <h3 className="font-bold text-lg mb-4">Transaction History</h3>

        {loading ? (
          <div className="text-center py-8 text-white/60">Loading transactions...</div>
        ) : tokenStats && tokenStats.transactions.length > 0 ? (
          <div className="space-y-2">
            {tokenStats.transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.transaction_type === 'credit'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <span className="text-xl">
                      {tx.transaction_type === 'credit' ? '📥' : '📤'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {tx.description || (tx.transaction_type === 'credit' ? 'Received' : 'Sent')}
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div
                  className={`font-mono font-bold text-lg ${
                    tx.transaction_type === 'credit' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {tx.transaction_type === 'credit' ? '+' : '-'}
                  {tx.amount.toFixed(2)} C7T
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            No transactions yet. Start by renting or purchasing a crew!
          </div>
        )}
      </div>

      {/* Educational Panel */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>📚</span> About C7T Tokens
        </h3>
        <div className="space-y-3 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <span className="text-[#ea2323] font-bold">•</span>
            <div>
              <strong>Utility Token:</strong> C7T is the native utility token of the Crew-7 platform, used for all marketplace transactions.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#ea2323] font-bold">•</span>
            <div>
              <strong>Rent Crews:</strong> Use C7T to rent AI crews from other users for temporary access.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#ea2323] font-bold">•</span>
            <div>
              <strong>Buy Crews:</strong> Purchase crews permanently with C7T for full ownership and rental rights.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#ea2323] font-bold">•</span>
            <div>
              <strong>Earn Passive Income:</strong> Rent out your owned crews to other users and earn C7T automatically.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-[#ea2323] font-bold">•</span>
            <div>
              <strong>XP & Reputation:</strong> Crews gain experience and ratings over time, increasing their value.
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mb-1">
            Test Mode
          </div>
          <div className="text-sm text-white/70">
            You are currently using test tokens in a simulated environment. No real cryptocurrency is involved.
          </div>
        </div>
      </div>
    </div>
  );
};
