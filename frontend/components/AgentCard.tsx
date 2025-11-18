import React from 'react';
import { Agent } from '../src/lib/api';
import { AgentIcon, AgentKey } from './AgentIcon';
import { Bot, Zap, Target, Brain } from 'lucide-react';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
  compact?: boolean;
}

const roleToAgentKey = (role: string): AgentKey => {
  const roleMap: Record<string, AgentKey> = {
    orchestrator: 'orion',
    backend_architect: 'atlas',
    frontend_developer: 'nova',
    ml_engineer: 'helix',
    qa_tester: 'vega',
    devops_engineer: 'sigma',
    security_specialist: 'titan',
    content_strategist: 'lyra',
    social_media_manager: 'echo',
    seo_specialist: 'pulse',
    analytics_expert: 'kepler',
    brand_designer: 'neon',
    campaign_manager: 'aquila',
  };
  return (roleMap[role.toLowerCase()] || 'orion') as AgentKey;
};

const getRoleColor = (role: string): string => {
  const colorMap: Record<string, string> = {
    orchestrator: 'from-purple-500 to-pink-500',
    backend_architect: 'from-blue-500 to-cyan-500',
    frontend_developer: 'from-green-500 to-emerald-500',
    ml_engineer: 'from-orange-500 to-red-500',
    qa_tester: 'from-yellow-500 to-amber-500',
    devops_engineer: 'from-indigo-500 to-blue-500',
    security_specialist: 'from-red-500 to-rose-500',
    content_strategist: 'from-violet-500 to-purple-500',
    social_media_manager: 'from-pink-500 to-rose-500',
    seo_specialist: 'from-teal-500 to-cyan-500',
    analytics_expert: 'from-amber-500 to-yellow-500',
    brand_designer: 'from-fuchsia-500 to-pink-500',
    campaign_manager: 'from-cyan-500 to-blue-500',
  };
  return colorMap[role.toLowerCase()] || 'from-gray-500 to-slate-500';
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick, compact = false }) => {
  const agentKey = roleToAgentKey(agent.role);
  const gradientColor = getRoleColor(agent.role);
  const skills = agent.tools_list?.split(',').map(s => s.trim()).filter(Boolean) || [];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          group relative p-4 rounded-2xl bg-white/5 border border-white/10
          hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer
          backdrop-blur-sm
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientColor} p-0.5 shrink-0`}>
            <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center">
              <AgentIcon id={agentKey} size={24} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold truncate">{agent.name}</h4>
            <p className="text-white/60 text-sm truncate">{agent.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        group relative p-6 rounded-3xl bg-white/5 border border-white/10
        hover:bg-white/10 hover:border-white/20 transition-all
        ${onClick ? 'cursor-pointer' : ''}
        backdrop-blur-sm
      `}
    >
      {/* Header with icon and name */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientColor} p-0.5 shrink-0`}>
          <div className="w-full h-full rounded-2xl bg-black/80 flex items-center justify-center">
            <AgentIcon id={agentKey} size={32} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1">{agent.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">{agent.role.replace(/_/g, ' ')}</span>
            {agent.specialist_type && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-sm text-white/60">{agent.specialist_type}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-white/70 text-sm mb-4 line-clamp-2">{agent.description}</p>
      )}

      {/* Goal */}
      {agent.goal && (
        <div className="flex items-start gap-2 mb-4">
          <Target className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
          <p className="text-white/60 text-sm line-clamp-2">{agent.goal}</p>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Skills</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs"
              >
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Backstory preview */}
      {agent.backstory && (
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-white/50 text-xs line-clamp-2 italic">{agent.backstory}</p>
        </div>
      )}

      {/* Hover overlay indicator */}
      {onClick && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all pointer-events-none" />
      )}
    </div>
  );
};

export default AgentCard;
