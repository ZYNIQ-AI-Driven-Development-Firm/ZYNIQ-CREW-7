import React, { useEffect, useState } from 'react';

interface CrewPortfolioData {
  total_missions: number;
  total_hours: number;
  average_rating: number;
  total_ratings: number;
  level: number;
  current_xp: number;
  xp_for_next_level: number;
  industries: string[];
  ratings?: Array<{
    id: string;
    rating: number;
    comment?: string;
    rater_name?: string;
    created_at: string;
  }>;
}

interface CrewPortfolioProps {
  crewId: string;
  showRatings?: boolean;
  allowRating?: boolean;
  onRatingSubmitted?: () => void;
}

export const CrewPortfolio: React.FC<CrewPortfolioProps> = ({
  crewId,
  showRatings = true,
  allowRating = false,
  onRatingSubmitted,
}) => {
  const [portfolio, setPortfolio] = useState<CrewPortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, [crewId]);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crews/${crewId}/portfolio`);
      if (!response.ok) throw new Error('Failed to load portfolio');
      const data = await response.json();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
        <div className="text-center text-white/60">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20">
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  const xpProgress = (portfolio.current_xp / portfolio.xp_for_next_level) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ea2323]/10 to-[#ea2323]/5 border border-[#ea2323]/20">
          <div className="text-xs text-white/50 mb-1">Total Missions</div>
          <div className="text-2xl font-bold">{portfolio.total_missions}</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <div className="text-xs text-white/50 mb-1">Hours Worked</div>
          <div className="text-2xl font-bold">{portfolio.total_hours.toFixed(1)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
          <div className="text-xs text-white/50 mb-1">Rating</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{portfolio.average_rating.toFixed(1)}</span>
            <span className="text-yellow-400 text-xl">★</span>
          </div>
          <div className="text-xs text-white/40 mt-1">{portfolio.total_ratings} ratings</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
          <div className="text-xs text-white/50 mb-1">Level</div>
          <div className="text-2xl font-bold">{portfolio.level}</div>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Experience Progress</span>
          <span className="text-xs text-white/60">
            {portfolio.current_xp} / {portfolio.xp_for_next_level} XP
          </span>
        </div>
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ea2323] to-[#ff2e2e] transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <div className="text-xs text-white/50 mt-2">
          {portfolio.xp_for_next_level - portfolio.current_xp} XP until level {portfolio.level + 1}
        </div>
      </div>

      {/* Industries */}
      {portfolio.industries && portfolio.industries.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm font-medium mb-3">Industries & Specializations</div>
          <div className="flex flex-wrap gap-2">
            {portfolio.industries.map((industry, index) => (
              <span
                key={index}
                className="px-3 py-1.5 rounded-full bg-[#ea2323]/10 border border-[#ea2323]/20 text-sm font-medium"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rate This Crew Button */}
      {allowRating && (
        <button
          onClick={() => setShowRateModal(true)}
          className="w-full px-4 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold shadow-lg shadow-[#ea2323]/30"
        >
          Rate This Crew
        </button>
      )}

      {/* Ratings List */}
      {showRatings && portfolio.ratings && portfolio.ratings.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm font-medium mb-4">Recent Ratings</div>
          <div className="space-y-3">
            {portfolio.ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={star <= rating.rating ? 'text-yellow-400' : 'text-white/20'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-white/60">
                      by {rating.rater_name || 'Anonymous'}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-white/70">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <RateCrewModal
          crewId={crewId}
          onClose={() => setShowRateModal(false)}
          onSuccess={() => {
            setShowRateModal(false);
            loadPortfolio();
            onRatingSubmitted?.();
          }}
        />
      )}
    </div>
  );
};

interface RateCrewModalProps {
  crewId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const RateCrewModal: React.FC<RateCrewModalProps> = ({ crewId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/crews/${crewId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit rating');
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold mb-2">Rate This Crew</h3>
        <p className="text-white/60 mb-6">Share your experience to help others</p>

        {/* Star Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Your Rating</label>
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-4xl transition-all hover:scale-110"
              >
                <span
                  className={
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400'
                      : 'text-white/20'
                  }
                >
                  ★
                </span>
              </button>
            ))}
          </div>
          {rating > 0 && (
            <div className="text-center mt-2 text-sm text-white/60">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
          )}
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Comment <span className="text-white/40">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this crew..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#ea2323]/50 outline-none placeholder:text-white/40 resize-none"
            maxLength={500}
          />
          <div className="text-xs text-white/40 mt-1 text-right">
            {comment.length} / 500
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1 px-4 py-3 rounded-xl bg-[#ea2323] hover:bg-[#ff2e2e] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ea2323]/30"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );
};
