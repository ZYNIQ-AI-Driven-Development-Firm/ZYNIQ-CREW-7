import React, { useEffect, useState } from 'react';
import { getTokenStats, type TokenStats } from '@/src/lib/api';

interface DashboardCryptoStats {
  c7t_balance: number;
  total_spent: number;
  total_earned: number;
  pending_rewards: number;
}

export const DashboardCryptoCards: React.FC = () => {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getTokenStats();
      setStats(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load token stats:', err);
      setError(err.message || 'Failed to load token stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 rounded mb-2 w-2/3"></div>
            <div className="h-8 bg-white/10 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-red-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'C7T Balance',
      value: `${(stats?.current_balance ?? 0).toFixed(2)} C7T`,
      subtitle: 'Available tokens',
      gradient: 'from-[#ea2323]/10 to-[#ea2323]/5',
      border: 'border-[#ea2323]/20',
      icon: '💎',
    },
    {
      title: 'Total Spent',
      value: `${(stats?.total_spent ?? 0).toFixed(2)} C7T`,
      subtitle: 'On rentals & purchases',
      gradient: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20',
      icon: '📤',
    },
    {
      title: 'Total Earned',
      value: `${(stats?.total_earned ?? 0).toFixed(2)} C7T`,
      subtitle: 'From crew rentals',
      gradient: 'from-green-500/10 to-green-500/5',
      border: 'border-green-500/20',
      icon: '📥',
    },
    {
      title: 'Pending Rewards',
      value: `${(stats?.pending_rewards ?? 0).toFixed(2)} C7T`,
      subtitle: 'Being processed',
      gradient: 'from-yellow-500/10 to-yellow-500/5',
      border: 'border-yellow-500/20',
      icon: '⏳',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`group p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden`}
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[0.65rem] sm:text-xs font-medium text-white/60 uppercase tracking-wider">
                {card.title}
              </div>
              <span className="text-xl sm:text-2xl transition-transform group-hover:scale-110 duration-300">{card.icon}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1 bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">{card.value}</div>
            <div className="text-[0.7rem] sm:text-xs text-white/50">{card.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
