import React, { useEffect, useState } from 'react';
import {
  Rating,
  RatingStats,
  RatingCreate,
  listCrewRatings,
  getCrewRatingStats,
  createRating,
} from '../src/lib/api';
import { RatingDisplay, RatingInput } from './RatingStars';
import { Star, MessageSquare, Send, X, TrendingUp } from 'lucide-react';

interface CrewRatingSectionProps {
  crewId: string;
  allowRating?: boolean;
  onRatingSubmitted?: () => void;
}

export const CrewRatingSection: React.FC<CrewRatingSectionProps> = ({
  crewId,
  allowRating = false,
  onRatingSubmitted,
}) => {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Rating form state
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadData();
  }, [crewId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, ratingsData] = await Promise.all([
        getCrewRatingStats(crewId),
        listCrewRatings(crewId),
      ]);
      setStats(statsData);
      setRatings(ratingsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (newRating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const payload: RatingCreate = {
        crew_id: crewId,
        rating: newRating,
        comment: newComment.trim() || undefined,
      };
      await createRating(payload);
      
      // Reset form
      setNewRating(0);
      setNewComment('');
      setShowRatingForm(false);
      
      // Reload data
      await loadData();
      
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
        <div className="h-8 bg-white/10 rounded w-48"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
        <p className="text-red-400 text-sm">{error || 'Ratings unavailable'}</p>
      </div>
    );
  }

  const distribution = stats.rating_distribution;
  const maxCount = Math.max(...Object.values(distribution).map(Number));

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm text-white/60 uppercase tracking-wider mb-2">Overall Rating</h3>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-5xl font-bold text-white">
                {stats.average_rating.toFixed(1)}
              </span>
              <span className="text-white/50 mb-2">/ 5.0</span>
            </div>
            <RatingDisplay rating={stats.average_rating} totalRatings={stats.total_ratings} size="lg" />
          </div>
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        {/* Rating distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star.toString() as keyof typeof distribution] || 0;
            const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-white/60 w-6">{star}</span>
                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-sm text-white/50 w-12 text-right">{count}</span>
                <span className="text-xs text-white/40 w-10 text-right">{percentage.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add rating button */}
      {allowRating && !showRatingForm && (
        <button
          onClick={() => setShowRatingForm(true)}
          className="w-full px-4 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Star className="w-5 h-5" />
          Rate This Crew
        </button>
      )}

      {/* Rating form */}
      {showRatingForm && (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">Submit Your Rating</h4>
            <button
              onClick={() => setShowRatingForm(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <RatingInput value={newRating} onChange={setNewRating} required />

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Review <span className="text-white/50">(Optional)</span>
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience with this crew..."
              rows={4}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-white/40 text-right">{newComment.length}/500</p>
          </div>

          <button
            onClick={handleSubmitRating}
            disabled={submitting || newRating === 0}
            className="w-full px-4 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 disabled:bg-white/10 disabled:text-white/40 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Rating
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent ratings */}
      {ratings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent Reviews ({ratings.length})
          </h4>

          <div className="space-y-3">
            {ratings.slice(0, 5).map((rating) => (
              <div
                key={rating.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <RatingDisplay rating={rating.rating} size="sm" showNumber={false} />
                  <span className="text-xs text-white/40">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </span>
                </div>
                {rating.comment && (
                  <p className="text-sm text-white/70 leading-relaxed">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>

          {ratings.length > 5 && (
            <p className="text-sm text-white/50 text-center pt-2">
              +{ratings.length - 5} more review{ratings.length - 5 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CrewRatingSection;
