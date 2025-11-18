import React, { useRef, useState } from 'react';

export type TimelineEvent = {
  id: string;
  type: 'agent_start' | 'agent_end' | 'tool_call' | 'tool_result' | 'message' | 'error';
  timestamp: number;
  label: string;
  agentId?: string;
};

type TimelineScrubberProps = {
  events: TimelineEvent[];
  currentEventIndex: number;
  onSeek: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
};

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  agent_start: '#4cf5a1',
  agent_end: '#8d96b3',
  tool_call: '#3b82f6',
  tool_result: '#60a5fa',
  message: '#a78bfa',
  error: '#ff6b6b',
};

const EVENT_ICONS: Record<TimelineEvent['type'], string> = {
  agent_start: '▶',
  agent_end: '■',
  tool_call: '🔧',
  tool_result: '✓',
  message: '💬',
  error: '⚠',
};

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  events,
  currentEventIndex,
  onSeek,
  isPlaying,
  onPlayPause,
  onReset,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || events.length === 0) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetIndex = Math.floor(percentage * events.length);
    
    onSeek(Math.max(0, Math.min(targetIndex, events.length - 1)));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current || events.length === 0) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetIndex = Math.floor(percentage * events.length);
    
    onSeek(Math.max(0, Math.min(targetIndex, events.length - 1)));
  };

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 border-t border-white/10 bg-[#0a0f16]">
        <p className="text-sm text-[#8d96b3]">No events recorded yet</p>
      </div>
    );
  }

  const progress = events.length > 0 ? (currentEventIndex / (events.length - 1)) * 100 : 0;

  return (
    <div className="border-t border-white/10 bg-[#0a0f16] px-4 py-3">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={onPlayPause}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-[#151E28] text-white hover:bg-[#1e2a38] transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-[#151E28] text-white hover:bg-[#1e2a38] transition-colors"
          aria-label="Reset"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <div className="flex-1 text-sm text-white">
          <span className="font-semibold">Event {currentEventIndex + 1}</span>
          <span className="text-[#8d96b3]"> / {events.length}</span>
        </div>

        {hoveredEvent !== null && (
          <div className="text-xs text-[#8d96b3] font-mono">
            {events[hoveredEvent]?.label}
          </div>
        )}
      </div>

      {/* Timeline Track */}
      <div
        ref={trackRef}
        className="relative h-12 rounded-lg border border-white/10 bg-[#0d141c] cursor-pointer overflow-hidden"
        onClick={handleTrackClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredEvent(null);
        }}
      >
        {/* Progress Bar */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#E5484D]/20 to-[#E5484D]/40 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />

        {/* Event Dots */}
        <div className="absolute inset-0 flex items-center px-2">
          {events.map((event, index) => {
            const position = (index / (events.length - 1)) * 100;
            const isActive = index === currentEventIndex;
            const isPast = index < currentEventIndex;

            return (
              <div
                key={event.id}
                className="absolute flex flex-col items-center group"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                onMouseEnter={() => setHoveredEvent(index)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                {/* Event Dot */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    isActive
                      ? 'scale-150 border-white shadow-[0_0_12px_rgba(229,72,77,0.6)]'
                      : isPast
                      ? 'border-white/40'
                      : 'border-white/20'
                  }`}
                  style={{
                    backgroundColor: isActive || isPast ? EVENT_COLORS[event.type] : 'transparent',
                  }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="rounded-lg border border-white/10 bg-[#0d141c] px-3 py-2 shadow-xl whitespace-nowrap">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: EVENT_COLORS[event.type] }}>
                        {EVENT_ICONS[event.type]}
                      </span>
                      <span className="text-xs font-semibold text-white">{event.type}</span>
                    </div>
                    <p className="text-xs text-[#8d96b3]">{event.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Position Indicator */}
        <div
          className="absolute top-0 w-0.5 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-200"
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
};
