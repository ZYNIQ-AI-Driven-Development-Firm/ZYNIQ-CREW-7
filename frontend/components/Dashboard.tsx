import React, { useEffect, useState } from 'react';
import type { Crew } from '@/src/lib/api';

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

type RunStats = {
  success_rate: number;
  avg_latency_ms: number;
  total_tokens: number;
  total_runs: number;
};

const STATUS_LABEL: Record<MissionStatus, { label: string; tone: string }> = {
  available: { label: 'Available', tone: '#4cf5a1' },
  busy: { label: 'Busy', tone: '#f5d14c' },
  offline: { label: 'Offline', tone: '#f1786b' },
};

const ring = (percent: number) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return { circumference, offset };
};

const Sparkline: React.FC<{ points?: number[] }> = ({ points = [4, 6, 3, 7, 8, 5, 9, 6, 11, 8] }) => {
  const max = Math.max(...points, 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 16} ${40 - (p / max) * 36}`)
    .join(' ');
  return (
    <svg viewBox="0 0 160 40" className="w-full h-8" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#E5484D" strokeWidth="2" />
    </svg>
  );
};

const MiniBars: React.FC<{ values?: number[] }> = ({ values = [2, 4, 6, 3, 7, 9, 5, 8] }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-8">
      {values.map((v, i) => (
        <div key={i} className="w-2 rounded-sm bg-[#E5484D]" style={{ height: `${(v / max) * 100}%`, opacity: 0.8 }} />
      ))}
    </div>
  );
};

const Timeline60m: React.FC = () => (
  <div className="h-8 w-full rounded-xl bg-[#151E28] border border-white/10 flex overflow-hidden">
    {Array.from({ length: 60 }).map((_, i) => (
      <div key={i} className={`flex-1 ${i % 5 === 0 ? 'bg-white/6' : 'bg-white/[0.02]'} border-r border-white/[0.04]`} />
    ))}
  </div>
);

const StreamingConsole: React.FC<{ events: RunLogEvent[] }> = ({ events }) => {
  const chipClass = (t: RunLogEvent['type']) => (
    t === 'token'
      ? 'bg-[#1E2633] text-[#BBD7FF]'
      : t === 'tool'
      ? 'bg-[#1F2A24] text-[#B8F5D2]'
      : t === 'metric'
      ? 'bg-[#2A2430] text-[#EAB8FF]'
      : t === 'done'
      ? 'bg-[#212b1f] text-[#a2f0a6]'
      : t === 'error'
      ? 'bg-[#2f1c1c] text-[#ffbcbc]'
      : 'bg-[#2A1F1F] text-[#FFBCBC]'
  );

  return (
    <div className="rounded-2xl bg-[#0D141C] border border-white/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Streaming Console</p>
        <span className="text-[0.65rem] text-[#9ea6bd]">SSE/WS</span>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-6 text-center text-xs text-[#8790a8]">
            Awaiting next mission run — tool calls, logs, and metrics will appear here in real time.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-[#cbd5e1]">
              <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${chipClass(event.type)}`}>
                {event.type}
              </span>
              <div className="flex-1">
                <p className="break-words leading-snug">{event.text}</p>
                <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.2em] text-[#7c859f]">
                  {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <Timeline60m />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ crew, missionStatus, runEvents }) => {
  const [stats, setStats] = useState<RunStats | null>(null);
  const activeRotation = crew?.rotation ?? [];
  const { circumference, offset } = ring(stats?.success_rate ?? 86);
  const status = STATUS_LABEL[missionStatus];

  useEffect(() => {
    const token = window.localStorage.getItem('crew7_access_token');
    if (!token) return;

    fetch('/api/runs/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data && setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-6 text-[#e6edf7]">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Mission Operations Overview</h1>
        <p className="text-sm text-[#9ea6bd]">
          Mission signal is <span className="font-semibold" style={{ color: status.tone }}>{status.label}</span>. Crew telemetry and streaming output update in real time.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#151E28] border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Runs This Session</p>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-3xl font-semibold">{stats?.total_runs ?? runEvents.length}</span>
            <div className="w-40"><Sparkline /></div>
          </div>
        </div>
        <div className="rounded-2xl bg-[#151E28] border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Success Rate</p>
          <div className="mt-2 flex items-center gap-4">
            <svg viewBox="0 0 72 72" className="h-16 w-16">
              <circle cx="36" cy="36" r="28" stroke="#243041" strokeWidth="8" fill="none" />
              <circle
                cx="36"
                cy="36"
                r="28"
                stroke="#E5484D"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <span className="text-3xl font-semibold">{stats?.success_rate ?? 0}%</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#151E28] border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Avg Latency</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-semibold">{stats?.avg_latency_ms ?? 0}</span>
            <span className="text-sm text-[#9ea6bd]">ms</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-[#4cf5a1]">
            <span>▼</span>
            <span>12% faster</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#151E28] border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Token Usage</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-semibold">{stats?.total_tokens ? (stats.total_tokens / 1000).toFixed(1) : '0'}K</span>
          </div>
          <div className="mt-3"><MiniBars values={runEvents.slice(0, 8).map(() => 6)} /></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl bg-[#151E28] border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8d96b3]">Active Crew</p>
            <span className="text-[0.65rem] text-[#9ea6bd]">{crew?.status ?? 'Unknown'}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {crew ? (
              <div className="rounded-xl border border-white/10 bg-[#0D141C] p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#E5484D] to-[#F29E9E]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{crew.name}</p>
                    <p className="text-xs text-[#9ea6bd]">Lead: {crew.orchestrator?.agentId ?? 'Unknown'}</p>
                  </div>
                  <span className={`h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: status.tone }} />
                </div>
                {activeRotation.length ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#7c859f]">Rotation</p>
                    <ul className="space-y-1 text-xs text-[#cbd5e1]">
                      {activeRotation.map((agent) => (
                        <li key={agent.agentId}>{agent.agentId}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-xs text-[#8790a8]">
                No crew selected. Runs will populate once a crew is assigned.
              </div>
            )}
          </div>
        </div>
        <StreamingConsole events={runEvents.slice(0, 10)} />
      </div>
    </div>
  );
};

export default Dashboard;
