import React, { useEffect, useState } from 'react';

export type BadgeType = 'owned' | 'rented' | 'for-sale' | 'for-rent';

interface CrewBadgeProps {
  type: BadgeType;
  expiresAt?: string; // ISO date string for rental expiration
  price?: number; // Price in C7T for sale/rent
}

export const CrewBadge: React.FC<CrewBadgeProps> = ({ type, expiresAt, price }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (type === 'rented' && expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeRemaining('Expired');
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
          const days = Math.floor(hours / 24);
          setTimeRemaining(`${days}d ${hours % 24}h`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [type, expiresAt]);

  const badges = {
    owned: {
      label: 'Owned',
      bgClass: 'bg-gradient-to-r from-[#4cf5a1]/20 to-[#4cf5a1]/10',
      borderClass: 'border-[#4cf5a1]/40',
      textClass: 'text-[#4cf5a1]',
      icon: '👑',
      glow: 'shadow-[0_0_12px_rgba(76,245,161,0.3)]',
    },
    rented: {
      label: 'Rented',
      bgClass: 'bg-gradient-to-r from-[#f5d14c]/20 to-[#f5d14c]/10',
      borderClass: 'border-[#f5d14c]/40',
      textClass: 'text-[#f5d14c]',
      icon: '⏱️',
      glow: 'shadow-[0_0_12px_rgba(245,209,76,0.3)]',
    },
    'for-sale': {
      label: 'For Sale',
      bgClass: 'bg-gradient-to-r from-[#ea2323]/20 to-[#ea2323]/10',
      borderClass: 'border-[#ea2323]/40',
      textClass: 'text-[#ea2323]',
      icon: '💰',
      glow: 'shadow-[0_0_12px_rgba(234,35,35,0.3)]',
    },
    'for-rent': {
      label: 'For Rent',
      bgClass: 'bg-gradient-to-r from-[#5ca9ff]/20 to-[#5ca9ff]/10',
      borderClass: 'border-[#5ca9ff]/40',
      textClass: 'text-[#5ca9ff]',
      icon: '🏷️',
      glow: 'shadow-[0_0_12px_rgba(92,169,255,0.3)]',
    },
  };

  const badge = badges[type];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 ${badge.bgClass} ${badge.borderClass} ${badge.glow} backdrop-blur-sm`}
    >
      <span className="text-base leading-none">{badge.icon}</span>
      <span className={`text-xs font-bold uppercase tracking-wider ${badge.textClass}`}>
        {badge.label}
      </span>
      {type === 'rented' && timeRemaining && (
        <span className={`text-xs font-mono font-semibold ${badge.textClass} ml-1`}>
          {timeRemaining}
        </span>
      )}
      {(type === 'for-sale' || type === 'for-rent') && price !== undefined && (
        <span className={`text-xs font-mono font-semibold ${badge.textClass} ml-1`}>
          {price.toFixed(0)} C7T
        </span>
      )}
    </div>
  );
};

// Multi-badge container for displaying multiple badges on a crew card
interface CrewBadgesProps {
  isOwned?: boolean;
  isRented?: boolean;
  rentalExpiresAt?: string;
  isForSale?: boolean;
  salePrice?: number;
  isForRent?: boolean;
  rentPrice?: number;
}

export const CrewBadges: React.FC<CrewBadgesProps> = ({
  isOwned,
  isRented,
  rentalExpiresAt,
  isForSale,
  salePrice,
  isForRent,
  rentPrice,
}) => {
  const badges: Array<{ type: BadgeType; expiresAt?: string; price?: number }> = [];

  if (isOwned) {
    badges.push({ type: 'owned' });
  }

  if (isRented && rentalExpiresAt) {
    badges.push({ type: 'rented', expiresAt: rentalExpiresAt });
  }

  if (isForSale && salePrice) {
    badges.push({ type: 'for-sale', price: salePrice });
  }

  if (isForRent && rentPrice) {
    badges.push({ type: 'for-rent', price: rentPrice });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <CrewBadge
          key={`${badge.type}-${index}`}
          type={badge.type}
          expiresAt={badge.expiresAt}
          price={badge.price}
        />
      ))}
    </div>
  );
};
