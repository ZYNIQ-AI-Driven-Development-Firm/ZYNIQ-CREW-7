import React, { useEffect, useState } from 'react';
import { getCrewRatingsList, rateCrewPerformance, type CrewRatingOut } from '../src/lib/api';

interface RatingsPanelProps {
  crewId: string;
  userCanRate?: boolean;
  onRatingSubmitted?: () => void;
}

export const RatingsPanel: React.FC<RatingsPanelProps> = ({
  crewId,
  userCanRate = false,
  onRatingSubmitted,
}) => {
  const [ratings, setRatings] = useState<CrewRatingOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRatings();
  }, [crewId]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const data = await getCrewRatingsList(crewId, 50, 0);
      setRatings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating === 0) return;

    try {
      setSubmitting(true);
      await rateCrewPerformance(crewId, selectedRating, comment);
      setShowRatingForm(false);
      setSelectedRating(0);
      setComment('');
      await loadRatings();
      onRatingSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, size = 20) => {
    return (
      <div className="rating-stars" style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= rating ? '#ea2323' : 'none'}
            stroke={star <= rating ? '#ea2323' : '#666'}
            strokeWidth="2"
            style={{
              cursor: interactive ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
            onClick={() => interactive && setSelectedRating(star)}
            onMouseEnter={(e) => {
              if (interactive) {
                e.currentTarget.style.transform = 'scale(1.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (interactive) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  };

  if (loading) {
    return (
      <div className="ratings-panel loading">
        <div className="spinner">Loading ratings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ratings-panel error">
        <p style={{ color: '#ea2323' }}>{error}</p>
        <button onClick={loadRatings}>Retry</button>
      </div>
    );
  }

  const avgRating = calculateAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="ratings-panel" style={{ padding: '1.5rem', color: '#fff' }}>
      <div className="ratings-header" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Crew Ratings</h3>
        <div className="rating-summary" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div className="avg-rating">
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#ea2323' }}>
              {avgRating}
            </div>
            {renderStars(Math.round(parseFloat(avgRating)), false, 24)}
            <div style={{ color: '#a5abb5', marginTop: '0.5rem' }}>
              {ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'}
            </div>
          </div>

          <div className="rating-distribution" style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
              return (
                <div
                  key={star}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span style={{ width: '20px' }}>{star}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ea2323">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div
                    style={{
                      flex: 1,
                      height: '8px',
                      background: '#1a1d2e',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: '#ea2323',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ width: '40px', textAlign: 'right', fontSize: '0.9rem' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {userCanRate && (
        <div className="rate-crew-section" style={{ marginBottom: '2rem' }}>
          {!showRatingForm ? (
            <button
              onClick={() => setShowRatingForm(true)}
              style={{
                padding: '0.8rem 1.5rem',
                background: '#ea2323',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Rate This Crew
            </button>
          ) : (
            <form onSubmit={handleSubmitRating} style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Rating:</label>
                {renderStars(selectedRating, true, 32)}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Comment (optional):
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this crew..."
                  maxLength={1000}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.8rem',
                    background: '#1a1d2e',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={selectedRating === 0 || submitting}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: selectedRating === 0 ? '#666' : '#ea2323',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: selectedRating === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingForm(false);
                    setSelectedRating(0);
                    setComment('');
                  }}
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: 'transparent',
                    color: '#a5abb5',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="ratings-list">
        <h4 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Recent Reviews</h4>
        {ratings.length === 0 ? (
          <p style={{ color: '#a5abb5' }}>No ratings yet. Be the first to rate this crew!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ratings.map((rating) => (
              <div
                key={rating.id}
                style={{
                  background: '#0d1117',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #1a1d2e',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  {renderStars(rating.rating, false, 16)}
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>
                    {formatDate(rating.created_at)}
                  </span>
                </div>
                {rating.comment && (
                  <p style={{ color: '#a5abb5', lineHeight: '1.5' }}>{rating.comment}</p>
                )}
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  User: {rating.user_id.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
