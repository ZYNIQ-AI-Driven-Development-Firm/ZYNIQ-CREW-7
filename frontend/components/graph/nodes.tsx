import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { AgentIcon, AgentKey } from '../AgentIcon';

export type NodeStatus = 'idle' | 'typing' | 'done' | 'error';

export type AgentNodeData = {
  agentId: AgentKey;
  label: string;
  status: NodeStatus;
  tokens?: number;
};

type AgentNodeProps = {
  data: AgentNodeData;
};

const STATUS_COLORS: Record<NodeStatus, string> = {
  idle: '#8d96b3',
  typing: '#E5484D',
  done: '#4cf5a1',
  error: '#ff6b6b',
};

export const AgentNode: React.FC<AgentNodeProps> = ({ data }) => {
  const { agentId, label, status, tokens } = data;

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="!bg-[#E5484D] !w-2 !h-2" />
      
      <div
        className={`flex flex-col items-center gap-2 rounded-2xl border-2 bg-[#0d141c] px-4 py-3 shadow-lg backdrop-blur-xl transition-all ${
          status === 'typing' ? 'border-[#E5484D] shadow-[0_0_20px_rgba(229,72,77,0.4)]' : 'border-white/10'
        }`}
        style={{ minWidth: '120px' }}
      >
        <AgentIcon
          id={agentId}
          size={48}
          status={status}
          hoverGlow={false}
        />
        
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{label}</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="text-[0.65rem] uppercase tracking-wider" style={{ color: STATUS_COLORS[status] }}>
              {status}
            </span>
          </div>
        </div>

        {tokens !== undefined && tokens > 0 && (
          <div className="mt-1 rounded-full bg-white/5 px-2 py-0.5 text-[0.65rem] text-[#9ea6bd]">
            {tokens.toLocaleString()} tokens
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#E5484D] !w-2 !h-2" />
    </div>
  );
};

export const nodeTypes = {
  agent: AgentNode,
};
