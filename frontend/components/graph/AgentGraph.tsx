import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AgentNodeData, nodeTypes, NodeStatus } from './nodes';
import { AgentKey } from '../AgentIcon';
import { GraphWebSocket, type GraphEvent as WSGraphEvent } from '@/src/lib/websocket';
import { AgentDetailPanel } from './AgentDetailPanel';
import { TimelineScrubber, type TimelineEvent } from './TimelineScrubber';

type AgentGraphProps = {
  crewId: string;
  runId?: string | null;
  visible?: boolean;
};

type GraphEvent =
  | { type: 'agent_start'; agent: string }
  | { type: 'agent_token'; agent: string; text: string }
  | { type: 'edge'; from: string; to: string; message: string }
  | { type: 'agent_end'; agent: string; status: 'done' | 'error'; tokens: number }
  | { type: 'tool_start'; tool: string; agent_id?: string; crew_id: string; params: any }
  | { type: 'tool_end'; tool: string; agent_id?: string; crew_id: string; duration_s: number; exit_code?: number; status: string }
  | { type: 'tool_progress'; tool: string; agent_id?: string; crew_id: string; message: string; progress?: number };

const AGENT_POSITIONS: Record<string, { x: number; y: number }> = {
  orchestrator: { x: 400, y: 50 },
  orion: { x: 200, y: 200 },
  vega: { x: 400, y: 200 },
  nova: { x: 600, y: 200 },
  atlas: { x: 100, y: 350 },
  lyra: { x: 300, y: 350 },
  helix: { x: 500, y: 350 },
  quark: { x: 700, y: 350 },
};

const INITIAL_NODES: Node<AgentNodeData>[] = [
  {
    id: 'orchestrator',
    type: 'agent',
    position: AGENT_POSITIONS.orchestrator,
    data: { agentId: 'orion', label: 'Orchestrator', status: 'idle' },
  },
  {
    id: 'backend',
    type: 'agent',
    position: AGENT_POSITIONS.orion,
    data: { agentId: 'orion', label: 'Backend Engineer', status: 'idle' },
  },
  {
    id: 'frontend',
    type: 'agent',
    position: AGENT_POSITIONS.vega,
    data: { agentId: 'vega', label: 'Frontend Engineer', status: 'idle' },
  },
  {
    id: 'qa',
    type: 'agent',
    position: AGENT_POSITIONS.nova,
    data: { agentId: 'nova', label: 'QA Engineer', status: 'idle' },
  },
  {
    id: 'devops',
    type: 'agent',
    position: AGENT_POSITIONS.atlas,
    data: { agentId: 'atlas', label: 'DevOps', status: 'idle' },
  },
  {
    id: 'data',
    type: 'agent',
    position: AGENT_POSITIONS.lyra,
    data: { agentId: 'lyra', label: 'Data Engineer', status: 'idle' },
  },
  {
    id: 'security',
    type: 'agent',
    position: AGENT_POSITIONS.helix,
    data: { agentId: 'helix', label: 'Security Analyst', status: 'idle' },
  },
];

export const AgentGraph: React.FC<AgentGraphProps> = ({ crewId, runId, visible = true }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [toast, setToast] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // New state for interactivity
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const [agentMessages, setAgentMessages] = useState<Record<string, Array<{ id: string; content: string; timestamp: string }>>>({});
  const [agentToolCalls, setAgentToolCalls] = useState<Record<string, Array<{ id: string; tool: string; status: 'running' | 'success' | 'error'; duration?: number; timestamp: string }>>>({});
  const [edgeTooltip, setEdgeTooltip] = useState<{ x: number; y: number; message: string } | null>(null);

  // Load layout from backend
  useEffect(() => {
    if (!visible) return;
    
    const token = window.localStorage.getItem('crew7_access_token');
    if (!token) return;

    fetch(`/api/graph/${crewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nodes?.length) {
          setNodes(data.nodes);
        }
        if (data?.edges?.length) {
          setEdges(data.edges);
        }
      })
      .catch(() => {});
  }, [crewId, visible, setNodes, setEdges]);

  // Save layout to backend (debounced)
  const saveLayout = useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const token = window.localStorage.getItem('crew7_access_token');
          if (!token) return;

          fetch(`/api/graph/${crewId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nodes, edges }),
          }).catch(() => {});
        }, 1000);
      };
    },
    [crewId, nodes, edges]
  );

  useEffect(() => {
    if (visible) saveLayout();
  }, [nodes, edges, visible, saveLayout]);

  // WebSocket connection for live updates using centralized service
  useEffect(() => {
    if (!visible || isReplaying) return;

    const token = window.localStorage.getItem('crew7_access_token');
    if (!token) return;

    const graphWs = new GraphWebSocket(crewId, token);
    
    const unsubscribe = graphWs.subscribe((msg: WSGraphEvent) => {
      // Handle tool events from new WebSocket infrastructure
      if (msg.type === 'tool_start') {
        setToast(`🔧 ${msg.tool} started${msg.agent_id ? ` (${msg.agent_id})` : ''}`);
        setTimeout(() => setToast(null), 3000);
        
        // Add to timeline
        const event: TimelineEvent = {
          id: `tool_start_${Date.now()}`,
          type: 'tool_call',
          timestamp: Date.now(),
          label: `${msg.tool} started`,
          agentId: msg.agent_id,
        };
        setTimelineEvents(prev => [...prev, event]);
        
        // Add to tool calls
        if (msg.agent_id) {
          setAgentToolCalls(prev => ({
            ...prev,
            [msg.agent_id!]: [
              ...(prev[msg.agent_id!] || []),
              {
                id: event.id,
                tool: msg.tool || 'unknown',
                status: 'running',
                timestamp: new Date().toLocaleTimeString(),
              },
            ],
          }));
          
          // Update node status with glow animation
          setNodes((nds) =>
            nds.map((node) =>
              node.id === msg.agent_id 
                ? { 
                    ...node, 
                    data: { ...node.data, status: 'typing' as NodeStatus },
                    className: 'animate-node-glow'
                  } 
                : node
            )
          );
          
          // Remove glow after animation
          setTimeout(() => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === msg.agent_id
                  ? { ...node, className: '' }
                  : node
              )
            );
          }, 1000);
        }
      } else if (msg.type === 'tool_progress') {
        setToast(`⏳ ${msg.tool}: ${msg.message}`);
        setTimeout(() => setToast(null), 2000);
      } else if (msg.type === 'tool_end') {
        const icon = msg.status === 'success' ? '✅' : msg.status === 'error' ? '❌' : '⚠️';
        setToast(`${icon} ${msg.tool} ${msg.status} (${msg.duration_s?.toFixed(2)}s)`);
        setTimeout(() => setToast(null), 3000);
        
        // Add to timeline
        const event: TimelineEvent = {
          id: `tool_end_${Date.now()}`,
          type: 'tool_result',
          timestamp: Date.now(),
          label: `${msg.tool} ${msg.status}`,
          agentId: msg.agent_id,
        };
        setTimelineEvents(prev => [...prev, event]);
        
        // Update tool call status
        if (msg.agent_id) {
          setAgentToolCalls(prev => {
            const agentCalls = prev[msg.agent_id!] || [];
            const updatedCalls = agentCalls.map(call =>
              call.tool === msg.tool && call.status === 'running'
                ? { ...call, status: msg.status === 'success' ? 'success' as const : 'error' as const, duration: msg.duration_s }
                : call
            );
            return { ...prev, [msg.agent_id!]: updatedCalls };
          });
          
          setNodes((nds) =>
            nds.map((node) =>
              node.id === msg.agent_id
                ? { ...node, data: { ...node.data, status: msg.status === 'success' ? 'done' : 'error' } }
                : node
            )
          );
        }
      }
      
      // Update current event index to latest
      setCurrentEventIndex(prev => prev + 1);
    });

    graphWs.connect();
    console.log(`[AgentGraph] Connected to GraphWebSocket for crew ${crewId}`);

    return () => {
      unsubscribe();
      graphWs.disconnect();
      console.log(`[AgentGraph] Disconnected GraphWebSocket for crew ${crewId}`);
    };
  }, [crewId, visible, isReplaying, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );
  
  // Node click handler - focus agent and open detail panel
  const handleNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedAgent(node.id);
    
    // Highlight selected node, dim others
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: n.id === node.id ? 1 : 0.4,
        },
      }))
    );
  }, [setNodes]);
  
  // Edge hover handler - show message tooltip
  const handleEdgeMouseEnter: EdgeMouseHandler = useCallback((event, edge) => {
    const mouseEvent = event as unknown as React.MouseEvent;
    setEdgeTooltip({
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
      message: edge.label as string || 'Message exchanged',
    });
  }, []);
  
  const handleEdgeMouseLeave: EdgeMouseHandler = useCallback(() => {
    setEdgeTooltip(null);
  }, []);
  
  // Close detail panel
  const handleClosePanel = useCallback(() => {
    setSelectedAgent(null);
    
    // Reset all nodes to full opacity
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: 1,
        },
      }))
    );
  }, [setNodes]);
  
  // Timeline controls
  const handleSeek = useCallback((index: number) => {
    setCurrentEventIndex(index);
    // TODO: Replay event at this index
  }, []);
  
  const handlePlayPause = useCallback(() => {
    setIsReplaying(!isReplaying);
  }, [isReplaying]);
  
  const handleReset = useCallback(() => {
    setCurrentEventIndex(0);
    setIsReplaying(false);
  }, []);

  const handleAction = useCallback(
    async (action: 'pause' | 'resume' | 'cancel') => {
      if (!runId) return;

      const token = window.localStorage.getItem('crew7_access_token');
      if (!token) return;

      try {
        const res = await fetch(`/api/graph/runs/${runId}/${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setToast(`${action.toUpperCase()}: ${data.status}`);
          setTimeout(() => setToast(null), 3000);
        }
      } catch (err) {
        console.error(`Graph action ${action} failed:`, err);
      }
    },
    [runId]
  );

  if (!visible) return null;
  
  // Get data for selected agent
  const selectedNode = nodes.find(n => n.id === selectedAgent);
  const selectedAgentData = selectedNode?.data as AgentNodeData | undefined;

  return (
    <>
      <div ref={reactFlowWrapper} className="relative h-full w-full rounded-2xl border border-white/10 bg-[#0a0f16] overflow-hidden flex flex-col">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onEdgeMouseEnter={handleEdgeMouseEnter}
            onEdgeMouseLeave={handleEdgeMouseLeave}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#1e293b" gap={16} />
            <Controls className="!border-white/10 !bg-[#151E28]" />
            <MiniMap
              nodeColor="#E5484D"
              maskColor="rgba(0, 0, 0, 0.6)"
              className="!border-white/10 !bg-[#151E28]"
            />
          </ReactFlow>

          {runId && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleAction('pause')}
                className="rounded-lg border border-white/10 bg-[#151E28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e2a38] transition"
              >
                Pause
              </button>
              <button
                type="button"
                onClick={() => handleAction('resume')}
                className="rounded-lg border border-white/10 bg-[#151E28] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e2a38] transition"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => handleAction('cancel')}
                className="rounded-lg border border-[#E5484D]/30 bg-[#2f1c1c] px-4 py-2 text-sm font-semibold text-[#ff6b6b] hover:bg-[#3f2424] transition"
              >
                Cancel
              </button>
            </div>
          )}

          {toast && (
            <div className="absolute top-4 right-4 rounded-lg border border-white/10 bg-[#151E28] px-4 py-2 text-sm text-white shadow-lg">
              {toast}
            </div>
          )}
          
          {/* Edge Tooltip */}
          {edgeTooltip && (
            <div
              className="fixed rounded-lg border border-white/10 bg-[#0d141c] px-3 py-2 text-xs text-white shadow-xl z-50 pointer-events-none"
              style={{ left: edgeTooltip.x + 10, top: edgeTooltip.y + 10 }}
            >
              {edgeTooltip.message}
            </div>
          )}
        </div>
        
        {/* Timeline Scrubber */}
        {timelineEvents.length > 0 && (
          <TimelineScrubber
            events={timelineEvents}
            currentEventIndex={currentEventIndex}
            onSeek={handleSeek}
            isPlaying={isReplaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
          />
        )}
      </div>
      
      {/* Agent Detail Panel */}
      {selectedAgent && selectedAgentData && (
        <AgentDetailPanel
          agentId={selectedAgentData.agentId}
          label={selectedAgentData.label}
          status={selectedAgentData.status}
          messages={agentMessages[selectedAgent] || []}
          toolCalls={agentToolCalls[selectedAgent] || []}
          onClose={handleClosePanel}
        />
      )}
    </>
  );
};
