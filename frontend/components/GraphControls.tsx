import React, { useState } from 'react';
import { pauseRun, resumeRun, cancelRun } from '../src/lib/api';

interface GraphControlsProps {
  runId: string;
  currentStatus: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  onStatusChange?: (newStatus: string) => void;
  disabled?: boolean;
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  runId,
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<'cancel' | null>(null);

  const handlePause = async () => {
    try {
      setLoading('pause');
      setError(null);
      await pauseRun(runId);
      onStatusChange?.('paused');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause run');
    } finally {
      setLoading(null);
    }
  };

  const handleResume = async () => {
    try {
      setLoading('resume');
      setError(null);
      await resumeRun(runId);
      onStatusChange?.('running');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume run');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading('cancel');
      setError(null);
      await cancelRun(runId);
      onStatusChange?.('cancelled');
      setShowConfirmDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel run');
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'running':
        return '#4caf50';
      case 'paused':
        return '#ff9800';
      case 'completed':
        return '#2196f3';
      case 'failed':
        return '#ea2323';
      case 'cancelled':
        return '#666';
      default:
        return '#a5abb5';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'running':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" opacity="0.3" />
            <circle cx="12" cy="12" r="6">
              <animate
                attributeName="r"
                values="6;10;6"
                dur="1.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        );
      case 'paused':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        );
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        );
      case 'failed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const canPause = currentStatus === 'running' && !disabled;
  const canResume = currentStatus === 'paused' && !disabled;
  const canCancel = (currentStatus === 'running' || currentStatus === 'paused') && !disabled;

  return (
    <div className="graph-controls" style={{ padding: '1rem' }}>
      <div className="status-indicator" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ color: getStatusColor() }}>
            {getStatusIcon()}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#a5abb5', marginBottom: '0.2rem' }}>
              Run Status
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: getStatusColor(), textTransform: 'uppercase' }}>
              {currentStatus}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
          Run ID: {runId.slice(0, 8)}...
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.8rem',
            background: 'rgba(234, 35, 35, 0.1)',
            border: '1px solid #ea2323',
            borderRadius: '6px',
            color: '#ea2323',
            fontSize: '0.9rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="control-buttons" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        <button
          onClick={handlePause}
          disabled={!canPause || loading === 'pause'}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '0.8rem 1.2rem',
            background: canPause ? '#ff9800' : '#333',
            color: canPause ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: canPause ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (canPause) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canPause) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          {loading === 'pause' ? 'Pausing...' : 'Pause'}
        </button>

        <button
          onClick={handleResume}
          disabled={!canResume || loading === 'resume'}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '0.8rem 1.2rem',
            background: canResume ? '#4caf50' : '#333',
            color: canResume ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: canResume ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (canResume) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canResume) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {loading === 'resume' ? 'Resuming...' : 'Resume'}
        </button>

        <button
          onClick={() => setShowConfirmDialog('cancel')}
          disabled={!canCancel || loading === 'cancel'}
          style={{
            flex: 1,
            minWidth: '120px',
            padding: '0.8rem 1.2rem',
            background: canCancel ? '#ea2323' : '#333',
            color: canCancel ? 'white' : '#666',
            border: 'none',
            borderRadius: '6px',
            cursor: canCancel ? 'pointer' : 'not-allowed',
            fontSize: '0.95rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (canCancel) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 35, 35, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (canCancel) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog === 'cancel' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowConfirmDialog(null)}
        >
          <div
            style={{
              background: '#0d1117',
              border: '1px solid #1a1d2e',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', color: '#fff' }}>
              Cancel Run?
            </h3>
            <p style={{ color: '#a5abb5', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Are you sure you want to cancel this run? This action cannot be undone, and all
              progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmDialog(null)}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'transparent',
                  color: '#a5abb5',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Keep Running
              </button>
              <button
                onClick={handleCancel}
                disabled={loading === 'cancel'}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: '#ea2323',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading === 'cancel' ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                }}
              >
                {loading === 'cancel' ? 'Cancelling...' : 'Yes, Cancel Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
