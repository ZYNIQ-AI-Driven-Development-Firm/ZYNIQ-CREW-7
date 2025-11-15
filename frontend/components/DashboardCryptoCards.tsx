import React, { useEffect, useState } from 'react';

interface DashboardCryptoStats {
  c7t_balance: number;
  total_spent: number;
  total_earned: number;
  owned_crews_count: number;
  active_rentals_count: number;
}

export const DashboardCryptoCards: React.FC = () => {
  const [stats, setStats] = useState<DashboardCryptoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-4 bg-white/10 rounded mb-2 w-2/3"></div>
            <div className="h-8 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'C7T Balance',
      value: `${stats.c7t_balance.toFixed(2)} C7T`,
      subtitle: 'Available tokens',
      gradient: 'from-[#ea2323]/10 to-[#ea2323]/5',
      border: 'border-[#ea2323]/20',
      icon: '💎',
    },
    {
      title: 'Total Spent',
      value: `${stats.total_spent.toFixed(2)} C7T`,
      subtitle: 'On rentals & purchases',
      gradient: 'from-red-500/10 to-red-500/5',
      border: 'border-red-500/20',
      icon: '📤',
    },
    {
      title: 'Total Earned',
      value: `${stats.total_earned.toFixed(2)} C7T`,
      subtitle: 'From crew rentals',
      gradient: 'from-green-500/10 to-green-500/5',
      border: 'border-green-500/20',
      icon: '📥',
    },
    {
      title: 'Owned Crews',
      value: stats.owned_crews_count.toString(),
      subtitle: 'Available to rent out',
      gradient: 'from-blue-500/10 to-blue-500/5',
      border: 'border-blue-500/20',
      icon: '🤖',
    },
    {
      title: 'Active Rentals',
      value: stats.active_rentals_count.toString(),
      subtitle: 'Currently renting',
      gradient: 'from-purple-500/10 to-purple-500/5',
      border: 'border-purple-500/20',
      icon: '⏱️',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} hover:scale-105 transition-transform cursor-pointer`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {card.title}
            </div>
            <span className="text-2xl">{card.icon}</span>
          </div>
          <div className="text-2xl font-bold mb-1">{card.value}</div>
          <div className="text-xs text-white/50">{card.subtitle}</div>
        </div>
      ))}
    </div>
  );
};
