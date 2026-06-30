'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Workflow, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Brain, 
  Cpu, 
  Coins, 
  TrendingUp, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  Info, 
  Layers,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Database,
  Code
} from 'lucide-react';
import { globalEventBus } from '@/core/events/globalEventBus';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';

// Node States and Interface
export type NodeStatus = 'idle' | 'running' | 'waiting' | 'success' | 'failed' | 'cancelled';

export interface WorkflowNodeState {
  id: string;
  name: string;
  type: 'PLANNER' | 'EXECUTOR' | 'REVIEWER' | 'TOOL' | 'MEMORY';
  agentId: string;
  capability: string;
  status: NodeStatus;
  input: any;
  output: any;
  memoryContext?: string;
  toolCalls?: Array<{ id: string; name: string; status: string }>;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  retryCount: number;
  latency: number; // ms
  startTime?: number;
  endTime?: number;
}

export interface TimelineItem {
  id: string;
  timestamp: number;
  nodeId: string;
  nodeName: string;
  agentId: string;
  status: string;
  duration: number;
}

export function WorkflowVisualizer() {
  const { isMobile } = useLayout();
  
  // Real-time state managers
  const [nodes, setNodes] = useState<WorkflowNodeState[]>(() => {
    const now = Date.now();
    return [
      {
        id: 'planner-1',
        name: 'Vaelox Core Planner',
        type: 'PLANNER',
        agentId: 'core-planner',
        capability: 'PLANNING',
        status: 'success',
        input: { query: 'Build a premium responsive workflow layout' },
        output: {
          steps: [
            { id: 1, action: 'Initialize SVG Graph Canvas', agent: 'core-planner' },
            { id: 2, action: 'Subscribe to EventBus listeners', agent: 'core-executor' },
            { id: 3, action: 'Integrate mobile gesture sheet', agent: 'core-reviewer' }
          ]
        },
        memoryContext: 'Project context initialized from workspace files.',
        promptTokens: 250,
        completionTokens: 120,
        totalTokens: 370,
        cost: 0.00074,
        retryCount: 0,
        latency: 420,
        startTime: now - 120000,
        endTime: now - 119580
      },
      {
        id: 'executor-1',
        name: 'Vaelox Main Executor',
        type: 'EXECUTOR',
        agentId: 'core-executor',
        capability: 'EXECUTION',
        status: 'running',
        input: { task: 'Executing step 2: Setup EventBus listeners' },
        output: null,
        memoryContext: 'Listening to globalEventBus for starting signals.',
        toolCalls: [
          { id: 'tool-search-1', name: 'WorkspaceSearchTool', status: 'success' }
        ],
        promptTokens: 480,
        completionTokens: 0,
        totalTokens: 480,
        cost: 0.00096,
        retryCount: 0,
        latency: 0,
        startTime: now - 10000
      },
      {
        id: 'reviewer-1',
        name: 'Vaelox Quality Reviewer',
        type: 'REVIEWER',
        agentId: 'core-reviewer',
        capability: 'REVIEW',
        status: 'idle',
        input: null,
        output: null,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
        retryCount: 0,
        latency: 0
      }
    ];
  });

  const [edges] = useState<Array<{ from: string; to: string }>>([
    { from: 'planner-1', to: 'executor-1' },
    { from: 'executor-1', to: 'reviewer-1' }
  ]);

  const [timeline, setTimeline] = useState<TimelineItem[]>(() => {
    const now = Date.now();
    return [
      {
        id: 'tl-1',
        timestamp: now - 120000,
        nodeId: 'planner-1',
        nodeName: 'Vaelox Core Planner',
        agentId: 'core-planner',
        status: 'started',
        duration: 0
      },
      {
        id: 'tl-2',
        timestamp: now - 119580,
        nodeId: 'planner-1',
        nodeName: 'Vaelox Core Planner',
        agentId: 'core-planner',
        status: 'completed',
        duration: 420
      },
      {
        id: 'tl-3',
        timestamp: now - 10000,
        nodeId: 'executor-1',
        nodeName: 'Vaelox Main Executor',
        agentId: 'core-executor',
        status: 'started',
        duration: 0
      }
    ];
  });

  // Controls & Filters
  const [selectedNodeId, setSelectedNodeId] = useState<string>('executor-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'success' | 'failed' | 'idle'>('all');
  
  // Mobile sheet heights
  const [mobileHeightState, setMobileHeightState] = useState<'half' | 'expanded'>('half');

  // Selected Node State Derived
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Handle click timeline -> scrolls to node
  const handleTimelineClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    const element = document.getElementById(`node-card-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Subscribe to real-time events via EventBus
  useEffect(() => {
    const handleWorkflowStarted = (event: any) => {
      const payload = event.payload;
      setNodes(prev => prev.map(n => ({ ...n, status: 'idle', promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, latency: 0, startTime: undefined, endTime: undefined })));
      setTimeline([]);
    };

    const handleAgentStarted = (event: any) => {
      const payload = event.payload;
      const nodeId = payload.nodeId;
      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            status: 'running',
            startTime: payload.startTime || Date.now(),
            latency: 0
          };
        }
        return n;
      }));

      setTimeline(prev => [
        ...prev,
        {
          id: `tl-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          nodeId,
          nodeName: nodes.find(n => n.id === nodeId)?.name || nodeId,
          agentId: payload.agentId,
          status: 'started',
          duration: 0
        }
      ]);
    };

    const handleAgentCompleted = (event: any) => {
      const payload = event.payload;
      const nodeId = payload.nodeId;
      const result = payload.result;
      
      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          const startTime = n.startTime || Date.now() - 500;
          const latency = Date.now() - startTime;
          return {
            ...n,
            status: 'success',
            endTime: Date.now(),
            latency,
            promptTokens: payload.tokenUsage?.input || 0,
            completionTokens: payload.tokenUsage?.output || 0,
            totalTokens: payload.tokenUsage?.total || 0,
            cost: payload.cost || 0,
            output: result?.output || { success: true }
          };
        }
        return n;
      }));

      setTimeline(prev => [
        ...prev,
        {
          id: `tl-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          nodeId,
          nodeName: nodes.find(n => n.id === nodeId)?.name || nodeId,
          agentId: payload.agentId,
          status: 'completed',
          duration: Date.now() - (nodes.find(n => n.id === nodeId)?.startTime || Date.now())
        }
      ]);
    };

    const handleToolStarted = (event: any) => {
      const payload = event.payload;
      // Hook up tool call to running executor node dynamically
      setNodes(prev => prev.map(n => {
        if (n.status === 'running') {
          const currentTools = n.toolCalls || [];
          if (!currentTools.some(t => t.id === payload.id)) {
            return {
              ...n,
              toolCalls: [...currentTools, { id: payload.id, name: payload.name || 'ExternalTool', status: 'running' }]
            };
          }
        }
        return n;
      }));
    };

    const handleToolCompleted = (event: any) => {
      const payload = event.payload;
      setNodes(prev => prev.map(n => {
        if (n.toolCalls?.some(t => t.id === payload.id)) {
          return {
            ...n,
            toolCalls: n.toolCalls.map(t => t.id === payload.id ? { ...t, status: 'success' } : t)
          };
        }
        return n;
      }));
    };

    const handleToolFailed = (event: any) => {
      const payload = event.payload;
      setNodes(prev => prev.map(n => {
        if (n.toolCalls?.some(t => t.id === payload.id)) {
          return {
            ...n,
            toolCalls: n.toolCalls.map(t => t.id === payload.id ? { ...t, status: 'failed' } : t)
          };
        }
        return n;
      }));
    };

    globalEventBus.subscribe('workflow.started', handleWorkflowStarted);
    globalEventBus.subscribe('agent.started', handleAgentStarted);
    globalEventBus.subscribe('agent.completed', handleAgentCompleted);
    globalEventBus.subscribe('tool.started', handleToolStarted);
    globalEventBus.subscribe('tool.completed', handleToolCompleted);
    globalEventBus.subscribe('tool.failed', handleToolFailed);

    return () => {
      globalEventBus.unsubscribe('workflow.started', handleWorkflowStarted);
      globalEventBus.unsubscribe('agent.started', handleAgentStarted);
      globalEventBus.unsubscribe('agent.completed', handleAgentCompleted);
      globalEventBus.unsubscribe('tool.started', handleToolStarted);
      globalEventBus.unsubscribe('tool.completed', handleToolCompleted);
      globalEventBus.unsubscribe('tool.failed', handleToolFailed);
    };
  }, [nodes]);

  // Stats Card Calculations
  const stats = useMemo(() => {
    const total = nodes.length;
    const running = nodes.filter(n => n.status === 'running').length;
    const success = nodes.filter(n => n.status === 'success').length;
    const failed = nodes.filter(n => n.status === 'failed').length;
    const pending = nodes.filter(n => n.status === 'idle').length;

    let totalDuration = 0;
    let totalTokens = 0;
    let totalCost = 0;

    nodes.forEach(n => {
      if (n.latency) totalDuration += n.latency;
      totalTokens += n.totalTokens || 0;
      totalCost += n.cost || 0;
    });

    return { total, running, success, failed, pending, totalDuration, totalTokens, totalCost };
  }, [nodes]);

  // Filtered nodes based on search and status
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.capability.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [nodes, searchQuery, statusFilter]);

  // Mobile Bottom Sheet Height styles
  const mobileSheetHeightClass = useMemo(() => {
    if (mobileHeightState === 'expanded') return 'h-[90vh]';
    return 'h-[450px]';
  }, [mobileHeightState]);

  // Standard vertical stepper nodes
  const renderVerticalStepper = () => (
    <div className="flex flex-col space-y-4 pt-2">
      {nodes.map((node, index) => {
        const isSelected = selectedNodeId === node.id;
        return (
          <div key={node.id} className="flex flex-col">
            <div 
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                isSelected 
                  ? "bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                  : "bg-vaelox-surface/30 border-vaelox-border hover:bg-vaelox-surface/50"
              )}
              onClick={() => setSelectedNodeId(node.id)}
            >
              {/* Vertical Stepper Indicators */}
              <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                  node.status === 'success' ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" :
                  node.status === 'running' ? "bg-brand-500/10 border-brand-500 text-brand-400 animate-pulse" :
                  node.status === 'failed' ? "bg-red-500/10 border-red-500 text-red-400" :
                  "bg-vaelox-surface border-vaelox-border text-vaelox-muted"
                )}>
                  {node.status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                   node.status === 'running' ? <Cpu className="w-3 h-3 animate-spin" /> : 
                   index + 1}
                </div>
                {index < nodes.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-10 mt-1 transition-colors",
                    node.status === 'success' ? "bg-emerald-500/50" : "bg-vaelox-border"
                  )} />
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <h4 className="text-xs font-semibold text-vaelox-text truncate">{node.name}</h4>
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0",
                    node.status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                    node.status === 'running' ? "bg-brand-500/15 text-brand-400" :
                    node.status === 'failed' ? "bg-red-500/10 text-red-400" :
                    "bg-vaelox-surface text-vaelox-muted"
                  )}>
                    {node.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-vaelox-muted">
                  <span>{node.capability}</span>
                  <span>•</span>
                  <span>{node.latency ? `${node.latency}ms` : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* Expanded details block inline for selected element on mobile */}
            {isMobile && isSelected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-1 mt-2.5 p-4 bg-vaelox-surface/60 rounded-xl border border-brand-500/20 text-xs text-vaelox-text space-y-4"
              >
                {/* Inline Node Metadata */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Agent ID</span>
                    <span className="font-medium text-vaelox-text">{node.agentId}</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Total Cost</span>
                    <span className="font-semibold text-brand-400">${node.cost?.toFixed(6) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Prompt Tokens</span>
                    <span className="font-medium text-vaelox-text">{node.promptTokens || '0'}</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Completion Tokens</span>
                    <span className="font-medium text-vaelox-text">{node.completionTokens || '0'}</span>
                  </div>
                </div>

                {/* Inline Tool calls if present */}
                {node.toolCalls && node.toolCalls.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Tools Dispatched</span>
                    <div className="flex flex-wrap gap-2">
                      {node.toolCalls.map(tool => (
                        <span key={tool.id} className="px-2 py-1 bg-vaelox-surface border border-vaelox-border rounded-lg flex items-center gap-1.5 font-mono text-[10px]">
                          <Database className="w-3 h-3 text-brand-400" />
                          <span>{tool.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Input Box */}
                {node.input && (
                  <div className="space-y-1">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Input Frame</span>
                    <pre className="p-2.5 bg-[#08080c] text-[10px] font-mono rounded-lg overflow-x-auto text-vaelox-text border border-vaelox-border/30">
                      {JSON.stringify(node.input, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Inline Output Box */}
                {node.output && (
                  <div className="space-y-1">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Output Result</span>
                    <pre className="p-2.5 bg-[#08080c] text-[10px] font-mono rounded-lg overflow-x-auto text-emerald-400 border border-vaelox-border/30">
                      {JSON.stringify(node.output, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-vaelox-bg text-vaelox-text select-none overflow-hidden relative">
      
      {/* Top Banner & Stats Overview */}
      <div className="flex-none p-4 md:p-6 border-b border-vaelox-border bg-vaelox-panel relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-brand-500/10 rounded-lg text-brand-400">
                <Workflow className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-sm md:text-base font-bold text-vaelox-text tracking-tight flex items-center gap-1.5">
                  Vaelox Agent Workflow Visualizer
                  <span className="text-[10px] bg-brand-500/10 text-brand-400 font-mono px-1.5 py-0.5 rounded">Live</span>
                </h2>
                <p className="text-[11px] text-vaelox-muted">Inspect the pipeline layout, orchestrations, and real-time step streams.</p>
              </div>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 bg-vaelox-surface/50 p-1 rounded-xl border border-vaelox-border">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors", statusFilter === 'all' ? "bg-vaelox-panel text-brand-400 shadow-sm" : "text-vaelox-muted hover:text-vaelox-text")}
            >
              All Nodes
            </button>
            <button 
              onClick={() => setStatusFilter('running')}
              className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors", statusFilter === 'running' ? "bg-vaelox-panel text-brand-400 shadow-sm" : "text-vaelox-muted hover:text-vaelox-text")}
            >
              Running
            </button>
            <button 
              onClick={() => setStatusFilter('success')}
              className={cn("px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors", statusFilter === 'success' ? "bg-vaelox-panel text-brand-400 shadow-sm" : "text-vaelox-muted hover:text-vaelox-text")}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Stats Bento Grid Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 mt-5">
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-brand-400" />
              <span>Orchestrated</span>
            </div>
            <div className="text-base font-bold text-vaelox-text mt-1">{stats.total} Nodes</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              <span>Running</span>
            </div>
            <div className="text-base font-bold text-brand-400 mt-1">{stats.running} Nodes</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Success</span>
            </div>
            <div className="text-base font-bold text-emerald-400 mt-1">{stats.success} Nodes</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-red-400" />
              <span>Failed</span>
            </div>
            <div className="text-base font-bold text-red-400 mt-1">{stats.failed} Nodes</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-vaelox-muted" />
              <span>Total Latency</span>
            </div>
            <div className="text-base font-bold text-vaelox-text mt-1">{stats.totalDuration || '0'} ms</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>Tokens Used</span>
            </div>
            <div className="text-base font-bold text-vaelox-text mt-1">{stats.totalTokens}</div>
          </div>
          <div className="bg-vaelox-surface/40 p-3 rounded-xl border border-vaelox-border">
            <div className="text-[10px] text-vaelox-muted uppercase font-semibold font-mono tracking-wider flex items-center gap-1.5">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>Token Cost</span>
            </div>
            <div className="text-base font-bold text-amber-400 mt-1">${stats.totalCost.toFixed(6)}</div>
          </div>
        </div>
      </div>

      {/* Main Responsive Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {isMobile ? (
          /* MOBILE SINGLE SCREEN VIEW WITH BOTTOM SHEET */
          <div className="flex-1 flex flex-col p-4 overflow-y-auto pb-48">
            <h3 className="text-xs font-bold text-vaelox-muted uppercase tracking-wider block mb-2 font-mono">Workflow Progress Stepper</h3>
            {renderVerticalStepper()}

            {/* Simulated Snapping Bottom Sheet for mobile details overlay */}
            <div className={cn(
              "fixed bottom-14 left-0 right-0 bg-vaelox-panel/95 backdrop-blur-xl border-t border-vaelox-border rounded-t-2xl shadow-2xl transition-all duration-300 z-50 flex flex-col overflow-hidden",
              mobileSheetHeightClass
            )}>
              {/* Drag handles & buttons */}
              <div 
                className="p-3.5 flex items-center justify-between border-b border-vaelox-border cursor-pointer select-none shrink-0"
                onClick={() => setMobileHeightState(prev => prev === 'half' ? 'expanded' : 'half')}
              >
                <div className="flex flex-col items-center flex-1">
                  <div className="w-12 h-1.5 bg-vaelox-border rounded-full mb-1.5" />
                  <span className="text-[11px] font-bold text-vaelox-text">Workspace Timeline Monitor</span>
                </div>
                <button className="text-vaelox-muted p-1">
                  {mobileHeightState === 'half' ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Sheet content - Timeline & Node logs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-vaelox-muted uppercase tracking-wider block font-mono">Live Timeline Streams</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar font-mono text-[11px]">
                    {timeline.map((item, idx) => (
                      <div key={item.id} className="flex gap-2.5 border-l border-vaelox-border/60 pl-3.5 py-1">
                        <span className="text-vaelox-muted shrink-0 text-[10px]">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                        <div className="flex-1">
                          <span className="font-semibold text-vaelox-text">{item.nodeName}</span>
                          <span className={cn(
                            "ml-1.5 text-[10px] px-1 py-0.2 rounded font-bold uppercase",
                            item.status === 'started' ? "bg-brand-500/10 text-brand-400" : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* DESKTOP SPLIT VIEW: CANVAS GRAPH + NODE PROPERTIES PANEL */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Side: Graph Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#08080c] relative">
              
              {/* Zoom & Minimap Container */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 bg-vaelox-panel/80 backdrop-blur border border-vaelox-border rounded-xl p-3 shadow-xl">
                <span className="text-[10px] font-bold text-vaelox-muted font-mono uppercase tracking-wider block">Graph Viewport</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono font-medium">Zoom: 100%</span>
                  <div className="h-4 w-[1px] bg-vaelox-border" />
                  <span className="text-[11px] font-mono font-medium">Pan: Centered</span>
                </div>
              </div>

              {/* Dynamic SVG Minimap overview */}
              <div className="absolute bottom-4 left-4 z-20 bg-vaelox-panel/90 backdrop-blur border border-vaelox-border rounded-xl p-3.5 shadow-xl w-44">
                <span className="text-[10px] font-bold text-vaelox-muted font-mono uppercase tracking-wider block mb-1.5">Workflow MiniMap</span>
                <div className="w-full h-20 bg-[#0c0c12] rounded-lg border border-vaelox-border/30 relative flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="flex items-center gap-1 px-1.5 py-1 bg-brand-500/5 border border-brand-500/20 rounded scale-75">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                    <div className="w-1.5 h-1.5 rounded-full bg-vaelox-muted" />
                  </div>
                </div>
              </div>

              {/* Canvas Render with connecting edges */}
              <div className="flex-1 relative overflow-auto p-8 flex items-center justify-center select-none" id="graph-canvas">
                {/* SVG Connecting Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '800px', minHeight: '600px' }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#374151" />
                    </marker>
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#8b5cf6" />
                    </marker>
                  </defs>

                  {/* Edges */}
                  {edges.map((edge, index) => {
                    const fromNode = nodes.find(n => n.id === edge.from);
                    const toNode = nodes.find(n => n.id === edge.to);
                    if (!fromNode || !toNode) return null;

                    // Choose edge highlight based on node status
                    const isActive = fromNode.status === 'running' || toNode.status === 'running';
                    const isSuccess = fromNode.status === 'success' && toNode.status === 'success';

                    // Simplified desktop hardcoded coordinate offsets to draw straight connections beautifully
                    const startX = index === 0 ? 180 : 440;
                    const startY = 300;
                    const endX = index === 0 ? 360 : 620;
                    const endY = 300;

                    return (
                      <g key={`${edge.from}-${edge.to}`}>
                        <path 
                          d={`M ${startX} ${startY} L ${endX} ${endY}`}
                          fill="none"
                          stroke={isActive ? "#8b5cf6" : isSuccess ? "#10b981" : "#374151"}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          strokeDasharray={isActive ? "4,4" : undefined}
                          className={cn(isActive && "animate-[dash_10s_linear_infinite]")}
                          markerEnd={`url(#${isActive ? 'arrow-active' : 'arrow'})`}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes layout horizontally */}
                <div className="flex items-center justify-around gap-16 relative z-10 w-full max-w-4xl">
                  {nodes.map((node, index) => {
                    const isSelected = selectedNodeId === node.id;
                    return (
                      <motion.div
                        id={`node-card-${node.id}`}
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "w-56 p-4 rounded-xl border cursor-pointer transition-all flex flex-col space-y-3",
                          isSelected 
                            ? "bg-vaelox-panel border-brand-500 shadow-[0_0_25px_rgba(139,92,246,0.2)]" 
                            : "bg-vaelox-panel border-vaelox-border hover:border-vaelox-border/80 shadow-md",
                          node.status === 'running' && "ring-2 ring-brand-500/50 animate-pulse",
                          node.status === 'failed' && "border-red-500 bg-red-500/5"
                        )}
                      >
                        {/* Header node card */}
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="p-1 rounded-lg bg-vaelox-surface text-vaelox-muted">
                            {node.type === 'PLANNER' ? <Sparkles className="w-4 h-4 text-brand-400" /> :
                             node.type === 'EXECUTOR' ? <Cpu className="w-4 h-4 text-brand-400" /> :
                             node.type === 'REVIEWER' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                             <Database className="w-4 h-4 text-amber-400" />}
                          </span>
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full",
                            node.status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                            node.status === 'running' ? "bg-brand-500/10 text-brand-400" :
                            node.status === 'failed' ? "bg-red-500/10 text-red-400" :
                            "bg-vaelox-surface text-vaelox-muted"
                          )}>
                            {node.status}
                          </span>
                        </div>

                        {/* Title & metadata */}
                        <div>
                          <h4 className="text-xs font-bold text-vaelox-text leading-tight truncate">{node.name}</h4>
                          <span className="text-[10px] font-mono text-vaelox-muted block mt-0.5">{node.agentId}</span>
                        </div>

                        <div className="pt-2 border-t border-vaelox-border/50 flex items-center justify-between font-mono text-[10px] text-vaelox-muted">
                          <span>{node.capability}</span>
                          <span>{node.latency ? `${node.latency}ms` : 'Waiting'}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom section of Left Graph: Horizontal Chronological Timeline */}
              <div className="h-44 border-t border-vaelox-border bg-vaelox-panel flex flex-col overflow-hidden select-none shrink-0">
                <div className="px-4 py-2 bg-vaelox-surface/30 border-b border-vaelox-border shrink-0 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-vaelox-muted font-mono uppercase tracking-wider block">Real-time Execution Timeline Logs</span>
                  <span className="text-[9px] bg-brand-500/10 text-brand-400 font-mono px-1.5 py-0.5 rounded">Ordered by time</span>
                </div>
                <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center no-scrollbar bg-vaelox-bg/20">
                  {timeline.length === 0 ? (
                    <div className="text-xs text-vaelox-muted italic flex-1 text-center">No timeline records captured yet. Start a run in AI Chat.</div>
                  ) : (
                    timeline.map((item, index) => (
                      <div 
                        key={item.id}
                        onClick={() => handleTimelineClick(item.nodeId)}
                        className="p-3 bg-vaelox-panel border border-vaelox-border hover:border-brand-500 rounded-xl shrink-0 cursor-pointer min-w-[200px] flex flex-col gap-1 transition-all"
                      >
                        <div className="flex items-center justify-between text-[10px] text-vaelox-muted font-mono">
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                          <span className={cn(
                            "font-bold uppercase text-[9px]",
                            item.status === 'started' ? "text-brand-400" : "text-emerald-400"
                          )}>
                            {item.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-vaelox-text truncate">{item.nodeName}</h5>
                        <div className="flex items-center justify-between text-[10px] font-mono text-vaelox-muted mt-1">
                          <span>{item.agentId}</span>
                          {item.duration > 0 && <span className="text-emerald-400 font-semibold">{item.duration}ms</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Side: Properties & Detail Drawer on Desktop */}
            <div className="w-80 border-l border-vaelox-border bg-vaelox-panel flex flex-col shrink-0 overflow-hidden relative">
              <div className="p-4 border-b border-vaelox-border shrink-0 flex items-center justify-between bg-vaelox-surface/20">
                <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider block font-mono">Node Detail Attributes</span>
                <span className="text-[10px] font-mono font-semibold bg-brand-500/15 text-brand-400 px-1.5 py-0.5 rounded">{selectedNode.type}</span>
              </div>

              {/* Detail Items scrolling block */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Agent Name</span>
                  <div className="text-xs font-bold text-vaelox-text">{selectedNode.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Status</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono inline-block",
                      selectedNode.status === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                      selectedNode.status === 'running' ? "bg-brand-500/15 text-brand-400 animate-pulse" :
                      selectedNode.status === 'failed' ? "bg-red-500/10 text-red-400" :
                      "bg-vaelox-surface text-vaelox-muted"
                    )}>
                      {selectedNode.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Capability</span>
                    <div className="text-xs font-semibold text-vaelox-text font-mono">{selectedNode.capability}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-vaelox-border/50">
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Total Token Cost</span>
                    <span className="text-xs font-bold text-brand-400 font-mono">${selectedNode.cost?.toFixed(6) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Total Tokens</span>
                    <span className="text-xs font-semibold text-vaelox-text font-mono">{selectedNode.totalTokens || '0'}</span>
                  </div>
                </div>

                {/* Input frame details */}
                {selectedNode.input && (
                  <div className="space-y-1 pt-3 border-t border-vaelox-border/50">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Arguments / Input Context</span>
                    <pre className="p-3 bg-vaelox-surface border border-vaelox-border rounded-lg text-[10px] font-mono text-vaelox-text overflow-x-auto no-scrollbar">
                      {JSON.stringify(selectedNode.input, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Output frame details */}
                {selectedNode.output && (
                  <div className="space-y-1 pt-3 border-t border-vaelox-border/50">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block text-emerald-400">Response / Output Output</span>
                    <pre className="p-3 bg-vaelox-surface border border-emerald-500/20 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto no-scrollbar">
                      {JSON.stringify(selectedNode.output, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Working Memory Snapshot block */}
                {selectedNode.memoryContext && (
                  <div className="space-y-1 pt-3 border-t border-vaelox-border/50">
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Agent Working Memory</span>
                    <p className="text-xs text-vaelox-muted font-mono leading-relaxed bg-vaelox-surface/50 border border-vaelox-border/60 p-2.5 rounded-lg">{selectedNode.memoryContext}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
