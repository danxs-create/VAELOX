'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Search,
  Filter,
  Plus,
  Trash2,
  Archive,
  Star,
  Pin,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  Tag,
  BookOpen,
  FileText,
  BarChart3,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Send,
  Zap,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { 
  globalMemoryManager, 
  globalKnowledgeLayer, 
  globalContextCompressor, 
  globalContextBuilder, 
  globalPromptAssembler, 
  initializeGlobalMemory 
} from '@/core/memory/globalMemorySystem';
import { globalEventBus } from '@/core/events/globalEventBus';
import { MemoryEntry, MemoryType, KnowledgeEntry } from '@/types/memory';
import { cn } from '@/lib/utils';
import { useLayout } from '@/contexts/LayoutContext';

// Ensure our rich initial data is populated
initializeGlobalMemory();

export function MemoryPanel() {
  const { isMobile } = useLayout();

  // Primary live state loaded from our singleton manager & knowledge layer
  const [workingEntries, setWorkingEntries] = useState<MemoryEntry[]>([]);
  const [sessionEntries, setSessionEntries] = useState<MemoryEntry[]>([]);
  const [projectEntries, setProjectEntries] = useState<MemoryEntry[]>([]);
  const [globalEntries, setGlobalEntries] = useState<MemoryEntry[]>([]);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  
  // Stats
  const [compressedEvents, setCompressedEvents] = useState<Array<{ original: number, compressed: number }>>([]);

  // Selections & detail drawer
  const [selectedEntry, setSelectedEntry] = useState<{
    entry: MemoryEntry | KnowledgeEntry;
    category?: string;
  } | null>(null);

  // Active sub-panels / tabs in memory view
  const [activeSegment, setActiveSegment] = useState<'working' | 'session' | 'project' | 'global' | 'knowledge' | 'preview' | 'stats'>('working');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'recency' | 'frequency' | 'alphabetical'>('score');
  const [pinnedKeys, setPinnedKeys] = useState<Set<string>>(new Set(['current_user_request']));
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Interactive Context Builder Sandbox state
  const [sandboxRequest, setSandboxRequest] = useState('Build a premium UI template.');
  const [sandboxAssembledPrompt, setSandboxAssembledPrompt] = useState('');
  const [sandboxTokens, setSandboxTokens] = useState(0);

  // Keyboard navigation index
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Handle Search Input Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounced(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Synchronize state with backend on mount and subscribe to EventBus updates
  const refreshAllMemories = useCallback(async () => {
    const queryAll = { limit: 100 };
    
    const [w, s, p, g, k] = await Promise.all([
      globalMemoryManager.working.search(queryAll),
      globalMemoryManager.session.search(queryAll),
      globalMemoryManager.project.search(queryAll),
      globalMemoryManager.global.search(queryAll),
      globalKnowledgeLayer.search('Build') // Search with a broad keyword or fallback all
    ]);

    // Fallback to get some knowledge entries even if keyword doesn't match
    const backupK = await globalKnowledgeLayer.search('All');
    const combinedK = Array.from(new Set([...k, ...backupK, ...await globalKnowledgeLayer.search('Vaelox')]));

    // Calculate dynamic scoring using MemoryScorer behavior
    const wScored = w.map(entry => ({ ...entry, score: entry.metadata.importance * 1.2 }));
    const sScored = s.map(entry => ({ ...entry, score: entry.metadata.importance * 1.0 }));
    const pScored = p.map(entry => ({ ...entry, score: entry.metadata.importance * 0.9 }));
    const gScored = g.map(entry => ({ ...entry, score: entry.metadata.importance * 0.8 }));

    setWorkingEntries(wScored);
    setSessionEntries(sScored);
    setProjectEntries(pScored);
    setGlobalEntries(gScored);
    setKnowledgeEntries(combinedK);
  }, []);

  useEffect(() => {
    refreshAllMemories();

    // EventBus subscriptions for real-time reactivity
    const handleCreated = (event: any) => {
      refreshAllMemories();
    };
    const handleUpdated = (event: any) => {
      refreshAllMemories();
    };
    const handleDeleted = (event: any) => {
      refreshAllMemories();
      if (selectedEntry && (selectedEntry.entry as any).id === event.payload.id) {
        setSelectedEntry(null);
      }
    };
    const handleArchived = (event: any) => {
      refreshAllMemories();
    };
    const handleCompressed = (event: any) => {
      setCompressedEvents(prev => [...prev, {
        original: event.payload.originalTokens,
        compressed: event.payload.compressedTokens
      }]);
    };

    globalEventBus.subscribe('memory.created', handleCreated);
    globalEventBus.subscribe('memory.updated', handleUpdated);
    globalEventBus.subscribe('memory.deleted', handleDeleted);
    globalEventBus.subscribe('memory.archived', handleArchived);
    globalEventBus.subscribe('memory.compressed', handleCompressed);

    return () => {
      globalEventBus.unsubscribe('memory.created', handleCreated);
      globalEventBus.unsubscribe('memory.updated', handleUpdated);
      globalEventBus.unsubscribe('memory.deleted', handleDeleted);
      globalEventBus.unsubscribe('memory.archived', handleArchived);
      globalEventBus.unsubscribe('memory.compressed', handleCompressed);
    };
  }, [refreshAllMemories, selectedEntry]);

  // Handle live calculation of assembled prompt in prompt preview sandbox
  useEffect(() => {
    let active = true;
    const assemblePreview = async () => {
      try {
        const assembled = await globalPromptAssembler.assemble(
          'System: You are Vaelox, a highly reliable agent.',
          'Instruction: Provide a cohesive review of workspace resources.',
          sandboxRequest,
          2048
        );
        if (active) {
          setSandboxAssembledPrompt(assembled);
          setSandboxTokens(globalContextCompressor.estimateTokens(assembled));
        }
      } catch (err) {
        console.error('Error assembling preview prompt:', err);
      }
    };

    assemblePreview();
    return () => {
      active = false;
    };
  }, [sandboxRequest, workingEntries, sessionEntries, projectEntries, globalEntries]);

  // PIN toggler
  const togglePin = useCallback((key: string) => {
    setPinnedKeys(prev => {
      const copy = new Set(prev);
      if (copy.has(key)) {
        copy.delete(key);
      } else {
        copy.add(key);
      }
      return copy;
    });
  }, []);

  // ARCHIVE action trigger
  const handleArchiveToggle = useCallback(async (entry: MemoryEntry) => {
    const store = entry.type === MemoryType.WORKING ? globalMemoryManager.working :
                  entry.type === MemoryType.SESSION ? globalMemoryManager.session :
                  entry.type === MemoryType.PROJECT ? globalMemoryManager.project :
                  globalMemoryManager.global;
    
    // Toggle state
    const isCurrentlyArchived = entry.metadata.archived;
    await store.set(entry.key, entry.value, entry.metadata.tags, {
      ...entry.metadata,
      archived: !isCurrentlyArchived
    });
    
    // Publish archived event if newly archived
    if (!isCurrentlyArchived) {
      globalEventBus.publish('memory.archived', {
        id: entry.id,
        name: 'memory.archived',
        timestamp: Date.now(),
        source: entry.type,
        payload: { entry }
      });
    }

    refreshAllMemories();
    setSelectedEntry(prev => prev && (prev.entry as any).id === entry.id ? {
      ...prev,
      entry: {
        ...prev.entry,
        metadata: {
          ...prev.entry.metadata,
          archived: !isCurrentlyArchived
        }
      } as any
    } : prev);
  }, [refreshAllMemories, selectedEntry]);

  // DELETE action trigger
  const handleDeleteEntry = useCallback(async (entry: MemoryEntry) => {
    const store = entry.type === MemoryType.WORKING ? globalMemoryManager.working :
                  entry.type === MemoryType.SESSION ? globalMemoryManager.session :
                  entry.type === MemoryType.PROJECT ? globalMemoryManager.project :
                  globalMemoryManager.global;
    
    await store.delete(entry.key);
    refreshAllMemories();
  }, [refreshAllMemories]);

  // Stats Derived
  const stats = useMemo(() => {
    const wCount = workingEntries.length;
    const sCount = sessionEntries.length;
    const pCount = projectEntries.length;
    const gCount = globalEntries.length;
    const kCount = knowledgeEntries.length;

    let totalTokens = 0;
    let sumScore = 0;
    let totalItems = 0;
    let archiveCount = 0;

    const countTokens = (text: any) => {
      const str = typeof text === 'string' ? text : JSON.stringify(text || '');
      return globalContextCompressor.estimateTokens(str);
    };

    [...workingEntries, ...sessionEntries, ...projectEntries, ...globalEntries].forEach(entry => {
      totalTokens += countTokens(entry.value);
      sumScore += entry.score || 0;
      totalItems++;
      if (entry.metadata.archived) archiveCount++;
    });

    return {
      workingCount: wCount,
      sessionCount: sCount,
      projectCount: pCount,
      globalCount: gCount,
      knowledgeCount: kCount,
      totalTokens,
      avgScore: totalItems ? parseFloat((sumScore / totalItems).toFixed(2)) : 0.5,
      compressedCount: compressedEvents.length,
      archivedCount: archiveCount
    };
  }, [workingEntries, sessionEntries, projectEntries, globalEntries, knowledgeEntries, compressedEvents]);

  // Working Memory Processing (Search + Pin Sort + Sort By)
  const processedWorkingEntries = useMemo(() => {
    return workingEntries
      .filter(entry => {
        if (!searchDebounced) return true;
        const term = searchDebounced.toLowerCase();
        return entry.key.toLowerCase().includes(term) || 
               JSON.stringify(entry.value).toLowerCase().includes(term) ||
               entry.metadata.tags.some(t => t.toLowerCase().includes(term));
      })
      .sort((a, b) => {
        // Pin priorities first
        const aPinned = pinnedKeys.has(a.key) ? 1 : 0;
        const bPinned = pinnedKeys.has(b.key) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;

        // Custom sort by
        if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
        if (sortBy === 'recency') return b.metadata.lastAccessed - a.metadata.lastAccessed;
        if (sortBy === 'frequency') return b.metadata.frequency - a.metadata.frequency;
        return a.key.localeCompare(b.key);
      });
  }, [workingEntries, searchDebounced, sortBy, pinnedKeys]);

  // Session Memory Processing (Newest First)
  const processedSessionEntries = useMemo(() => {
    return sessionEntries
      .filter(entry => {
        if (!searchDebounced) return true;
        const term = searchDebounced.toLowerCase();
        return entry.key.toLowerCase().includes(term) || 
               JSON.stringify(entry.value).toLowerCase().includes(term);
      })
      .sort((a, b) => b.metadata.lastAccessed - a.metadata.lastAccessed);
  }, [sessionEntries, searchDebounced]);

  // Project Memory Processing: Grouped by virtual folder path hierarchies
  const projectTree = useMemo(() => {
    const folders: Record<string, MemoryEntry[]> = {};
    const rootFiles: MemoryEntry[] = [];

    projectEntries.forEach(entry => {
      // Apply search filters
      if (searchDebounced) {
        const term = searchDebounced.toLowerCase();
        if (!entry.key.toLowerCase().includes(term) && !JSON.stringify(entry.value).toLowerCase().includes(term)) {
          return;
        }
      }

      const parts = entry.key.split('/');
      if (parts.length > 1) {
        const folderName = parts.slice(0, -1).join('/');
        if (!folders[folderName]) folders[folderName] = [];
        folders[folderName].push(entry);
      } else {
        rootFiles.push(entry);
      }
    });

    return { folders, rootFiles };
  }, [projectEntries, searchDebounced]);

  // Global Memory Processing (Categorized tags filter)
  const processedGlobalEntries = useMemo(() => {
    return globalEntries.filter(entry => {
      if (!searchDebounced) return true;
      const term = searchDebounced.toLowerCase();
      return entry.key.toLowerCase().includes(term) || 
             JSON.stringify(entry.value).toLowerCase().includes(term) ||
             entry.metadata.tags.some(t => t.toLowerCase().includes(term));
    });
  }, [globalEntries, searchDebounced]);

  // Knowledge layer entries processing
  const processedKnowledgeEntries = useMemo(() => {
    return knowledgeEntries.filter(entry => {
      // Category filter
      if (selectedCategory !== 'all' && entry.categoryId !== selectedCategory) {
        return false;
      }
      
      if (!searchDebounced) return true;
      const term = searchDebounced.toLowerCase();
      const contentMatch = entry.content.toLowerCase().includes(term);
      const titleMatch = (entry.metadata?.title as string || '').toLowerCase().includes(term);
      return contentMatch || titleMatch;
    });
  }, [knowledgeEntries, searchDebounced, selectedCategory]);

  // Create a new memory entry manually to demonstrate interactivity
  const handleAddNewEntry = useCallback(async () => {
    const key = `custom_working_node_${Date.now()}`;
    const tags = ['interactive_user', 'custom_node'];
    await globalMemoryManager.working.set(
      key,
      'This memory was created interactively by the user via the live UI.',
      tags,
      { importance: 0.95 }
    );
    refreshAllMemories();
  }, [refreshAllMemories]);

  // Keyboard navigation handler inside the lists
  const handleKeyDown = useCallback((e: React.KeyboardEvent, length: number, onSelect: (idx: number) => void) => {
    if (length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev < length - 1 ? prev + 1 : 0;
        onSelect(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev > 0 ? prev - 1 : length - 1;
        onSelect(next);
        return next;
      });
    }
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-[#050508] text-vaelox-text select-none overflow-hidden relative" id="memory-layer-workspace">
      
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Top Header - Statistics Dashboard Quick Bento */}
      <div className="flex-none p-4 md:p-5 border-b border-vaelox-border bg-vaelox-panel/80 backdrop-blur-md relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-500/10 rounded-xl text-brand-400 border border-brand-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-sm md:text-base font-bold text-vaelox-text tracking-tight flex items-center gap-2">
                Vaelox Agent Memory Layer
                <span className="text-[10px] bg-brand-500/15 text-brand-400 font-mono font-semibold px-2 py-0.5 rounded-full border border-brand-500/20">Production</span>
              </h2>
              <p className="text-[11px] text-vaelox-muted">Inspect, debug, and trace semantic working memory, session timelines, and context assemblies.</p>
            </div>
          </div>

          {/* Quick Stats Bento Row */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-w-4xl w-full lg:w-auto">
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Working</span>
              <span className="text-xs font-bold text-vaelox-text mt-0.5 block">{stats.workingCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Session</span>
              <span className="text-xs font-bold text-vaelox-text mt-0.5 block">{stats.sessionCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Project</span>
              <span className="text-xs font-bold text-vaelox-text mt-0.5 block">{stats.projectCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Global</span>
              <span className="text-xs font-bold text-vaelox-text mt-0.5 block">{stats.globalCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Knowledge</span>
              <span className="text-xs font-bold text-vaelox-text mt-0.5 block">{stats.knowledgeCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Score</span>
              <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{stats.avgScore}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Archived</span>
              <span className="text-xs font-bold text-amber-400 mt-0.5 block">{stats.archivedCount}</span>
            </div>
            <div className="bg-vaelox-surface/55 p-2 rounded-xl border border-vaelox-border/60 text-center">
              <span className="text-[9px] text-vaelox-muted uppercase font-mono block">Compress</span>
              <span className="text-xs font-bold text-brand-400 mt-0.5 block">{stats.compressedCount}</span>
            </div>
          </div>
        </div>

        {/* Global Toolbar Segment / Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mt-4 pt-4 border-t border-vaelox-border/50">
          
          {/* Segment selection tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 bg-vaelox-surface/20 p-1 rounded-xl border border-vaelox-border">
            {[
              { id: 'working', label: 'Working Memory', count: stats.workingCount },
              { id: 'session', label: 'Session Stream', count: stats.sessionCount },
              { id: 'project', label: 'Project Files', count: stats.projectCount },
              { id: 'global', label: 'Global Rules', count: stats.globalCount },
              { id: 'knowledge', label: 'Knowledge Cards', count: stats.knowledgeCount },
              { id: 'preview', label: 'Prompt Sandbox' },
              { id: 'stats', label: 'Memory Audit' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSegment(tab.id as any);
                  setFocusedIndex(-1);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                  activeSegment === tab.id 
                    ? "bg-brand-500/10 text-brand-400 border border-brand-500/20 font-bold" 
                    : "text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/40 border border-transparent"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[10px] font-mono opacity-80 bg-[#08080c] px-1 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="flex items-center gap-2 md:w-80 relative shrink-0">
            <Search className="w-3.5 h-3.5 text-vaelox-muted absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search memory node layers...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-vaelox-surface border border-vaelox-border rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-vaelox-text placeholder:text-vaelox-muted focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-vaelox-muted hover:text-vaelox-text"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT LIST CONTAINER */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-5 relative" id="memory-list-scroller">
            
            {/* SEGMENT: WORKING MEMORY */}
            {activeSegment === 'working' && (
              <div className="space-y-3.5" onKeyDown={(e) => handleKeyDown(e, processedWorkingEntries.length, (idx) => setSelectedEntry({ entry: processedWorkingEntries[idx] }))}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider">Working Memory Cells</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-1.5 rounded">Scored & Scanned</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Sort Options */}
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-vaelox-muted text-[11px]">Sort:</span>
                      <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-vaelox-surface border border-vaelox-border text-vaelox-text rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none cursor-pointer focus:border-brand-500"
                      >
                        <option value="score">Relevance Score</option>
                        <option value="recency">Recency Accessed</option>
                        <option value="frequency">Read Frequency</option>
                        <option value="alphabetical">Key Names</option>
                      </select>
                    </div>

                    <button
                      onClick={handleAddNewEntry}
                      className="px-2.5 py-1 text-xs font-bold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Node
                    </button>
                  </div>
                </div>

                {processedWorkingEntries.length === 0 ? (
                  <div className="text-center p-8 bg-vaelox-panel/20 border border-dashed border-vaelox-border rounded-xl text-xs text-vaelox-muted italic">
                    No active working memories match your query filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {processedWorkingEntries.map((entry, idx) => {
                      const isSelected = selectedEntry && (selectedEntry.entry as any).id === entry.id;
                      const isPinned = pinnedKeys.has(entry.key);
                      return (
                        <div
                          key={entry.id}
                          tabIndex={0}
                          onClick={() => setSelectedEntry({ entry })}
                          className={cn(
                            "p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between relative",
                            isSelected 
                              ? "bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.1)]" 
                              : "bg-vaelox-panel/40 border-vaelox-border hover:bg-vaelox-panel/80",
                            focusedIndex === idx && "ring-1 ring-brand-400"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-vaelox-text font-mono truncate">{entry.key}</h4>
                              <p className="text-xs text-vaelox-muted line-clamp-2 mt-1.5 leading-relaxed">{typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value)}</p>
                            </div>

                            {/* Pin / Score badges */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(entry.key);
                                }}
                                className={cn("p-1 rounded-md transition-colors", isPinned ? "text-amber-400" : "text-vaelox-muted hover:text-vaelox-text")}
                              >
                                <Pin className="w-3 h-3 fill-current" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-3 pt-3 border-t border-vaelox-border/40 text-[10px] font-mono text-vaelox-muted">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {entry.metadata.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 bg-vaelox-surface border border-vaelox-border rounded text-[9px] font-semibold">#{tag}</span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                              <span>Score: {entry.score?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEGMENT: SESSION MEMORY */}
            {activeSegment === 'session' && (
              <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, processedSessionEntries.length, (idx) => setSelectedEntry({ entry: processedSessionEntries[idx] }))}>
                <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Session Chronological Stream</span>
                
                {processedSessionEntries.length === 0 ? (
                  <div className="text-center p-8 bg-vaelox-panel/20 border border-dashed border-vaelox-border rounded-xl text-xs text-vaelox-muted italic">
                    No active session stream elements matched.
                  </div>
                ) : (
                  <div className="relative border-l border-vaelox-border/60 pl-4.5 ml-2.5 space-y-5">
                    {processedSessionEntries.map((entry, idx) => {
                      const isSelected = selectedEntry && (selectedEntry.entry as any).id === entry.id;
                      return (
                        <div key={entry.id} className="relative group">
                          {/* Timeline dot */}
                          <div className={cn(
                            "absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full border-2 transition-all",
                            isSelected ? "bg-brand-500 border-brand-400 ring-4 ring-brand-500/15" : "bg-[#050508] border-vaelox-border group-hover:border-vaelox-muted"
                          )} />

                          <div 
                            onClick={() => setSelectedEntry({ entry })}
                            className={cn(
                              "p-3 rounded-xl border cursor-pointer select-none transition-all",
                              isSelected ? "bg-brand-500/10 border-brand-500" : "bg-vaelox-panel/30 border-vaelox-border hover:bg-vaelox-panel/60",
                              focusedIndex === idx && "ring-1 ring-brand-400"
                            )}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-vaelox-muted mb-1.5">
                              <span>{new Date(entry.metadata.lastAccessed).toLocaleTimeString([], { hour12: false })}</span>
                              <span className="font-semibold text-[9px] bg-vaelox-surface px-1.5 py-0.2 rounded border border-vaelox-border">Freq: {entry.metadata.frequency}</span>
                            </div>
                            <h5 className="text-xs font-bold text-vaelox-text font-mono truncate">{entry.key}</h5>
                            <p className="text-xs text-vaelox-muted line-clamp-2 mt-1 leading-relaxed">
                              {typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEGMENT: PROJECT MEMORY (TREE LAYOUT) */}
            {activeSegment === 'project' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Project Files Workspace Registry</span>
                
                {/* Visual Tree */}
                <div className="bg-vaelox-panel/20 border border-vaelox-border rounded-xl p-4 space-y-3 font-mono text-xs">
                  {/* Folders */}
                  {Object.keys(projectTree.folders).map(folderName => {
                    const isCollapsed = collapsedFolders.has(folderName);
                    return (
                      <div key={folderName} className="space-y-1">
                        <div 
                          onClick={() => setCollapsedFolders(prev => {
                            const copy = new Set(prev);
                            if (copy.has(folderName)) copy.delete(folderName);
                            else copy.add(folderName);
                            return copy;
                          })}
                          className="flex items-center gap-2 p-1.5 hover:bg-vaelox-surface/40 rounded-lg cursor-pointer text-vaelox-text select-none"
                        >
                          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-vaelox-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-vaelox-muted" />}
                          {isCollapsed ? <Folder className="w-4 h-4 text-brand-400" /> : <FolderOpen className="w-4 h-4 text-brand-400" />}
                          <span className="font-semibold">{folderName}</span>
                          <span className="text-[10px] text-vaelox-muted font-mono ml-auto">({projectTree.folders[folderName].length} index)</span>
                        </div>

                        {!isCollapsed && (
                          <div className="pl-6 border-l border-vaelox-border/40 ml-3 space-y-1">
                            {projectTree.folders[folderName].map(file => {
                              const isSelected = selectedEntry && (selectedEntry.entry as any).id === file.id;
                              return (
                                <div 
                                  key={file.id}
                                  onClick={() => setSelectedEntry({ entry: file })}
                                  className={cn(
                                    "flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/30",
                                    isSelected && "text-brand-400 bg-brand-500/10 font-medium"
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <FileCode className="w-3.5 h-3.5 text-brand-400" />
                                    <span className="truncate">{file.key.split('/').pop()}</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-400/80 font-mono">Score: {file.score?.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Root Files */}
                  {projectTree.rootFiles.map(file => {
                    const isSelected = selectedEntry && (selectedEntry.entry as any).id === file.id;
                    return (
                      <div 
                        key={file.id}
                        onClick={() => setSelectedEntry({ entry: file })}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-vaelox-surface/30",
                          isSelected ? "text-brand-400 bg-brand-500/10 font-semibold" : "text-vaelox-text"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-brand-400" />
                          <span>{file.key}</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">Score: {file.score?.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEGMENT: GLOBAL RULES */}
            {activeSegment === 'global' && (
              <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, processedGlobalEntries.length, (idx) => setSelectedEntry({ entry: processedGlobalEntries[idx] }))}>
                <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Global Long-term Semantic Rules</span>
                
                {processedGlobalEntries.length === 0 ? (
                  <div className="text-center p-8 bg-vaelox-panel/20 border border-dashed border-vaelox-border rounded-xl text-xs text-vaelox-muted italic">
                    No global rule entries matching query.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {processedGlobalEntries.map((entry, idx) => {
                      const isSelected = selectedEntry && (selectedEntry.entry as any).id === entry.id;
                      return (
                        <div 
                          key={entry.id}
                          onClick={() => setSelectedEntry({ entry })}
                          className={cn(
                            "p-3.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between",
                            isSelected ? "bg-brand-500/10 border-brand-500" : "bg-vaelox-panel/30 border-vaelox-border hover:bg-vaelox-panel/60",
                            focusedIndex === idx && "ring-1 ring-brand-400"
                          )}
                        >
                          <div>
                            <h5 className="text-xs font-bold text-vaelox-text font-mono truncate">{entry.key}</h5>
                            <p className="text-xs text-vaelox-muted line-clamp-3 mt-2 leading-relaxed">
                              {typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-vaelox-border/30 text-[10px] font-mono text-vaelox-muted">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-brand-400" /> #{entry.metadata.tags[0]}</span>
                            <span>Score: {entry.score?.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEGMENT: KNOWLEDGE LAYER */}
            {activeSegment === 'knowledge' && (
              <div className="space-y-4" onKeyDown={(e) => handleKeyDown(e, processedKnowledgeEntries.length, (idx) => setSelectedEntry({ entry: processedKnowledgeEntries[idx] }))}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Knowledge Layers & Sources</span>
                  
                  {/* Category dropdown filter */}
                  <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
                    <span className="text-vaelox-muted text-[11px]">Filter Category:</span>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-vaelox-surface border border-vaelox-border text-vaelox-text rounded-md px-1.5 py-0.5 text-[11px] focus:outline-none cursor-pointer focus:border-brand-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="cat-security">Security Policies</option>
                      <option value="cat-design">Design Token Specs</option>
                    </select>
                  </div>
                </div>

                {processedKnowledgeEntries.length === 0 ? (
                  <div className="text-center p-8 bg-vaelox-panel/20 border border-dashed border-vaelox-border rounded-xl text-xs text-vaelox-muted italic">
                    No knowledge entry cards match chosen category filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {processedKnowledgeEntries.map((entry, idx) => {
                      const isSelected = selectedEntry && (selectedEntry.entry as any).id === entry.id;
                      const title = entry.metadata?.title as string || 'Knowledge Base Node';
                      const confidence = entry.metadata?.confidence as number || 0.9;
                      const relevance = entry.metadata?.relevance as number || 0.85;
                      const sourceUri = entry.sourceId === 'src-docs-1' ? '/docs/memory-design.md' : '/configs/tailwind.config.json';
                      return (
                        <div 
                          key={entry.id}
                          onClick={() => setSelectedEntry({ entry, category: entry.categoryId })}
                          className={cn(
                            "p-3.5 bg-vaelox-panel/30 border rounded-xl cursor-pointer select-none transition-all flex flex-col justify-between hover:bg-vaelox-panel/60",
                            isSelected ? "border-brand-500 ring-2 ring-brand-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)]" : "border-vaelox-border",
                            focusedIndex === idx && "ring-1 ring-brand-400"
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono text-brand-400 font-bold uppercase">{entry.categoryId === 'cat-security' ? 'Security Policy' : 'Design Spec'}</span>
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">Confidence: {(confidence * 100).toFixed(0)}%</span>
                            </div>
                            <h4 className="text-xs font-bold text-vaelox-text">{title}</h4>
                            <p className="text-xs text-vaelox-muted leading-relaxed line-clamp-3">{entry.content}</p>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-vaelox-muted mt-3.5 pt-3 border-t border-vaelox-border/30">
                            <span className="truncate max-w-[150px]">{sourceUri}</span>
                            <span className="text-brand-400 font-bold">Relevance: {relevance.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SEGMENT: CONTEXT BUILDER & PROMPT SANDBOX */}
            {activeSegment === 'preview' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Context Builder & Prompt Assembler Sandbox</span>
                
                <div className="bg-vaelox-panel border border-vaelox-border rounded-xl p-4.5 space-y-4.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vaelox-text font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      Type Test Request Prompt:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sandboxRequest}
                        onChange={(e) => setSandboxRequest(e.target.value)}
                        placeholder="e.g. Build a code file."
                        className="flex-1 bg-vaelox-surface border border-vaelox-border rounded-xl px-3 py-2 text-xs text-vaelox-text focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Sandbox statistics info */}
                  <div className="grid grid-cols-3 gap-2.5 bg-vaelox-surface/50 p-3 rounded-xl border border-vaelox-border/60">
                    <div>
                      <span className="text-vaelox-muted text-[10px] font-mono block">Estimated Size</span>
                      <span className="text-xs font-bold text-vaelox-text block mt-0.5">{sandboxAssembledPrompt.length} chars</span>
                    </div>
                    <div>
                      <span className="text-vaelox-muted text-[10px] font-mono block">Prompt Tokens</span>
                      <span className="text-xs font-bold text-brand-400 block mt-0.5">{sandboxTokens} tokens</span>
                    </div>
                    <div>
                      <span className="text-vaelox-muted text-[10px] font-mono block">Estimated Cost</span>
                      <span className="text-xs font-semibold text-amber-400 block mt-0.5">${(sandboxTokens * 0.0000015).toFixed(6)}</span>
                    </div>
                  </div>

                  {/* Output Prompt box */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Assembled Prompt Context Preview</span>
                    <pre className="p-4 bg-[#08080c] text-xs font-mono rounded-xl overflow-x-auto text-vaelox-muted max-h-96 border border-vaelox-border/40 select-text">
                      {sandboxAssembledPrompt || 'Assembling request, please wait...'}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* SEGMENT: MEMORY STATISTICS AUDIT */}
            {activeSegment === 'stats' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-vaelox-muted uppercase font-mono tracking-wider block">Vaelox Memory Audit Analytics</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-vaelox-panel border border-vaelox-border rounded-xl p-4.5 space-y-3.5">
                    <h5 className="text-xs font-bold text-vaelox-text font-mono flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-brand-400" />
                      Cell Usage Distribution
                    </h5>
                    
                    <div className="space-y-2.5 font-mono text-[11px] text-vaelox-muted">
                      <div className="flex items-center justify-between">
                        <span>Working Memory nodes</span>
                        <span className="text-vaelox-text font-bold">{stats.workingCount}</span>
                      </div>
                      <div className="w-full bg-vaelox-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full" style={{ width: `${(stats.workingCount / (stats.workingCount + stats.sessionCount + stats.projectCount + stats.globalCount || 1)) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Session Stream entries</span>
                        <span className="text-vaelox-text font-bold">{stats.sessionCount}</span>
                      </div>
                      <div className="w-full bg-vaelox-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.sessionCount / (stats.workingCount + stats.sessionCount + stats.projectCount + stats.globalCount || 1)) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Project Index records</span>
                        <span className="text-vaelox-text font-bold">{stats.projectCount}</span>
                      </div>
                      <div className="w-full bg-vaelox-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(stats.projectCount / (stats.workingCount + stats.sessionCount + stats.projectCount + stats.globalCount || 1)) * 100}%` }} />
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Global semantic rules</span>
                        <span className="text-vaelox-text font-bold">{stats.globalCount}</span>
                      </div>
                      <div className="w-full bg-vaelox-surface h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full" style={{ width: `${(stats.globalCount / (stats.workingCount + stats.sessionCount + stats.projectCount + stats.globalCount || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-vaelox-panel border border-vaelox-border rounded-xl p-4.5 space-y-3.5">
                    <h5 className="text-xs font-bold text-vaelox-text font-mono flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-brand-400" />
                      Status Metrics
                    </h5>

                    <div className="space-y-3 font-mono text-xs text-vaelox-muted">
                      <div className="flex items-center justify-between">
                        <span>Total token estimation:</span>
                        <span className="text-brand-400 font-bold">{stats.totalTokens}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Compressed events triggered:</span>
                        <span className="text-emerald-400 font-semibold">{stats.compressedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Archived cells pool:</span>
                        <span className="text-amber-400 font-semibold">{stats.archivedCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Average relevancy score:</span>
                        <span className="text-vaelox-text font-bold">{stats.avgScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR PANEL: NODE DETAIL SNAPSHOT OR EXTREME TRACE */}
          {selectedEntry && (
            <div className="w-80 border-l border-vaelox-border bg-vaelox-panel/90 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden relative z-20">
              <div className="p-4 border-b border-vaelox-border shrink-0 flex items-center justify-between bg-vaelox-surface/30">
                <span className="text-[10px] font-bold text-vaelox-muted uppercase tracking-wider block font-mono">Cell Inspection</span>
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="text-vaelox-muted hover:text-vaelox-text p-1 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 select-text">
                <div>
                  <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Key Identity</span>
                  <div className="text-xs font-bold text-vaelox-text font-mono break-all">{(selectedEntry.entry as any).key || (selectedEntry.entry as any).metadata?.title || selectedEntry.entry.id}</div>
                </div>

                {/* Importance Slider bar style indicator */}
                <div>
                  <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-1">Importance Weight</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-vaelox-surface h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full rounded-full" style={{ width: `${(selectedEntry.entry.metadata?.importance as number || 0.5) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand-400">{(selectedEntry.entry.metadata?.importance as number || 0.5).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-vaelox-border/50">
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Read Frequency</span>
                    <span className="text-xs font-bold text-vaelox-text font-mono">{selectedEntry.entry.metadata?.frequency as number || 1} read</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Embedding Vector</span>
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">768-D [Sync]</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-vaelox-border/50">
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Compression Status</span>
                    <span className="text-[10px] font-semibold text-sky-400 font-mono">Original</span>
                  </div>
                  <div>
                    <span className="text-vaelox-muted text-[10px] font-mono uppercase block mb-0.5">Archive Status</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      selectedEntry.entry.metadata?.archived ? "text-amber-400" : "text-vaelox-muted"
                    )}>
                      {selectedEntry.entry.metadata?.archived ? 'Archived' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Actions toggles block */}
                <div className="flex gap-2 pt-3 border-t border-vaelox-border/50 shrink-0">
                  <button
                    onClick={() => handleArchiveToggle(selectedEntry.entry as MemoryEntry)}
                    className={cn(
                      "flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-colors text-center flex items-center justify-center gap-1",
                      selectedEntry.entry.metadata?.archived 
                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20" 
                        : "bg-vaelox-surface border-vaelox-border hover:bg-vaelox-surface/80 text-vaelox-text"
                    )}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{selectedEntry.entry.metadata?.archived ? 'Unarchive' : 'Archive'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteEntry(selectedEntry.entry as MemoryEntry)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Substantive content */}
                <div className="space-y-1.5 pt-3 border-t border-vaelox-border/50">
                  <span className="text-vaelox-muted text-[10px] font-mono uppercase block">Stored Data payload</span>
                  <div className="p-3 bg-vaelox-surface border border-vaelox-border rounded-xl text-xs font-mono text-vaelox-text leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {(selectedEntry.entry as any).value !== undefined 
                      ? (typeof (selectedEntry.entry as any).value === 'string' ? (selectedEntry.entry as any).value : JSON.stringify((selectedEntry.entry as any).value, null, 2))
                      : (selectedEntry.entry as any).content}
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-vaelox-border/50 text-[10px] font-mono text-vaelox-muted">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(selectedEntry.entry.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Updated:</span>
                    <span>{new Date(selectedEntry.entry.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
