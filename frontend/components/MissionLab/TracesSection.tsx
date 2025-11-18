import React, { useState, useEffect } from 'react';

export type TraceStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type TraceType = 'agent_start' | 'agent_token' | 'agent_end' | 'tool_call' | 'tool_result' | 'edge' | 'error';

export interface Trace {
  id: string;
  run_id: string;
  crew_id: string;
  crew_name: string;
  status: TraceStatus;
  type: TraceType;
  timestamp: string;
  duration_ms?: number;
  data: Record<string, unknown>;
}

export interface TraceFilters {
  status?: TraceStatus;
  type?: TraceType;
  crew_id?: string;
  date_from?: string;
  date_to?: string;
}

export const TracesSection: React.FC = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TraceFilters>({});
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  useEffect(() => {
    const fetchTraces = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const data = await fetch('/traces?' + new URLSearchParams(filters)).then(r => r.json());
        // setTraces(data);
        
        // Mock data for now
        const mockTraces: Trace[] = Array.from({ length: 10 }, (_, i) => ({
          id: `trace-${i}`,
          run_id: `run-${Math.floor(i / 3)}`,
          crew_id: `crew-${i % 3}`,
          crew_name: ['Backend Builder', 'Frontend Builder', 'Marketing Crew'][i % 3],
          status: (['succeeded', 'running', 'failed'] as TraceStatus[])[i % 3],
          type: (['agent_start', 'tool_call', 'agent_end'] as TraceType[])[i % 3],
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          duration_ms: Math.floor(Math.random() * 5000),
          data: { message: `Trace event ${i}` },
        }));
        
        setTraces(mockTraces);
      } catch (error) {
        console.error('Failed to fetch traces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTraces();
  }, [filters]);

  const statusColors: Record<TraceStatus, string> = {
    queued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    running: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    succeeded: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-3xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as TraceStatus || undefined })}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ea2323] transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.type || ''}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as TraceType || undefined })}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ea2323] transition-colors"
          >
            <option value="">All Types</option>
            <option value="agent_start">Agent Start</option>
            <option value="agent_token">Agent Token</option>
            <option value="agent_end">Agent End</option>
            <option value="tool_call">Tool Call</option>
            <option value="tool_result">Tool Result</option>
            <option value="edge">Edge</option>
            <option value="error">Error</option>
          </select>

          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors font-semibold"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Traces Table */}
      <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Run ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Crew</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/40">
                    Loading traces...
                  </td>
                </tr>
              ) : traces.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-white/40">
                    No traces found
                  </td>
                </tr>
              ) : (
                traces.map((trace) => (
                  <tr
                    key={trace.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedTrace(trace)}
                  >
                    <td className="px-6 py-4 text-sm text-white/90 font-mono">{trace.run_id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-white/90">{trace.crew_name}</td>
                    <td className="px-6 py-4 text-sm text-white/60">{trace.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[trace.status]}`}>
                        {trace.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-white/60">
                      {trace.duration_ms ? `${trace.duration_ms}ms` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-[#ea2323] hover:text-[#ff2e2e] text-sm font-semibold">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trace Detail Modal */}
      {selectedTrace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTrace(null)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Trace Details</h3>
              <button
                onClick={() => setSelectedTrace(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Trace ID</p>
                  <p className="text-sm text-white font-mono">{selectedTrace.id}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Run ID</p>
                  <p className="text-sm text-white font-mono">{selectedTrace.run_id}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Crew</p>
                  <p className="text-sm text-white">{selectedTrace.crew_name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm text-white">{selectedTrace.type}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[selectedTrace.status]}`}>
                    {selectedTrace.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-sm text-white">{selectedTrace.duration_ms ? `${selectedTrace.duration_ms}ms` : 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Data</p>
                <pre className="bg-black/30 rounded-xl p-4 text-xs text-white/80 overflow-x-auto">
                  {JSON.stringify(selectedTrace.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
