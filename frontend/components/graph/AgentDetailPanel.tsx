import React from 'react';
import { AgentIcon, AgentKey } from '../AgentIcon';
import type { NodeStatus } from './nodes';

type Message = {
  id: string;
  content: string;
  timestamp: string;
};

type ToolCall = {
  id: string;
  tool: string;
  status: 'running' | 'success' | 'error';
  duration?: number;
  timestamp: string;
};

type AgentDetailPanelProps = {
  agentId: AgentKey;
  label: string;
  role?: string;
  description?: string;
  status: NodeStatus;
  currentTask?: string;
  messages: Message[];
  toolCalls: ToolCall[];
  onClose: () => void;
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  idle: '#8d96b3',
  typing: '#E5484D',
  done: '#4cf5a1',
  error: '#ff6b6b',
};

const STATUS_LABELS: Record<NodeStatus, string> = {
  idle: 'Idle',
  typing: 'Running',
  done: 'Complete',
  error: 'Error',
};

export const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({
  agentId,
  label,
  role,
  description,
  status,
  currentTask,
  messages,
  toolCalls,
  onClose,
}) => {
  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l border-white/10 bg-[#0a0f16] shadow-2xl backdrop-blur-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d141c] px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AgentIcon agent={agentId} size={48} status={status} hoverGlow={false} />
            <div>
              <h3 className="text-lg font-bold text-white">{label}</h3>
              {role && <p className="text-sm text-[#8d96b3]">{role}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8d96b3] hover:text-white transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-3 flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full animate-pulse-glow"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: STATUS_COLORS[status] }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Description */}
        {description && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8d96b3] mb-2">About</h4>
            <p className="text-sm text-white/80 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Current Task */}
        {currentTask && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8d96b3] mb-2">Current Task</h4>
            <div className="rounded-xl border border-white/10 bg-[#0d141c] p-3">
              <p className="text-sm text-white/90">{currentTask}</p>
            </div>
          </div>
        )}

        {/* Recent Tool Calls */}
        {toolCalls.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8d96b3] mb-2">
              Tool Calls ({toolCalls.length})
            </h4>
            <div className="space-y-2">
              {toolCalls.slice(0, 10).map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-xl border border-white/5 bg-[#0d141c] p-3 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white font-mono">{tool.tool}</span>
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        tool.status === 'success'
                          ? 'text-[#4cf5a1]'
                          : tool.status === 'error'
                          ? 'text-[#ff6b6b]'
                          : 'text-[#E5484D]'
                      }`}
                    >
                      {tool.status === 'running' && '⏳'}
                      {tool.status === 'success' && '✓'}
                      {tool.status === 'error' && '✗'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8d96b3]">
                    <span>{tool.timestamp}</span>
                    {tool.duration !== undefined && <span>{tool.duration.toFixed(2)}s</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {messages.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8d96b3] mb-2">
              Recent Messages ({messages.length})
            </h4>
            <div className="space-y-2">
              {messages.slice(0, 10).map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-white/5 bg-[#0d141c] p-3 hover:border-white/10 transition-colors"
                >
                  <p className="text-sm text-white/90 mb-1 line-clamp-3">{msg.content}</p>
                  <span className="text-xs text-[#8d96b3]">{msg.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {toolCalls.length === 0 && messages.length === 0 && !currentTask && (
          <div className="text-center py-8">
            <p className="text-sm text-[#8d96b3]">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
