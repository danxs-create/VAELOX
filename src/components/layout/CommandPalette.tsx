'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useWorkspace, FileNode } from '@/contexts/WorkspaceContext';
import { useTheme } from 'next-themes';
import { Search, Terminal, FileCode, Check, AlertCircle, File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PaletteItem {
  id: string;
  type: 'command' | 'file';
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

export function CommandPalette() {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen,
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    setActiveActivity,
    setSidebarState,
    setRightPanelState,
    setBottomPanelState
  } = useLayout();
  
  const { files, openFile } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // List of interactive system commands
  const commands = useMemo<PaletteItem[]>(() => [
    {
      id: 'cmd-theme',
      type: 'command',
      title: 'Toggle Color Theme',
      subtitle: `Switch current workspace mode to ${theme === 'dark' ? 'light' : 'dark'}`,
      icon: Terminal,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    },
    {
      id: 'cmd-sidebar',
      type: 'command',
      title: 'View: Toggle Sidebar Visibility',
      subtitle: 'Show or collapse the active left utility bar',
      icon: Terminal,
      action: () => toggleSidebar()
    },
    {
      id: 'cmd-terminal',
      type: 'command',
      title: 'View: Toggle Terminal Output Panel',
      subtitle: 'Open or close the bottom integrated terminal',
      icon: Terminal,
      action: () => toggleBottomPanel()
    },
    {
      id: 'cmd-chat',
      type: 'command',
      title: 'View: Toggle AI Chat Panel',
      subtitle: 'Engage with the persistent Vaelox intelligent companion',
      icon: Terminal,
      action: () => toggleRightPanel()
    },
    {
      id: 'cmd-open-explorer',
      type: 'command',
      title: 'Workspace: Open File Explorer',
      subtitle: 'Navigate project directory and code assets',
      icon: Terminal,
      action: () => {
        setActiveActivity('explorer');
        setSidebarState('open');
      }
    },
    {
      id: 'cmd-open-search',
      type: 'command',
      title: 'Workspace: Global Code Search',
      subtitle: 'Run regex search query across workspace files',
      icon: Terminal,
      action: () => {
        setActiveActivity('search');
        setSidebarState('open');
      }
    },
    {
      id: 'cmd-open-git',
      type: 'command',
      title: 'Workspace: Open Git Integration',
      subtitle: 'View staged modifications, diffs and branches',
      icon: Terminal,
      action: () => {
        setActiveActivity('source-control');
        setSidebarState('open');
      }
    },
    {
      id: 'cmd-open-ai',
      type: 'command',
      title: 'AI: Focus Vaelox Assistant',
      subtitle: 'Make AI Chat the active interaction window',
      icon: Terminal,
      action: () => {
        setRightPanelState('open');
      }
    },
    {
      id: 'cmd-open-extensions',
      type: 'command',
      title: 'Extensions: Open Marketplace',
      subtitle: 'Search and activate workspace custom modules',
      icon: Terminal,
      action: () => {
        setActiveActivity('extensions');
        setSidebarState('open');
      }
    },
    {
      id: 'cmd-open-workflow',
      type: 'command',
      title: 'Workflow: Open Pipelines Panel',
      subtitle: 'Execute task runs and custom configurations',
      icon: Terminal,
      action: () => {
        setActiveActivity('workflow');
        setSidebarState('open');
      }
    },
  ], [theme, setTheme, toggleSidebar, toggleBottomPanel, toggleRightPanel, setActiveActivity, setSidebarState, setRightPanelState]);

  // Combine files with placeholder actions so they can be "selected"
  const items = useMemo<PaletteItem[]>(() => {
    const flattenTree = (nodes: FileNode[], list: PaletteItem[] = []) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          list.push({
            id: `file-${node.path}`,
            type: 'file',
            title: node.path,
            subtitle: `Workspace file • ${(node.size || 0) > 1024 ? Math.round((node.size || 0)/1024) + ' KB' : (node.size || 0) + ' B'}`,
            icon: node.name.match(/\.(ts|tsx|js|jsx)$/) ? FileCode : File,
            action: () => {
              openFile(node.path);
              setActiveActivity('explorer');
              setSidebarState('open');
            }
          });
        }
        if (node.children) {
          flattenTree(node.children, list);
        }
      }
      return list;
    };
    
    const fileItems = flattenTree(files);
    return [...commands, ...fileItems];
  }, [commands, files, openFile, setActiveActivity, setSidebarState]);

  // Filter items based on user search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const query = search.toLowerCase();
    return items.filter(
      item => 
        item.title.toLowerCase().includes(query) || 
        (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
  }, [search, items]);

  // Handle hotkeys (Ctrl+P, Cmd+P, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        
        // Save current active element to restore focus later
        if (!commandPaletteOpen) {
          triggerRef.current = document.activeElement as HTMLElement;
        }
        
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Auto-focus input on open and safely clear search on close to avoid cascading renders
  useEffect(() => {
    if (commandPaletteOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setSearch('');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [commandPaletteOpen]);

  // Handle search field keyboard navigation and input updates directly to prevent state cascading renders
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setCommandPaletteOpen(false);
        triggerRef.current?.focus();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const container = listRef.current;
      const activeElement = container.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeElement.offsetTop;
        const elemBottom = elemTop + activeElement.clientHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [selectedIndex]);

  // Helper to render title with matched text highlighted
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={index} className="bg-brand-500/30 text-brand-600 dark:text-brand-400 font-semibold rounded-[2px] px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-xl bg-vaelox-panel border border-vaelox-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[480px]"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command Palette"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 py-3 bg-vaelox-surface/30 border-b border-vaelox-border gap-3 shrink-0">
              <Search className="w-5 h-5 text-vaelox-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or file path..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-vaelox-text placeholder:text-vaelox-muted focus:ring-0"
                aria-label="Search files and commands"
              />
              <div className="text-[10px] font-mono px-1.5 py-0.5 bg-vaelox-surface border border-vaelox-border text-vaelox-muted rounded shadow-sm shrink-0">
                ESC
              </div>
            </div>

            {/* Content List */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-2"
              role="listbox"
              aria-label="Suggestions"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-vaelox-muted flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 opacity-40 text-vaelox-muted" />
                  <span className="text-sm font-medium">No results found for &quot;{search}&quot;</span>
                  <span className="text-xs">Verify your search criteria and try again.</span>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setCommandPaletteOpen(false);
                        triggerRef.current?.focus();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full text-left flex items-center px-3 py-2.5 rounded-lg transition-colors gap-3 outline-none cursor-pointer",
                        isSelected ? "bg-brand-600 text-white" : "text-vaelox-text hover:bg-vaelox-surface"
                      )}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 stroke-[1.5]", isSelected ? "text-white" : "text-vaelox-muted")} />
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-xs font-semibold leading-normal truncate">
                          {isSelected ? item.title : renderHighlightedText(item.title, search)}
                        </span>
                        {item.subtitle && (
                          <span className={cn(
                            "text-[10px] leading-normal truncate mt-0.5",
                            isSelected ? "text-brand-100" : "text-vaelox-muted"
                          )}>
                            {isSelected ? item.subtitle : renderHighlightedText(item.subtitle, search)}
                          </span>
                        )}
                      </div>
                      {item.type === 'command' && (
                        <div className={cn(
                          "text-[9px] font-semibold font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase shrink-0",
                          isSelected ? "bg-white/20 border-white/20 text-white" : "bg-vaelox-surface border-vaelox-border text-vaelox-muted"
                        )}>
                          Command
                        </div>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-white shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Status */}
            <div className="px-4 py-2 bg-vaelox-surface border-t border-vaelox-border text-[10px] text-vaelox-muted flex items-center justify-between shrink-0 font-mono select-none">
              <div className="flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <div>
                <span>Total: {filteredItems.length} items</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
