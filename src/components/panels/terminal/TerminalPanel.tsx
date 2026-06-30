import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Terminal, Plus, X, SplitSquareHorizontal, ChevronRight, Check, AlertTriangle, Info, Search, CornerDownRight, Command, Copy, ArrowUp, ArrowDown, Download, Trash2, Edit2, Play, Circle, MoreVertical, LayoutPanelLeft } from 'lucide-react';
import { globalEventBus } from '@/core/events/globalEventBus';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';

export interface TerminalLog {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'warning' | 'success' | 'command';
  text: string;
  timestamp: number;
  metadata?: any;
}

export interface TerminalInstance {
  id: string;
  name: string;
  logs: TerminalLog[];
  history: string[];
}

interface TerminalPanelProps {}

const STORAGE_KEY = 'vaelox_terminal_state';

export function TerminalPanel(props: TerminalPanelProps) {
  const { isMobile } = useLayout();
  const [instances, setInstances] = useState<TerminalInstance[]>([{
    id: 'term_1',
    name: 'Bash - Vaelox',
    logs: [
      { id: 'init_1', type: 'info', text: 'Vaelox Agent Terminal initialized. Ready for commands.', timestamp: Date.now() }
    ],
    history: []
  }]);
  const [activeIds, setActiveIds] = useState<string[]>(['term_1']);
  const [activeTab, setActiveTab] = useState<string>('term_1');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Input states
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, instanceId: string} | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.instances && parsed.instances.length > 0) {
          setInstances(parsed.instances);
          setActiveIds(parsed.activeIds || [parsed.instances[0].id]);
          setActiveTab(parsed.activeTab || parsed.instances[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading terminal state', e);
    }
  }, []);

  // Save state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        instances,
        activeIds,
        activeTab
      }));
    } catch (e) {
      console.error('Error saving terminal state', e);
    }
  }, [instances, activeIds, activeTab]);

  const addLog = useCallback((instanceId: string, log: Omit<TerminalLog, 'id' | 'timestamp'>) => {
    setInstances(prev => prev.map(inst => {
      if (inst.id === instanceId || instanceId === 'all' || (instanceId === 'active' && activeIds.includes(inst.id))) {
        return {
          ...inst,
          logs: [...inst.logs, {
            ...log,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
          }]
        };
      }
      return inst;
    }));
  }, [activeIds]);

  // Subscribe to EventBus
  useEffect(() => {
    const handleWorkflowStarted = (e: any) => addLog('active', { type: 'info', text: `[Workflow] Started: ${e.payload.workflowId}` });
    const handleAgentStarted = (e: any) => addLog('active', { type: 'info', text: `[Agent] Planning... (${e.payload.agentId})` });
    const handleAgentCompleted = (e: any) => addLog('active', { type: 'success', text: `[Agent] Completed. Cost: $${e.payload.cost || 0}, Tokens: ${e.payload.tokens || 0}` });
    
    const handleToolQueued = (e: any) => addLog('active', { type: 'info', text: `[Tool] Queued: ${e.payload.tool.name}` });
    const handleToolStarted = (e: any) => addLog('active', { type: 'info', text: `[Tool] Executing... ${e.payload.tool.name}` });
    const handleToolProgress = (e: any) => addLog('active', { type: 'stdout', text: `[Tool Progress] ${e.payload.progress || 0}% - ${e.payload.status}` });
    const handleToolCompleted = (e: any) => addLog('active', { type: 'success', text: `[Tool] Completed ${e.payload.tool.name}. Duration: ${e.payload.result.duration || 0}ms` });
    const handleToolFailed = (e: any) => addLog('active', { type: 'stderr', text: `[Tool] Failed ${e.payload.tool.name}: ${e.payload.error}` });

    globalEventBus.subscribe('workflow.started', handleWorkflowStarted);
    globalEventBus.subscribe('agent.started', handleAgentStarted);
    globalEventBus.subscribe('agent.completed', handleAgentCompleted);
    globalEventBus.subscribe('tool.queued', handleToolQueued);
    globalEventBus.subscribe('tool.started', handleToolStarted);
    globalEventBus.subscribe('tool.progress', handleToolProgress);
    globalEventBus.subscribe('tool.completed', handleToolCompleted);
    globalEventBus.subscribe('tool.failed', handleToolFailed);

    return () => {
      globalEventBus.unsubscribe('workflow.started', handleWorkflowStarted);
      globalEventBus.unsubscribe('agent.started', handleAgentStarted);
      globalEventBus.unsubscribe('agent.completed', handleAgentCompleted);
      globalEventBus.unsubscribe('tool.queued', handleToolQueued);
      globalEventBus.unsubscribe('tool.started', handleToolStarted);
      globalEventBus.unsubscribe('tool.progress', handleToolProgress);
      globalEventBus.unsubscribe('tool.completed', handleToolCompleted);
      globalEventBus.unsubscribe('tool.failed', handleToolFailed);
    };
  }, [addLog]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = inputValue.trim();
      if (val) {
        setInstances(prev => prev.map(inst => {
          if (inst.id === activeTab) {
            return {
              ...inst,
              history: [val, ...inst.history].slice(0, 50)
            };
          }
          return inst;
        }));
        addLog(activeTab, { type: 'command', text: `$ ${val}` });
        
        // Mock command execution
        if (val === 'clear') {
          setInstances(prev => prev.map(inst => inst.id === activeTab ? { ...inst, logs: [] } : inst));
        } else {
          addLog(activeTab, { type: 'stdout', text: `Command not found: ${val}. This terminal primarily outputs Vaelox Agent events.` });
        }
      }
      setInputValue('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const inst = instances.find(i => i.id === activeTab);
      if (inst && inst.history.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, inst.history.length - 1);
        setHistoryIndex(nextIdx);
        setInputValue(inst.history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const inst = instances.find(i => i.id === activeTab);
      if (inst && historyIndex >= 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputValue(nextIdx >= 0 ? inst.history[nextIdx] : '');
      }
    }
  };

  const createTerminal = () => {
    const id = `term_${Date.now()}`;
    setInstances(prev => [...prev, {
      id,
      name: `bash-${prev.length + 1}`,
      logs: [{ id: `init_${id}`, type: 'info', text: 'New terminal session started.', timestamp: Date.now() }],
      history: []
    }]);
    setActiveTab(id);
    if (!activeIds.includes(id)) {
      setActiveIds([id]);
    }
  };

  const closeTerminal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (instances.length <= 1) return; // Don't close the last one
    
    setInstances(prev => prev.filter(i => i.id !== id));
    
    if (activeIds.includes(id)) {
      const newActiveIds = activeIds.filter(activeId => activeId !== id);
      if (newActiveIds.length === 0) {
        const rem = instances.filter(i => i.id !== id);
        newActiveIds.push(rem[rem.length - 1].id);
      }
      setActiveIds(newActiveIds);
    }
    
    if (activeTab === id) {
      const rem = instances.filter(i => i.id !== id);
      setActiveTab(rem[rem.length - 1].id);
    }
  };

  const splitTerminal = () => {
    if (isMobile) return;
    const current = instances.find(i => i.id === activeTab);
    if (current && activeIds.length < 2) { // Max 2 splits for simplicity
      const id = `term_${Date.now()}`;
      setInstances(prev => [...prev, {
        id,
        name: `bash-${prev.length + 1}`,
        logs: [{ id: `init_${id}`, type: 'info', text: 'Terminal split created.', timestamp: Date.now() }],
        history: []
      }]);
      setActiveIds([...activeIds, id]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, instanceId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, instanceId });
  };

  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const handleGlobalClick = () => closeContextMenu();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const executeContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { instanceId } = contextMenu;
    
    switch (action) {
      case 'clear':
        setInstances(prev => prev.map(inst => inst.id === instanceId ? { ...inst, logs: [] } : inst));
        break;
      case 'copy':
        const sel = window.getSelection();
        if (sel && sel.toString()) {
          navigator.clipboard.writeText(sel.toString());
        }
        break;
      case 'select_all':
        // Simplistic select all - a real terminal would use a custom selection model
        const range = document.createRange();
        const el = document.getElementById(`terminal-output-${instanceId}`);
        if (el) {
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        break;
      case 'export':
        const inst = instances.find(i => i.id === instanceId);
        if (inst) {
          const blob = new Blob([inst.logs.map(l => `[${new Date(l.timestamp).toISOString()}] ${l.text}`).join('\n')], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `terminal_${instanceId}.log`;
          a.click();
          URL.revokeObjectURL(url);
        }
        break;
    }
  };

  // Search logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const activeInstance = instances.find(i => i.id === activeTab);
    if (!activeInstance) return;

    const matches: number[] = [];
    activeInstance.logs.forEach((log, idx) => {
      if (log.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        matches.push(idx);
      }
    });

    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, instances, activeTab]);

  return (
    <div className="w-full h-full flex flex-col bg-[#050508] text-vaelox-text overflow-hidden relative font-mono text-xs shadow-inner">
      {/* Top Header - Tabs & Controls */}
      <div className="flex-none h-9 flex items-center justify-between border-b border-vaelox-border/50 bg-vaelox-panel/80 select-none z-10 pl-2">
        
        {/* Terminal Tabs */}
        <div className="flex items-center h-full overflow-x-auto no-scrollbar">
          {instances.map(inst => {
            const isActive = activeTab === inst.id;
            return (
              <div 
                key={inst.id}
                onClick={() => {
                  setActiveTab(inst.id);
                  if (!activeIds.includes(inst.id)) {
                    setActiveIds([inst.id, ...activeIds.filter(id => id !== activeIds[0])].slice(0, isMobile ? 1 : 2));
                  }
                }}
                onDoubleClick={() => {
                  const newName = prompt('Rename terminal:', inst.name);
                  if (newName && newName.trim()) {
                    setInstances(prev => prev.map(i => i.id === inst.id ? { ...i, name: newName.trim() } : i));
                  }
                }}
                className={cn(
                  "flex items-center gap-2 h-full px-3 border-r border-vaelox-border/40 cursor-pointer min-w-[120px] max-w-[200px] group transition-colors",
                  isActive ? "bg-vaelox-surface text-brand-400 border-t-2 border-t-brand-500" : "text-vaelox-muted hover:bg-vaelox-surface/50"
                )}
              >
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1">{inst.name}</span>
                {instances.length > 1 && (
                  <button 
                    onClick={(e) => closeTerminal(e, inst.id)}
                    className={cn(
                      "p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-vaelox-panel shrink-0",
                      isActive ? "opacity-100" : ""
                    )}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          
          <button 
            onClick={createTerminal}
            className="p-2 text-vaelox-muted hover:text-vaelox-text transition-colors"
            title="New Terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5 px-2">
          {/* Search Toggle */}
          <button
            onClick={() => setSearchActive(!searchActive)}
            className={cn("p-1.5 rounded transition-colors", searchActive ? "bg-brand-500/20 text-brand-400" : "text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/50")}
            title="Search logs"
          >
            <Search className="w-4 h-4" />
          </button>
          
          {!isMobile && (
            <button
              onClick={splitTerminal}
              disabled={activeIds.length >= 2}
              className="p-1.5 text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/50 rounded transition-colors disabled:opacity-50"
              title="Split Terminal"
            >
              <SplitSquareHorizontal className="w-4 h-4" />
            </button>
          )}
          
          <button 
            onClick={() => setInstances(prev => prev.map(inst => inst.id === activeTab ? { ...inst, logs: [] } : inst))}
            className="p-1.5 text-vaelox-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar Overlay */}
      {searchActive && (
        <div className="absolute top-9 right-4 z-20 bg-vaelox-panel border border-vaelox-border rounded-lg p-1.5 flex items-center gap-2 shadow-xl backdrop-blur-md">
          <Search className="w-3.5 h-3.5 text-vaelox-muted ml-1" />
          <input
            type="text"
            placeholder="Find in terminal..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-vaelox-text w-40"
            autoFocus
          />
          <span className="text-[10px] text-vaelox-muted w-12 text-right">
            {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}
          </span>
          <div className="flex items-center border-l border-vaelox-border/50 pl-1 ml-1">
            <button 
              onClick={() => setCurrentMatchIndex(prev => prev > 0 ? prev - 1 : searchMatches.length - 1)}
              className="p-1 hover:bg-vaelox-surface rounded text-vaelox-muted hover:text-vaelox-text"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setCurrentMatchIndex(prev => prev < searchMatches.length - 1 ? prev + 1 : 0)}
              className="p-1 hover:bg-vaelox-surface rounded text-vaelox-muted hover:text-vaelox-text"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => { setSearchActive(false); setSearchQuery(''); }}
              className="p-1 hover:bg-vaelox-surface rounded text-vaelox-muted hover:text-vaelox-text ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Split / Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeIds.map((id, index) => {
          const instance = instances.find(i => i.id === id);
          if (!instance) return null;
          
          return (
            <div 
              key={id} 
              className={cn(
                "flex-1 flex flex-col min-w-0 border-vaelox-border/50",
                index > 0 && "border-l"
              )}
              onContextMenu={(e) => handleContextMenu(e, id)}
              onClick={() => setActiveTab(id)}
            >
              {/* Output Area */}
              <div 
                id={`terminal-output-${id}`}
                className="flex-1 overflow-y-auto p-3 space-y-1 scroll-smooth"
                ref={el => {
                  if (el) {
                    // Basic auto-scroll (would need intersection observer for proper "only when at bottom" logic in prod)
                    el.scrollTop = el.scrollHeight;
                  }
                }}
              >
                {instance.logs.length === 0 ? (
                  <div className="text-vaelox-muted italic opacity-50 py-2">Terminal output cleared.</div>
                ) : (
                  instance.logs.map((log, idx) => {
                    const isHighlighted = searchActive && searchQuery && log.text.toLowerCase().includes(searchQuery.toLowerCase());
                    const isCurrentMatch = searchActive && searchMatches[currentMatchIndex] === idx;
                    
                    return (
                      <div 
                        key={log.id} 
                        className={cn(
                          "flex items-start gap-2 group leading-relaxed break-words hover:bg-white/[0.02] px-1 -mx-1 rounded",
                          isCurrentMatch && "bg-brand-500/20 ring-1 ring-brand-500/50"
                        )}
                      >
                        {/* Timestamp */}
                        <span className="text-[10px] text-vaelox-muted/60 shrink-0 select-none mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>

                        {/* Icon based on log type */}
                        <span className="shrink-0 mt-0.5">
                          {log.type === 'command' && <ChevronRight className="w-3.5 h-3.5 text-brand-400" />}
                          {log.type === 'stdout' && <Circle className="w-2.5 h-2.5 text-vaelox-muted mt-0.5" />}
                          {log.type === 'stderr' && <AlertTriangle className="w-3 h-3 text-red-400" />}
                          {log.type === 'info' && <Info className="w-3 h-3 text-sky-400" />}
                          {log.type === 'success' && <Check className="w-3 h-3 text-emerald-400" />}
                          {log.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </span>

                        {/* Content */}
                        <span className={cn(
                          "flex-1 whitespace-pre-wrap selection:bg-brand-500/30",
                          log.type === 'stderr' ? 'text-red-400' :
                          log.type === 'info' ? 'text-sky-400' :
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'warning' ? 'text-amber-400' :
                          log.type === 'command' ? 'text-vaelox-text font-bold' :
                          'text-vaelox-text/90',
                          isHighlighted && !isCurrentMatch && "bg-brand-500/20 text-brand-400"
                        )}>
                          {log.text}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area (Only show for active tab if split) */}
              {activeTab === id && (
                <div className="flex-none p-2 border-t border-vaelox-border/30 bg-vaelox-surface/30">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-brand-400 font-bold">~</span>
                    <ChevronRight className="w-3.5 h-3.5 text-vaelox-muted" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={handleCommand}
                      className="flex-1 bg-transparent border-none outline-none text-vaelox-text placeholder:text-vaelox-muted/30"
                      placeholder="Type command or interact with Agent..."
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="absolute z-50 bg-vaelox-panel border border-vaelox-border shadow-2xl rounded-lg py-1 min-w-[160px] text-xs font-sans"
          style={{ top: contextMenu.y - 40, left: contextMenu.x }} // offset a bit to stay in panel bounds ideally
          onClick={e => e.stopPropagation()}
        >
          <button className="w-full px-4 py-1.5 text-left flex items-center gap-2 hover:bg-vaelox-surface text-vaelox-text transition-colors" onClick={() => executeContextMenuAction('copy')}>
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
          <button className="w-full px-4 py-1.5 text-left flex items-center gap-2 hover:bg-vaelox-surface text-vaelox-text transition-colors" onClick={() => executeContextMenuAction('select_all')}>
            <LayoutPanelLeft className="w-3.5 h-3.5" /> Select All
          </button>
          <div className="h-px bg-vaelox-border/50 my-1"></div>
          <button className="w-full px-4 py-1.5 text-left flex items-center gap-2 hover:bg-vaelox-surface text-vaelox-text transition-colors" onClick={() => executeContextMenuAction('clear')}>
            <Trash2 className="w-3.5 h-3.5" /> Clear Terminal
          </button>
          <button className="w-full px-4 py-1.5 text-left flex items-center gap-2 hover:bg-vaelox-surface text-vaelox-text transition-colors" onClick={() => executeContextMenuAction('export')}>
            <Download className="w-3.5 h-3.5" /> Export Log
          </button>
        </div>
      )}
    </div>
  );
}
