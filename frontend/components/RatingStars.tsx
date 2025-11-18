import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showNumber?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
  showNumber = false,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayRating;
          const isPartial = starValue - 0.5 <= displayRating && starValue > displayRating;

          return (
            <button
              key={i}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
              className={`
                relative transition-all
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                ${interactive && hoverRating !== null ? 'scale-105' : ''}
              `}
              style={{ width: size, height: size }}
            >
              {/* Background star (empty) */}
              <Star
                size={size}
                className={`
                  absolute inset-0 transition-colors
                  ${isFilled || isPartial ? 'text-yellow-500' : 'text-white/20'}
                `}
                fill={isFilled ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
              
              {/* Partial star fill */}
              {isPartial && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    size={size}
                    className="text-yellow-500"
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {showNumber && (
        <span className="text-sm text-white/70 ml-1 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

interface RatingDisplayProps {
  rating: number;
  totalRatings?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  totalRatings,
  size = 'md',
  showNumber = true,
}) => {
  const starSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  
  return (
    <div className="flex items-center gap-2">
      <RatingStars
        rating={rating}
        size={starSize}
        showNumber={showNumber}
      />
      {totalRatings !== undefined && (
        <span className="text-sm text-white/50">
          ({totalRatings.toLocaleString()})
        </span>
      )}
    </div>
  );
};

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
  required?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  label = 'Rating',
  required = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <RatingStars
        rating={value}
        interactive
        onChange={onChange}
        size={32}
        className="py-2"
      />
      {value > 0 && (
        <p className="text-xs text-white/60">
          {value === 1 && 'Poor'}
          {value === 2 && 'Fair'}
          {value === 3 && 'Good'}
          {value === 4 && 'Very Good'}
          {value === 5 && 'Excellent'}
        </p>
      )}
    </div>
  );
};

export default RatingStars;
