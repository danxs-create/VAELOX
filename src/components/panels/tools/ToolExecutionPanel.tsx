'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { globalEventBus } from '@/core/events/globalEventBus';
import { 
  Play, 
  Pause, 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Layers, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Code, 
  Database, 
  Eye, 
  FileCode, 
  Flame, 
  Cpu, 
  Workflow, 
  Trash2, 
  Sparkles,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Type definitions for Executed Tool
export interface ExecutedTool {
  id: string;
  name: string;
  description: string;
  status: 'queued' | 'preparing' | 'running' | 'waiting' | 'success' | 'warning' | 'failed' | 'cancelled';
  progress: number; // 0 to 100
  startTime: number;
  duration: number; // ms
  tokenUsage?: { input: number; output: number; total: number };
  cost?: number;
  input: any;
  output: any;
  outputType: 'text' | 'markdown' | 'json' | 'table' | 'code' | 'image';
  errorMessage?: string;
  logs: Array<{ timestamp: number; message: string; type: 'info' | 'warn' | 'error' }>;
  retryCount: number;
  metadata?: Record<string, any>;
}

// React.memo to prevent unnecessary individual card re-renders
const ToolCard = React.memo(({ 
  tool, 
  isExpanded, 
  onToggleExpand 
}: { 
  tool: ExecutedTool; 
  isExpanded: boolean; 
  onToggleExpand: (id: string) => void;
}) => {
  // Get Status Colors and Icons
  const statusConfig = useMemo(() => {
    switch (tool.status) {
      case 'queued':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-500', label: 'Queued', icon: Clock };
      case 'preparing':
        return { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', label: 'Preparing', icon: Cpu };
      case 'running':
        return { bg: 'bg-brand-500/10 border-brand-500/30 animate-pulse', border: 'border-brand-500/30', text: 'text-brand-400', label: 'Running', icon: Workflow };
      case 'waiting':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', label: 'Waiting', icon: Layers };
      case 'success':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'Success', icon: CheckCircle2 };
      case 'warning':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Warning', icon: AlertTriangle };
      case 'failed':
        return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Failed', icon: XCircle };
      case 'cancelled':
        return { bg: 'bg-vaelox-surface/50', border: 'border-vaelox-border', text: 'text-vaelox-muted', label: 'Cancelled', icon: X };
      default:
        return { bg: 'bg-vaelox-surface', border: 'border-vaelox-border', text: 'text-vaelox-text', label: 'Unknown', icon: Info };
    }
  }, [tool.status]);

  const StatusIcon = statusConfig.icon;

  // Choose appropriate Tool Icons
  const ToolIcon = useMemo(() => {
    const nameLower = tool.name.toLowerCase();
    if (nameLower.includes('search')) return Search;
    if (nameLower.includes('file') || nameLower.includes('view') || nameLower.includes('read')) return FileCode;
    if (nameLower.includes('db') || nameLower.includes('sql') || nameLower.includes('query')) return Database;
    if (nameLower.includes('lint') || nameLower.includes('format')) return Code;
    return Cpu;
  }, [tool.name]);

  // Format Duration nicely
  const formattedDuration = useMemo(() => {
    if (tool.duration < 1000) return `${tool.duration}ms`;
    return `${(tool.duration / 1000).toFixed(2)}s`;
  }, [tool.duration]);

  // Render different Output formats
  const renderOutput = () => {
    if (!tool.output) return <span className="text-vaelox-muted italic">No output produced</span>;

    switch (tool.outputType) {
      case 'json':
        return (
          <pre className="p-3 bg-vaelox-surface/80 rounded-lg text-xs font-mono text-brand-300 overflow-x-auto border border-vaelox-border max-h-60">
            {JSON.stringify(tool.output, null, 2)}
          </pre>
        );
      case 'table':
        if (Array.isArray(tool.output)) {
          const keys = Object.keys(tool.output[0] || {});
          return (
            <div className="overflow-x-auto border border-vaelox-border rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-vaelox-surface/60 border-b border-vaelox-border font-mono text-vaelox-muted">
                    {keys.map(k => <th key={k} className="p-2 font-semibold capitalize">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {tool.output.map((row, i) => (
                    <tr key={i} className="border-b border-vaelox-border/30 hover:bg-vaelox-surface/20">
                      {keys.map(k => <td key={k} className="p-2 font-mono">{typeof row[k] === 'object' ? JSON.stringify(row[k]) : String(row[k])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <pre className="p-3 bg-vaelox-surface/80 rounded-lg text-xs font-mono">{String(tool.output)}</pre>;
      case 'code':
        return (
          <pre className="p-3 bg-vaelox-surface/80 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-vaelox-border">
            <code>{String(tool.output)}</code>
          </pre>
        );
      default:
        return (
          <div className="p-3 bg-vaelox-surface/80 rounded-lg text-xs leading-relaxed text-vaelox-text border border-vaelox-border font-sans whitespace-pre-wrap">
            {String(tool.output)}
          </div>
        );
    }
  };

  return (
    <div 
      className={cn(
        "rounded-xl border transition-all duration-200 overflow-hidden shadow-lg bg-vaelox-panel/40 backdrop-blur-md",
        isExpanded ? "border-brand-500/40 ring-1 ring-brand-500/10" : "border-vaelox-border/60 hover:border-vaelox-border"
      )}
      id={`tool-card-${tool.id}`}
    >
      {/* Header - Always visible */}
      <div 
        onClick={() => onToggleExpand(tool.id)}
        className="p-3.5 flex items-center justify-between cursor-pointer select-none gap-4 hover:bg-vaelox-surface/20"
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(tool.id); } }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500 shrink-0">
            <ToolIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-vaelox-text truncate flex items-center gap-2">
              {tool.name}
              {tool.retryCount > 0 && (
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono px-1.5 py-0.5 rounded-full">
                  Retry #{tool.retryCount}
                </span>
              )}
            </h4>
            <p className="text-xs text-vaelox-muted truncate max-w-[400px] mt-0.5">{tool.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            statusConfig.bg,
            statusConfig.border,
            statusConfig.text
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </div>

          {/* Metrics */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-vaelox-muted border-l border-vaelox-border/60 pl-4">
            <div className="flex items-center gap-1" title="Duration">
              <Clock className="w-3.5 h-3.5 text-vaelox-muted" />
              <span>{formattedDuration}</span>
            </div>
            {tool.tokenUsage && (
              <div className="flex items-center gap-1" title="Tokens">
                <Cpu className="w-3.5 h-3.5 text-vaelox-muted" />
                <span>{tool.tokenUsage.total}t</span>
              </div>
            )}
            {tool.cost !== undefined && (
              <div className="text-emerald-500" title="Cost Estimate">
                ${tool.cost.toFixed(4)}
              </div>
            )}
          </div>

          <div className="p-1 hover:bg-vaelox-surface rounded text-vaelox-muted">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Progress Bar for running/preparing states */}
      {(tool.status === 'running' || tool.status === 'preparing') && (
        <div className="w-full h-0.5 bg-vaelox-border">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-300" 
            style={{ width: `${tool.progress}%` }}
          />
        </div>
      )}

      {/* Expanded Details Section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-vaelox-border/40 overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-vaelox-surface/10">
              {/* Grid of Inputs & Arguments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Arguments / Inputs */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-vaelox-muted font-mono uppercase tracking-wider block">Arguments</span>
                  <pre className="p-3 bg-vaelox-surface/80 rounded-lg text-xs font-mono text-vaelox-text overflow-x-auto border border-vaelox-border">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>

                {/* Execution Metadata / Log list */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-vaelox-muted font-mono uppercase tracking-wider block">Timeline Logs</span>
                  <div className="p-3 bg-vaelox-surface/80 rounded-lg border border-vaelox-border font-mono text-[11px] max-h-40 overflow-y-auto space-y-1.5 no-scrollbar">
                    {tool.logs.length === 0 ? (
                      <span className="text-vaelox-muted italic">No logs recorded</span>
                    ) : (
                      tool.logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 text-vaelox-text leading-tight">
                          <span className="text-[10px] text-vaelox-muted shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                          </span>
                          <span className={cn(
                            log.type === 'error' ? "text-red-400" : log.type === 'warn' ? "text-amber-400" : "text-vaelox-muted"
                          )}>
                            [{log.type.toUpperCase()}]
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Outputs block */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-vaelox-muted font-mono uppercase tracking-wider block">Execution Output</span>
                {renderOutput()}
              </div>

              {/* Extra Metadata / Error block if failed */}
              {tool.errorMessage && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-mono flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold">Error Message:</div>
                    <div className="mt-1 whitespace-pre-wrap leading-relaxed">{tool.errorMessage}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ToolCard.displayName = 'ToolCard';

export function ToolExecutionPanel() {
  const [tools, setTools] = useState<ExecutedTool[]>(() => {
    // Generate timestamps relative to the current actual time
    const now = typeof Date !== 'undefined' ? Date.now() : 0;
    return [
      {
        id: 'tool-search-1',
        name: 'WorkspaceSearchTool',
        description: 'Searching workspace directories for matching string patterns and references.',
        status: 'success',
        progress: 100,
        startTime: now - 3600000,
        duration: 382,
        tokenUsage: { input: 350, output: 120, total: 470 },
        cost: 0.0003,
        input: { query: 'WorkspaceManagerImpl', folder: './src' },
        output: [
          { file: './src/contexts/WorkspaceContext.tsx', matches: 3 },
          { file: './src/core/registries/PanelRegistry.tsx', matches: 1 }
        ],
        outputType: 'table',
        logs: [
          { timestamp: now - 3600000, message: 'Initiated query: "WorkspaceManagerImpl"', type: 'info' },
          { timestamp: now - 3600000 + 100, message: 'Scanning directory ./src...', type: 'info' },
          { timestamp: now - 3600000 + 382, message: 'Search finished with 2 file hits', type: 'info' }
        ],
        retryCount: 0,
      },
      {
        id: 'tool-lint-2',
        name: 'ProjectLinterTool',
        description: 'Running TypeScript strict checks and ESLint formatting validations.',
        status: 'success',
        progress: 100,
        startTime: now - 1800000,
        duration: 1240,
        tokenUsage: { input: 820, output: 150, total: 970 },
        cost: 0.0008,
        input: { fix: true },
        output: '✓ Linter completed successfully. No styling, formatting, or compilation issues detected in any of the 43 workspace files.',
        outputType: 'code',
        logs: [
          { timestamp: now - 1800000, message: 'Starting typescript linter validation', type: 'info' },
          { timestamp: now - 1800000 + 300, message: 'Inspecting index files & dependencies', type: 'info' },
          { timestamp: now - 1800000 + 1240, message: 'Completed clean run', type: 'info' }
        ],
        retryCount: 0,
      },
      {
        id: 'tool-sql-3',
        name: 'DatabaseSyncTool',
        description: 'Publishing relational database schemas and applying migration blueprints.',
        status: 'failed',
        progress: 100,
        startTime: now - 900000,
        duration: 480,
        tokenUsage: { input: 450, output: 80, total: 530 },
        cost: 0.0004,
        input: { schema: './src/db/schema.ts' },
        output: null,
        outputType: 'text',
        errorMessage: 'Database schema migration failed because Cloud SQL database connection was refused. Ensure Cloud SQL Service is initialized and network policies are correct.',
        logs: [
          { timestamp: now - 900000, message: 'Establishing migration credentials...', type: 'info' },
          { timestamp: now - 900000 + 150, message: 'Connecting to postgres://cloudsql/db...', type: 'info' },
          { timestamp: now - 900000 + 480, message: 'Connection refused: ECONNREFUSED', type: 'error' }
        ],
        retryCount: 2,
      }
    ];
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'completed' | 'failed' | 'cancelled'>('all');
  
  // Mobile UI States
  const [isMaximized, setIsMaximized] = useState(false);

  // Subscribe to real-time events via EventBus
  useEffect(() => {
    // Handler for a newly scheduled/queued tool run
    const handleToolQueued = (event: any) => {
      const payload = event.payload;
      const newTool: ExecutedTool = {
        id: payload.id,
        name: payload.name,
        description: payload.description || `Executing tool ${payload.name}`,
        status: 'queued',
        progress: 0,
        startTime: Date.now(),
        duration: 0,
        input: payload.input || {},
        output: null,
        outputType: payload.outputType || 'text',
        logs: [{ timestamp: Date.now(), message: 'Tool queued in execution pipeline', type: 'info' }],
        retryCount: payload.retryCount || 0,
        metadata: payload.metadata
      };
      setTools(prev => [newTool, ...prev]);
    };

    // Handler for tool starting execution
    const handleToolStarted = (event: any) => {
      const payload = event.payload;
      setTools(prev => prev.map(tool => {
        if (tool.id === payload.id) {
          return {
            ...tool,
            status: 'running',
            progress: 15,
            logs: [...tool.logs, { timestamp: Date.now(), message: 'Execution started', type: 'info' }]
          };
        }
        return tool;
      }));
    };

    // Handler for progress updates
    const handleToolProgress = (event: any) => {
      const payload = event.payload;
      setTools(prev => prev.map(tool => {
        if (tool.id === payload.id) {
          return {
            ...tool,
            progress: payload.progress,
            logs: payload.message ? [...tool.logs, { timestamp: Date.now(), message: payload.message, type: 'info' }] : tool.logs
          };
        }
        return tool;
      }));
    };

    // Handler for tool completion
    const handleToolCompleted = (event: any) => {
      const payload = event.payload;
      setTools(prev => prev.map(tool => {
        if (tool.id === payload.id) {
          return {
            ...tool,
            status: payload.status || 'success',
            progress: 100,
            duration: payload.duration || (Date.now() - tool.startTime),
            output: payload.output,
            tokenUsage: payload.tokenUsage,
            cost: payload.cost,
            logs: [...tool.logs, { timestamp: Date.now(), message: 'Execution completed successfully', type: 'info' }]
          };
        }
        return tool;
      }));
    };

    // Handler for tool failures
    const handleToolFailed = (event: any) => {
      const payload = event.payload;
      setTools(prev => prev.map(tool => {
        if (tool.id === payload.id) {
          return {
            ...tool,
            status: 'failed',
            progress: 100,
            duration: payload.duration || (Date.now() - tool.startTime),
            errorMessage: payload.error || 'Unknown error occurred during execution',
            logs: [...tool.logs, { timestamp: Date.now(), message: `Execution failed: ${payload.error}`, type: 'error' }]
          };
        }
        return tool;
      }));
    };

    // Subscribe to EventBus
    globalEventBus.subscribe('tool.queued', handleToolQueued);
    globalEventBus.subscribe('tool.started', handleToolStarted);
    globalEventBus.subscribe('tool.progress', handleToolProgress);
    globalEventBus.subscribe('tool.completed', handleToolCompleted);
    globalEventBus.subscribe('tool.failed', handleToolFailed);

    return () => {
      globalEventBus.unsubscribe('tool.queued', handleToolQueued);
      globalEventBus.unsubscribe('tool.started', handleToolStarted);
      globalEventBus.unsubscribe('tool.progress', handleToolProgress);
      globalEventBus.unsubscribe('tool.completed', handleToolCompleted);
      globalEventBus.unsubscribe('tool.failed', handleToolFailed);
    };
  }, []);

  // Filter and search logic memoized
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // Filter by active status category
      if (activeFilter === 'running' && tool.status !== 'running' && tool.status !== 'preparing') return false;
      if (activeFilter === 'completed' && tool.status !== 'success' && tool.status !== 'warning') return false;
      if (activeFilter === 'failed' && tool.status !== 'failed') return false;
      if (activeFilter === 'cancelled' && tool.status !== 'cancelled') return false;

      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          (tool.errorMessage && tool.errorMessage.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [tools, activeFilter, searchQuery]);

  // Clear list action
  const handleClearAll = useCallback(() => {
    setTools([]);
  }, []);

  // Expand / Collapse Single Card
  const toggleExpandCard = useCallback((id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand All
  const handleExpandAll = useCallback(() => {
    const allIds = filteredTools.map(t => t.id);
    setExpandedCards(new Set(allIds));
  }, [filteredTools]);

  // Collapse All
  const handleCollapseAll = useCallback(() => {
    setExpandedCards(new Set());
  }, []);

  // Demo simulator triggers a realistic tool execution process for rich client interactions
  const triggerSimulatedTool = useCallback(() => {
    const id = `sim-${Date.now()}`;
    const demoToolsList = [
      {
        name: 'WorkspaceSearchTool',
        description: 'Searching workspace directories for matching string patterns and references.',
        input: { query: 'import React', ext: '.tsx' },
        output: [
          { path: './src/components/layout/BottomPanel.tsx', line: 3 },
          { path: './src/components/panels/tools/ToolExecutionPanel.tsx', line: 1 }
        ],
        outputType: 'table',
        duration: 350,
        cost: 0.0002,
        tokens: { input: 150, output: 80, total: 230 }
      },
      {
        name: 'ProjectLinterTool',
        description: 'Running TypeScript strict checks and ESLint formatting validations.',
        input: { fix: true },
        output: '✓ All checks passed! No issues found inside components/ and core/.',
        outputType: 'code',
        duration: 800,
        cost: 0.0005,
        tokens: { input: 500, output: 100, total: 600 }
      },
      {
        name: 'GitCommitTool',
        description: 'Staging workspace modifications and generating atomic git commits.',
        input: { message: 'Milestone 8.6 complete' },
        output: '[main 9efb3a0] Milestone 8.6 complete\n 3 files changed, 240 insertions(+), 12 deletions(-)',
        outputType: 'text',
        duration: 450,
        cost: 0.0004,
        tokens: { input: 400, output: 120, total: 520 }
      }
    ];

    const chosen = demoToolsList[Math.floor(Math.random() * demoToolsList.length)];

    // Queue Tool Event
    globalEventBus.publish('tool.queued', {
      id,
      name: 'tool.queued',
      timestamp: Date.now(),
      payload: {
        id,
        name: chosen.name,
        description: chosen.description,
        input: chosen.input,
        outputType: chosen.outputType
      },
      source: 'ToolExecutionEngine'
    });

    // Start running after 400ms
    setTimeout(() => {
      globalEventBus.publish('tool.started', {
        id,
        name: 'tool.started',
        timestamp: Date.now(),
        payload: { id },
        source: 'ToolExecutionEngine'
      });

      // Progress updates
      let prog = 15;
      const interval = setInterval(() => {
        prog += 25;
        if (prog < 100) {
          globalEventBus.publish('tool.progress', {
            id,
            name: 'tool.progress',
            timestamp: Date.now(),
            payload: { 
              id, 
              progress: prog, 
              message: `Analyzing file blocks... ${prog}%` 
            },
            source: 'ToolExecutionEngine'
          });
        } else {
          clearInterval(interval);
          // Complete
          globalEventBus.publish('tool.completed', {
            id,
            name: 'tool.completed',
            timestamp: Date.now(),
            payload: {
              id,
              status: 'success',
              output: chosen.output,
              duration: chosen.duration,
              tokenUsage: chosen.tokens,
              cost: chosen.cost
            },
            source: 'ToolExecutionEngine'
          });
        }
      }, 300);
    }, 450);

  }, []);

  return (
    <div className="flex flex-col h-full bg-vaelox-panel text-vaelox-text select-none">
      {/* Sub Header & Control Actions */}
      <div className="p-3 border-b border-vaelox-border/40 flex flex-wrap items-center justify-between gap-3 bg-vaelox-surface/20">
        
        {/* Left: Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1">
          {(['all', 'running', 'completed', 'failed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer",
                activeFilter === filter
                  ? "bg-brand-500/10 border-brand-500/40 text-brand-400 font-bold"
                  : "bg-transparent border-transparent text-vaelox-muted hover:text-vaelox-text"
              )}
              style={{ minHeight: '32px' }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Middle: Live Search */}
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vaelox-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search executions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-vaelox-surface border border-vaelox-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-vaelox-text placeholder:text-vaelox-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
          />
        </div>

        {/* Right: Expand/Collapse All and Mock Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerSimulatedTool}
            className="px-2.5 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors cursor-pointer flex items-center gap-1.5"
            style={{ minHeight: '32px' }}
            title="Execute simulated tool"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Simulate Tool</span>
          </button>

          <button
            onClick={handleExpandAll}
            className="p-1.5 rounded-lg border border-vaelox-border bg-vaelox-surface/50 hover:bg-vaelox-surface hover:border-vaelox-border text-vaelox-text hover:text-white transition-colors cursor-pointer"
            title="Expand all cards"
            aria-label="Expand all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCollapseAll}
            className="p-1.5 rounded-lg border border-vaelox-border bg-vaelox-surface/50 hover:bg-vaelox-surface hover:border-vaelox-border text-vaelox-text hover:text-white transition-colors cursor-pointer"
            title="Collapse all cards"
            aria-label="Collapse all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleClearAll}
            className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Clear list"
            aria-label="Clear all tool executions"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main execution list viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {filteredTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-vaelox-muted space-y-3 p-8">
            <div className="w-12 h-12 rounded-full bg-vaelox-surface flex items-center justify-center border border-vaelox-border">
              <Layers className="w-6 h-6 text-vaelox-muted" />
            </div>
            <div>
              <p className="font-semibold text-sm">No tool activities found</p>
              <p className="text-xs text-vaelox-muted/80 max-w-xs mt-1">
                {searchQuery.trim() !== '' 
                  ? "Adjust search parameters or status filters to locate specific activities." 
                  : "Start chatting with Vaelox AI or click the simulate button above to trigger AI executions in real-time."
                }
              </p>
            </div>
          </div>
        ) : (
          filteredTools.map((tool) => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              isExpanded={expandedCards.has(tool.id)}
              onToggleExpand={toggleExpandCard}
            />
          ))
        )}
      </div>
    </div>
  );
}
