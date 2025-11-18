import React, { useEffect, useState } from 'react';
import { Agent, listCrewAgents } from '../src/lib/api';
import AgentCard from './AgentCard';
import { Users, Plus, AlertCircle, RefreshCw } from 'lucide-react';

interface AgentListProps {
  crewId: string;
  onAgentClick?: (agent: Agent) => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  compact?: boolean;
  maxDisplay?: number;
}

export const AgentList: React.FC<AgentListProps> = ({
  crewId,
  onAgentClick,
  showAddButton = false,
  onAddClick,
  compact = false,
  maxDisplay,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAgents();
  }, [crewId]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listCrewAgents(crewId);
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const displayedAgents = maxDisplay ? agents.slice(0, maxDisplay) : agents;
  const remainingCount = maxDisplay && agents.length > maxDisplay ? agents.length - maxDisplay : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/60" />
            <h3 className="text-lg font-semibold text-white">Agents</h3>
          </div>
          <RefreshCw className="w-5 h-5 text-white/40 animate-spin" />
        </div>
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-white/10 rounded w-32"></div>
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Agents</h3>
        </div>
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium mb-1">Failed to load agents</p>
              <p className="text-red-300/70 text-sm mb-3">{error}</p>
              <button
                onClick={loadAgents}
                className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Agents</h3>
        </div>
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
          <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 mb-4">No agents found for this crew</p>
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Agent
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">
            Agents
            <span className="text-white/50 font-normal ml-2">({agents.length})</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAgents}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white/60" />
          </button>
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Agent
            </button>
          )}
        </div>
      </div>

      {/* Agent grid */}
      <div className={`grid ${compact ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
        {displayedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={onAgentClick ? () => onAgentClick(agent) : undefined}
            compact={compact}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {remainingCount > 0 && (
        <div className="text-center pt-2">
          <p className="text-sm text-white/50">
            +{remainingCount} more agent{remainingCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentList;
