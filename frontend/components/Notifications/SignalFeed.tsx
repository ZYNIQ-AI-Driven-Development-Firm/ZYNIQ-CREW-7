import React from 'react';

export type SignalType = 'SUCCESS' | 'INFO' | 'WARNING';

export type SignalFeedItem = {
  id: string;
  type: SignalType;
  title: string;
  message: string;
  timestamp: number;
  unread: boolean;
};

type SignalFeedProps = {
  items: SignalFeedItem[];
  onMarkAllRead: () => void;
};

const BADGE_COLORS: Record<SignalType, string> = {
  SUCCESS: 'bg-[#212b1f] text-[#a2f0a6] border-[#4cf5a1]/20',
  INFO: 'bg-[#1E2633] text-[#BBD7FF] border-[#7c9fff]/20',
  WARNING: 'bg-[#2f2419] text-[#ffce6b] border-[#f5d14c]/20',
};

const ICON_COLORS: Record<SignalType, string> = {
  SUCCESS: '#4cf5a1',
  INFO: '#7c9fff',
  WARNING: '#f5d14c',
};

export const SignalFeed: React.FC<SignalFeedProps> = ({ items, onMarkAllRead }) => {
  const unreadCount = items.filter((item) => item.unread).length;

  return (
    <div className="w-96 max-h-[32rem] flex flex-col rounded-2xl border border-white/10 bg-[#0d141c] shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Signal Feed</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#E5484D] px-1.5 text-[0.65rem] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-[#E5484D] hover:text-[#ff6b6b] transition"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
              <svg className="h-6 w-6 text-[#8d96b3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#9ea6bd]">All caught up</p>
            <p className="mt-1 text-xs text-[#7c859f]">No new signals or alerts</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-3 transition ${
                item.unread
                  ? 'border-white/15 bg-white/[0.06]'
                  : 'border-white/8 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${ICON_COLORS[item.type]}15` }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ICON_COLORS[item.type] }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${BADGE_COLORS[item.type]}`}
                    >
                      {item.type}
                    </span>
                    {item.unread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#E5484D]" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#cbd4e6]">{item.message}</p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-wider text-[#7c859f]">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
