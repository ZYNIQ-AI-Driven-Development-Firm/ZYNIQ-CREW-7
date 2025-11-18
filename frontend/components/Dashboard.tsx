import React, { useEffect, useState, useRef } from 'react';
import { animate, stagger } from 'animejs';

import type { Crew } from '@/src/lib/api';
import { getDashboardStats, type DashboardStats } from '@/src/lib/api';
import { MissionWebSocket, type MissionEvent } from '@/src/lib/websocket';

type MissionStatus = 'available' | 'busy' | 'offline';

export type RunLogEvent = {
  id: string;
  type: 'token' | 'tool' | 'log' | 'metric' | 'done' | 'error';
  text: string;
  createdAt: number;
};

type DashboardProps = {
  crew: Crew | null;
  missionStatus: MissionStatus;
  runEvents: RunLogEvent[];
};

const STATUS_LABEL: Record<MissionStatus, { label: string; tone: string }> = {
  available: { label: 'Available', tone: '#4cf5a1' },
  busy: { label: 'Busy', tone: '#f5d14c' },
  offline: { label: 'Offline', tone: '#f1786b' },
};

const StreamingConsole: React.FC<{ events: RunLogEvent[] }> = ({ events }) => {
  const consoleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (consoleRef.current && events.length > 0) {
      const items = consoleRef.current.querySelectorAll('.console-item');
      animate({
        targets: items,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 400,
        delay: stagger(50),
        easing: 'easeOutQuad',
      });
    }
  }, [events]);

  const chipClass = (t: RunLogEvent['type']) => (
    t === 'token'
      ? 'bg-[#1E2633] text-[#BBD7FF] border border-[#BBD7FF]/20'
      : t === 'tool'
      ? 'bg-[#1F2A24] text-[#B8F5D2] border border-[#B8F5D2]/20'
      : t === 'metric'
      ? 'bg-[#2A2430] text-[#EAB8FF] border border-[#EAB8FF]/20'
      : t === 'done'
      ? 'bg-[#212b1f] text-[#a2f0a6] border border-[#a2f0a6]/20'
      : t === 'error'
      ? 'bg-[#2f1c1c] text-[#ffbcbc] border border-[#ffbcbc]/20'
      : 'bg-[#2A1F1F] text-[#FFBCBC] border border-[#FFBCBC]/20'
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0f1419]/80 to-[#1a1f2e]/60 border border-white/5 p-5 sm:p-6 space-y-3 transition-all hover:border-white/10">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Streaming Console</p>
        <span className="text-[0.6rem] sm:text-[0.65rem] text-white/40 font-mono">SSE/WS</span>
      </div>
      <div ref={consoleRef} className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-8 sm:py-10 text-center transition-all hover:border-white/20 hover:bg-white/[0.03]">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs sm:text-sm text-white/50">Awaiting next mission run</p>
            <p className="text-[0.7rem] sm:text-xs text-white/30 mt-1">Tool calls, logs, and metrics will stream here</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="console-item flex items-start gap-2 sm:gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-white/90 transition-all hover:bg-white/[0.05] hover:border-white/20">
              <span className={`mt-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] flex-shrink-0 ${chipClass(event.type)}`}>
                {event.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="break-words leading-snug">{event.text}</p>
                <span className="mt-1 block text-[0.55rem] sm:text-[0.6rem] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40 font-mono">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ crew, missionStatus, runEvents }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<MissionStatus>(missionStatus);
  const [liveCrewId, setLiveCrewId] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const activeRotation = crew?.rotation ?? [];
  const status = STATUS_LABEL[liveStatus];

  // WebSocket connection for real-time crew status updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const missionWs = new MissionWebSocket(token);
    
    const unsubscribe = missionWs.subscribe((event: MissionEvent) => {
      if (event.type === 'signal' && event.payload) {
        setLiveStatus(event.payload.status);
        if (event.payload.crewId) {
          setLiveCrewId(event.payload.crewId);
        }
        console.log('[Dashboard] Live status update:', event.payload);
      }
    });

    missionWs.connect();

    return () => {
      unsubscribe();
      missionWs.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cardsRef.current && !loading) {
      const cards = cardsRef.current.querySelectorAll('.stat-card');
      animate({
        targets: cards,
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 500,
        delay: stagger(100),
        easing: 'easeOutQuad',
      });
    }
  }, [loading]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto text-white">
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mission Operations</h1>
            <p className="text-sm sm:text-base text-white/60 mt-1">
              Mission signal is <span className="font-semibold" style={{ color: status.tone }}>{status.label}</span>
            </p>
          </div>
          {/* Live Connection Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
            <div className="relative flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
            </div>
            <span className="text-xs font-medium text-white/80">Live Updates</span>
          </div>
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-500/20 p-4 sm:p-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-300">Failed to load dashboard data</p>
              <p className="text-xs sm:text-sm text-red-400/80 mt-1 break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div ref={cardsRef} className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Runs Card */}
        <div className="stat-card group rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 sm:p-6 transition-all duration-300 hover:border-[#ea2323]/30 hover:shadow-lg hover:shadow-[#ea2323]/10 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Total Runs</p>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#ea2323] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-4 border-[#ea2323]/20 border-t-[#ea2323] animate-spin" />
              <span className="text-xs sm:text-sm text-white/60">Loading...</span>
            </div>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{stats?.total_runs ?? 0}</span>
              <p className="text-white/40 text-xs sm:text-sm mt-2">Total crew runs executed</p>
            </>
          )}
        </div>

        {/* Success Rate Card */}
        <div className="stat-card group rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 sm:p-6 transition-all duration-300 hover:border-[#4cf5a1]/30 hover:shadow-lg hover:shadow-[#4cf5a1]/10 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Success Rate</p>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#4cf5a1] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-4 border-[#4cf5a1]/20 border-t-[#4cf5a1] animate-spin" />
              <span className="text-xs sm:text-sm text-white/60">Loading...</span>
            </div>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{((stats?.success_rate ?? 0) * 100).toFixed(1)}%</span>
              <p className="text-white/40 text-xs sm:text-sm mt-2">Successful completions</p>
            </>
          )}
        </div>

        {/* Avg Latency Card */}
        <div className="stat-card group rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 sm:p-6 transition-all duration-300 hover:border-[#cbd4e6]/30 hover:shadow-lg hover:shadow-[#cbd4e6]/10 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Avg Latency</p>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#cbd4e6] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-4 border-[#cbd4e6]/20 border-t-[#cbd4e6] animate-spin" />
              <span className="text-xs sm:text-sm text-white/60">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{(stats?.avg_latency_ms ?? 0).toFixed(0)}</span>
                <span className="text-white/60 text-xs sm:text-sm">ms</span>
              </div>
              <p className="text-white/40 text-xs sm:text-sm mt-2">Response time</p>
            </>
          )}
        </div>

        {/* Total Tokens Card */}
        <div className="stat-card group rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 sm:p-6 transition-all duration-300 hover:border-[#f5d14c]/30 hover:shadow-lg hover:shadow-[#f5d14c]/10 hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Total Tokens</p>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#f5d14c] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-4 border-[#f5d14c]/20 border-t-[#f5d14c] animate-spin" />
              <span className="text-xs sm:text-sm text-white/60">Loading...</span>
            </div>
          ) : (
            <>
              <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">{(stats?.total_tokens ?? 0).toLocaleString()}</span>
              <p className="text-white/40 text-xs sm:text-sm mt-2">Tokens consumed</p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-[1.2fr,0.8fr]">
        {/* Active Crew Section */}
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-5 sm:p-6 transition-all duration-300 hover:border-white/20">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/70">Active Crew</p>
            <span className="text-[0.6rem] sm:text-[0.65rem] text-white/40 truncate max-w-[120px]">{crew?.id ? `ID: ${crew.id.slice(0, 8)}...` : 'No crew'}</span>
          </div>
          {crew ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#ea2323] to-[#ff2e2e] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {crew.name?.charAt(0) ?? 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold truncate">{crew.name}</p>
                    <p className="text-[0.7rem] sm:text-xs text-white/60 truncate">Role: {crew.role ?? 'Multi-purpose'}</p>
                  </div>
                  <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full animate-pulse flex-shrink-0`} style={{ backgroundColor: status.tone }} />
                </div>
                {activeRotation.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-white/40 mb-2">Agent Rotation</p>
                    <div className="grid grid-cols-2 gap-2">
                      {activeRotation.slice(0, 6).map((agent) => (
                        <div key={agent.agentId} className="text-[0.7rem] sm:text-xs text-white/90 bg-white/[0.03] rounded-lg px-2 py-1.5 truncate hover:bg-white/[0.06] transition-colors border border-white/5">
                          {agent.agentId}
                        </div>
                      ))}
                    </div>
                    {activeRotation.length > 6 && (
                      <p className="text-[0.6rem] sm:text-[0.65rem] text-white/40 mt-2">+{activeRotation.length - 6} more agents</p>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Runs from API */}
              {stats?.recent_runs && stats.recent_runs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Recent Runs</p>
                  {stats.recent_runs.slice(0, 3).map((run) => (
                    <div key={run.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between transition-all hover:bg-white/[0.05] hover:border-white/20">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{run.crew_name}</p>
                        <p className="text-[0.65rem] sm:text-xs text-white/50">{new Date(run.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[0.6rem] sm:text-[0.65rem] font-semibold uppercase tracking-wider flex-shrink-0 ${
                        run.status === 'completed' ? 'bg-[#4cf5a1]/20 text-[#4cf5a1] border border-[#4cf5a1]/30' :
                        run.status === 'running' ? 'bg-[#ea2323]/20 text-[#ea2323] border border-[#ea2323]/30 animate-pulse' :
                        run.status === 'failed' ? 'bg-[#f1786b]/20 text-[#f1786b] border border-[#f1786b]/30' :
                        'bg-white/20 text-white/70 border border-white/30'
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 sm:p-12 text-center transition-all hover:border-white/25 hover:bg-white/[0.05]">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm sm:text-base text-white/60 font-medium">No crew selected</p>
              <p className="text-xs sm:text-sm text-white/40 mt-1">Create or select a crew to start missions</p>
            </div>
          )}
        </div>
        <StreamingConsole events={runEvents.slice(0, 10)} />
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
