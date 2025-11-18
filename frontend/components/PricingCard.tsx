import React, { useEffect, useState } from 'react';
import { PriceBreakdown, getCrewRentalPrice, getCrewBuyoutPrice } from '../src/lib/api';
import { DollarSign, TrendingUp, Award, Target, Star, Users } from 'lucide-react';

interface PricingCardProps {
  crewId: string;
  type?: 'rental' | 'buyout';
  compact?: boolean;
  showBreakdown?: boolean;
}

const PricingMultiplierBadge: React.FC<{
  label: string;
  multiplier: number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, multiplier, icon, color }) => {
  const percentage = ((multiplier - 1) * 100).toFixed(0);
  const isPositive = multiplier > 1;
  const isNeutral = multiplier === 1;

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10`}>
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-white/70">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={`text-sm font-semibold ${
            isNeutral ? 'text-white/50' : isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {isPositive ? '+' : ''}{percentage}%
        </span>
        <span className="text-xs text-white/40">×{multiplier.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const PricingCard: React.FC<PricingCardProps> = ({
  crewId,
  type = 'rental',
  compact = false,
  showBreakdown = true,
}) => {
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPricing();
  }, [crewId, type]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      setError('');
      const data = type === 'rental' 
        ? await getCrewRentalPrice(crewId)
        : await getCrewBuyoutPrice(crewId);
      setPricing(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} rounded-2xl bg-white/5 border border-white/10 animate-pulse`}>
        <div className="h-8 bg-white/10 rounded w-32 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-20"></div>
      </div>
    );
  }

  if (error || !pricing) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} rounded-2xl bg-red-500/10 border border-red-500/20`}>
        <p className="text-red-400 text-sm">{error || 'Pricing unavailable'}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
              {type === 'rental' ? 'Rental Price' : 'Buyout Price'}
            </p>
            <p className="text-2xl font-bold text-white">
              ${pricing.final_price.toFixed(2)}
              {type === 'rental' && <span className="text-sm text-white/60 ml-1">/mission</span>}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>
    );
  }

  const totalMultiplier =
    pricing.level_multiplier *
    pricing.rarity_multiplier *
    pricing.success_rate_bonus *
    pricing.rating_bonus *
    pricing.demand_multiplier;

  return (
    <div className="space-y-4">
      {/* Main price display */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border border-green-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-white/60 uppercase tracking-wider mb-2">
              {type === 'rental' ? 'Rental Price' : 'Buyout Price'}
            </p>
            <p className="text-4xl font-bold text-white mb-1">
              ${pricing.final_price.toFixed(2)}
            </p>
            {type === 'rental' && (
              <p className="text-white/50 text-sm">per mission</p>
            )}
          </div>
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-black/20">
          <span className="text-sm text-white/60">Base Price:</span>
          <span className="text-white font-medium">${pricing.base_price.toFixed(2)}</span>
          <span className="text-white/40">→</span>
          <span className="text-sm text-white/60">Total Multiplier:</span>
          <span className="text-green-400 font-semibold">×{totalMultiplier.toFixed(2)}</span>
        </div>
      </div>

      {/* Detailed breakdown */}
      {showBreakdown && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            Price Breakdown
          </h4>

          <PricingMultiplierBadge
            label="Level Bonus"
            multiplier={pricing.level_multiplier}
            icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
            color="blue"
          />

          <PricingMultiplierBadge
            label="Rarity Tier"
            multiplier={pricing.rarity_multiplier}
            icon={<Award className="w-4 h-4 text-purple-400" />}
            color="purple"
          />

          <PricingMultiplierBadge
            label="Success Rate"
            multiplier={pricing.success_rate_bonus}
            icon={<Target className="w-4 h-4 text-green-400" />}
            color="green"
          />

          <PricingMultiplierBadge
            label="Rating"
            multiplier={pricing.rating_bonus}
            icon={<Star className="w-4 h-4 text-yellow-400" />}
            color="yellow"
          />

          <PricingMultiplierBadge
            label="Demand"
            multiplier={pricing.demand_multiplier}
            icon={<Users className="w-4 h-4 text-orange-400" />}
            color="orange"
          />
        </div>
      )}

      {/* Calculation explanation */}
      {showBreakdown && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/50 leading-relaxed">
            <span className="font-semibold text-white/70">How it's calculated:</span> Base price
            is multiplied by level, rarity, success rate, rating, and demand factors. Higher
            performance, better ratings, and rare crews command premium pricing.
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingCard;
