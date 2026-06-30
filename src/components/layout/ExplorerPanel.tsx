'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace, FileNode } from '@/contexts/WorkspaceContext';
import { useLayout } from '@/contexts/LayoutContext';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FolderPlus, 
  RefreshCw, 
  Star, 
  Pin, 
  Trash2, 
  Copy, 
  Edit, 
  MoreVertical, 
  Search, 
  Clock, 
  ExternalLink,
  ChevronUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Custom hook to close elements when clicking outside
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export function ExplorerPanel() {
  const {
    files,
    loading,
    error,
    refreshWorkspace,
    activeFile,
    openFile,
    openFolderPaths,
    toggleFolder,
    setFolderOpen,
    createNode,
    renameNode,
    deleteNode,
    duplicateNode,
    moveNode,
    favorites,
    toggleFavorite,
    pinnedFolders,
    togglePinFolder,
    recentFiles,
    searchQuery,
    setSearchQuery
  } = useWorkspace();

  const { isMobile, setDrawerOpen } = useLayout();

  // Selected node for keyboard navigation
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Inline creation states
  const [creationState, setCreationState] = useState<{
    parentPath: string; // empty string for root
    type: 'file' | 'directory';
    active: boolean;
  }>({ parentPath: '', type: 'file', active: false });
  const [creationName, setCreationName] = useState<string>('');
  const creationInputRef = useRef<HTMLInputElement>(null);

  // Inline renaming state
  const [renameState, setRenameState] = useState<{
    path: string;
    active: boolean;
  }>({ path: '', active: false });
  const [renameName, setRenameName] = useState<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    path: string;
    type: 'file' | 'directory';
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Scroll Position Saver
  const listContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    // Restore scroll position
    const savedScroll = localStorage.getItem('vaelox-explorer-scroll');
    if (savedScroll) {
      container.scrollTop = parseInt(savedScroll, 10);
    }

    const handleScroll = () => {
      localStorage.setItem('vaelox-explorer-scroll', container.scrollTop.toString());
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loading]);

  // Handle outside clicks for context menu and inline creation/renaming
  useClickOutside(contextMenuRef, () => setContextMenu(null));

  useEffect(() => {
    if (creationState.active && creationInputRef.current) {
      creationInputRef.current.focus();
    }
  }, [creationState.active]);

  useEffect(() => {
    if (renameState.active && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renameState.active]);

  // Context Menu Helpers
  const handleContextMenu = (e: React.MouseEvent, pathStr: string, type: 'file' | 'directory') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPath(pathStr);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      path: pathStr,
      type
    });
  };

  // Keyboard Navigation Helpers
  // Flatten tree to visible nodes list
  const getVisibleNodes = useMemo(() => {
    const list: { path: string; type: 'file' | 'directory' }[] = [];
    const traverse = (nodes: FileNode[]) => {
      for (const node of nodes) {
        list.push({ path: node.path, type: node.type });
        if (node.type === 'directory' && openFolderPaths.includes(node.path) && node.children) {
          traverse(node.children);
        }
      }
    };
    traverse(files);
    return list;
  }, [files, openFolderPaths]);

  const scrollToNode = useCallback((pathStr: string) => {
    const element = document.getElementById(`node-${pathStr.replace(/[^a-zA-Z0-9]/g, '-')}`);
    if (element && listContainerRef.current) {
      const containerRect = listContainerRef.current.getBoundingClientRect();
      const elemRect = element.getBoundingClientRect();
      if (elemRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ block: 'end', behavior: 'smooth' });
      } else if (elemRect.top < containerRect.top) {
        element.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (creationState.active || renameState.active || contextMenu?.visible) return;

      const currentIndex = getVisibleNodes.findIndex(n => n.path === selectedPath);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, getVisibleNodes.length - 1);
        if (nextIndex >= 0 && getVisibleNodes[nextIndex]) {
          setSelectedPath(getVisibleNodes[nextIndex].path);
          scrollToNode(getVisibleNodes[nextIndex].path);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex >= 0 && getVisibleNodes[prevIndex]) {
          setSelectedPath(getVisibleNodes[prevIndex].path);
          scrollToNode(getVisibleNodes[prevIndex].path);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedPath) {
          const selectedNode = getVisibleNodes.find(n => n.path === selectedPath);
          if (selectedNode) {
            if (selectedNode.type === 'file') {
              openFile(selectedNode.path);
              if (isMobile) setDrawerOpen(false);
            } else {
              toggleFolder(selectedNode.path);
            }
          }
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (selectedPath) {
          const selectedNode = getVisibleNodes.find(n => n.path === selectedPath);
          if (selectedNode && selectedNode.type === 'directory') {
            toggleFolder(selectedNode.path);
          }
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedPath) {
          if (confirm(`Are you sure you want to delete ${selectedPath}?`)) {
            deleteNode(selectedPath);
            setSelectedPath(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [getVisibleNodes, selectedPath, creationState, renameState, contextMenu, scrollToNode, deleteNode, isMobile, openFile, setDrawerOpen, toggleFolder]);

  // Drag and Drop State
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  // File Creator Submit
  const handleCreationSubmit = async () => {
    if (!creationName.trim()) {
      setCreationState({ parentPath: '', type: 'file', active: false });
      return;
    }
    const fullPath = creationState.parentPath 
      ? `${creationState.parentPath}/${creationName.trim()}` 
      : creationName.trim();
    
    await createNode(fullPath, creationState.type);
    setCreationName('');
    setCreationState({ parentPath: '', type: 'file', active: false });
  };

  // Rename Submit
  const handleRenameSubmit = async () => {
    if (!renameName.trim() || renameName.trim() === renameState.path.substring(renameState.path.lastIndexOf('/') + 1)) {
      setRenameState({ path: '', active: false });
      return;
    }
    const parentDir = renameState.path.includes('/') 
      ? renameState.path.substring(0, renameState.path.lastIndexOf('/')) 
      : '';
    const newFullPath = parentDir ? `${parentDir}/${renameName.trim()}` : renameName.trim();
    
    await renameNode(renameState.path, newFullPath);
    setRenameName('');
    setRenameState({ path: '', active: false });
  };

  // Get dynamic icons based on suffix
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-brand-500 shrink-0" />;
      case 'json':
      case 'lock':
        return <File className="w-4 h-4 text-yellow-500 shrink-0" />;
      case 'css':
        return <File className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'md':
        return <File className="w-4 h-4 text-emerald-400 shrink-0" />;
      default:
        return <File className="w-4 h-4 text-vaelox-muted shrink-0" />;
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: FileNode, depth = 0) => {
    const isFolder = node.type === 'directory';
    const isOpen = openFolderPaths.includes(node.path);
    const isSelected = selectedPath === node.path;
    const isActive = activeFile === node.path;
    const isDragOver = dragOverPath === node.path;

    // Filter tree matching search query
    if (searchQuery) {
      const matchSearch = (n: FileNode): boolean => {
        if (n.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        if (n.children) {
          return n.children.some(child => matchSearch(child));
        }
        return false;
      };
      if (!matchSearch(node)) return null;
    }

    return (
      <div key={node.path} className="flex flex-col select-none" id={`node-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}>
        {/* Actual Row */}
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', node.path);
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            if (isFolder) {
              e.preventDefault();
              setDragOverPath(node.path);
            }
            e.stopPropagation();
          }}
          onDragLeave={() => {
            if (dragOverPath === node.path) {
              setDragOverPath(null);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverPath(null);
            const sourcePath = e.dataTransfer.getData('text/plain');
            if (sourcePath && sourcePath !== node.path) {
              moveNode(sourcePath, node.path);
            }
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPath(node.path);
            if (isFolder) {
              toggleFolder(node.path);
            } else {
              openFile(node.path);
              if (isMobile) setDrawerOpen(false);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node.path, node.type)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className={cn(
            "h-8 flex items-center justify-between rounded-lg cursor-pointer transition-all duration-150 relative group",
            isSelected ? "bg-vaelox-surface/60 border-l-2 border-brand-500" : "hover:bg-vaelox-surface/20 border-l-2 border-transparent",
            isActive ? "text-brand-600 dark:text-brand-400 font-bold bg-brand-500/5" : "text-vaelox-text",
            isDragOver && "bg-brand-500/10 border-2 border-dashed border-brand-500"
          )}
        >
          <div className="flex items-center gap-1.5 overflow-hidden flex-1 py-1 pr-2">
            {/* Folder Chevron */}
            {isFolder ? (
              <span className="text-vaelox-muted group-hover:text-vaelox-text">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              </span>
            ) : (
              <span className="w-3.5 h-3.5 shrink-0" />
            )}

            {/* Main Icon */}
            {isFolder ? (
              isOpen 
                ? <FolderOpen className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" /> 
                : <Folder className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            ) : (
              getFileIcon(node.name)
            )}

            {/* Node Name with highlight */}
            {renameState.active && renameState.path === node.path ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setRenameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setRenameState({ path: '', active: false });
                }}
                onBlur={handleRenameSubmit}
                className="flex-1 min-w-0 bg-vaelox-panel border border-brand-500 rounded px-1 text-xs text-vaelox-text outline-none"
              />
            ) : (
              <span className="text-xs truncate">
                {searchQuery ? (
                  highlightText(node.name, searchQuery)
                ) : (
                  node.name
                )}
              </span>
            )}
          </div>

          {/* Quick Context Action Dots */}
          <button
            onClick={(e) => handleContextMenu(e, node.path, node.type)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/50 cursor-pointer outline-none shrink-0"
            aria-label="Actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Child Subtree creation overlay */}
        {creationState.active && creationState.parentPath === node.path && (
          <div 
            style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
            className="h-8 flex items-center gap-1.5 text-vaelox-muted bg-vaelox-surface/5"
          >
            {creationState.type === 'directory' ? (
              <Folder className="w-4 h-4 text-brand-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-vaelox-muted shrink-0" />
            )}
            <input
              ref={creationInputRef}
              type="text"
              placeholder={creationState.type === 'directory' ? "New Folder..." : "New File..."}
              value={creationName}
              onChange={(e) => setCreationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreationSubmit();
                if (e.key === 'Escape') setCreationState({ parentPath: '', type: 'file', active: false });
              }}
              onBlur={handleCreationSubmit}
              className="flex-1 min-w-0 bg-vaelox-panel border border-brand-500 rounded px-1.5 py-0.5 text-xs text-vaelox-text outline-none"
            />
          </div>
        )}

        {/* Children Subtree */}
        {isFolder && isOpen && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const highlightText = (text: string, highlight: string) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <mark key={i} className="bg-yellow-500/30 text-vaelox-text rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </span>
    );
  };

  // Top header quick actions
  const triggerRootCreation = (type: 'file' | 'directory') => {
    setCreationState({
      parentPath: '',
      type,
      active: true
    });
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-transparent text-vaelox-text" id="explorer-sidebar-panel">
      {/* Search Filter Input */}
      <div className="mb-3 shrink-0 relative" id="explorer-search-wrapper">
        <input
          type="text"
          placeholder="Filter workspace files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-vaelox-surface border border-vaelox-border rounded-lg outline-none focus:ring-1 focus:ring-brand-500 text-vaelox-text"
        />
        <Search className="w-3.5 h-3.5 text-vaelox-muted absolute left-3 top-2.5" />
      </div>

      {/* Explorer Tool Buttons */}
      <div className="flex items-center justify-between py-1 border-b border-vaelox-border shrink-0 select-none mb-2 text-vaelox-muted" id="explorer-actions-header">
        <span className="text-[10px] font-bold uppercase tracking-wider">FILES & STRUCTURE</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => triggerRootCreation('file')}
            className="p-1.5 rounded-lg hover:bg-vaelox-surface hover:text-vaelox-text transition-colors cursor-pointer outline-none"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => triggerRootCreation('directory')}
            className="p-1.5 rounded-lg hover:bg-vaelox-surface hover:text-vaelox-text transition-colors cursor-pointer outline-none"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={refreshWorkspace}
            className="p-1.5 rounded-lg hover:bg-vaelox-surface hover:text-vaelox-text transition-colors cursor-pointer outline-none"
            title="Refresh Explorer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Primary Scroll Container */}
      <div 
        ref={listContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-1 scrollbar-thin"
        id="explorer-scroll-container"
      >
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="space-y-1" id="explorer-favorites-sec">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-500 select-none px-2 py-0.5">
              <Star className="w-3 h-3 fill-amber-500 stroke-amber-500 shrink-0" />
              <span>Favorite Files</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {favorites.map((favPath) => {
                const name = favPath.substring(favPath.lastIndexOf('/') + 1);
                const isActive = activeFile === favPath;
                return (
                  <div
                    key={favPath}
                    onClick={() => {
                      openFile(favPath);
                      if (isMobile) setDrawerOpen(false);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, favPath, 'file')}
                    className={cn(
                      "h-7 flex items-center justify-between rounded-md cursor-pointer hover:bg-vaelox-surface/20 px-2 text-xs",
                      isActive ? "text-brand-600 dark:text-brand-400 font-semibold" : "text-vaelox-text/80"
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {getFileIcon(name)}
                      <span className="truncate">{name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(favPath);
                      }}
                      className="p-0.5 rounded hover:bg-vaelox-surface text-amber-500"
                      title="Remove Favorite"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned Folders Section */}
        {pinnedFolders.length > 0 && (
          <div className="space-y-1" id="explorer-pinned-sec">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-500 select-none px-2 py-0.5">
              <Pin className="w-3 h-3 fill-brand-500 stroke-brand-500 shrink-0" />
              <span>Pinned Folders</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {pinnedFolders.map((pinPath) => {
                const name = pinPath.substring(pinPath.lastIndexOf('/') + 1);
                return (
                  <div
                    key={pinPath}
                    onClick={() => {
                      setFolderOpen(pinPath, true);
                      setSelectedPath(pinPath);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, pinPath, 'directory')}
                    className="h-7 flex items-center justify-between rounded-md cursor-pointer hover:bg-vaelox-surface/20 px-2 text-xs text-vaelox-text/80"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Folder className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span className="truncate">{name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinFolder(pinPath);
                      }}
                      className="p-0.5 rounded hover:bg-vaelox-surface text-brand-500"
                      title="Unpin Folder"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Root Node Creation Overlay */}
        {creationState.active && creationState.parentPath === '' && (
          <div className="h-8 flex items-center gap-1.5 text-vaelox-muted bg-vaelox-surface/5 px-2 rounded">
            {creationState.type === 'directory' ? (
              <Folder className="w-4 h-4 text-brand-500 shrink-0" />
            ) : (
              <File className="w-4 h-4 text-vaelox-muted shrink-0" />
            )}
            <input
              ref={creationInputRef}
              type="text"
              placeholder={creationState.type === 'directory' ? "New Folder..." : "New File..."}
              value={creationName}
              onChange={(e) => setCreationName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreationSubmit();
                if (e.key === 'Escape') setCreationState({ parentPath: '', type: 'file', active: false });
              }}
              onBlur={handleCreationSubmit}
              className="flex-1 min-w-0 bg-vaelox-panel border border-brand-500 rounded px-1.5 py-0.5 text-xs text-vaelox-text outline-none"
            />
          </div>
        )}

        {/* Main File Tree Area */}
        <div className="flex flex-col gap-0.5" id="explorer-main-tree">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-vaelox-muted text-xs gap-2 select-none">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
              <span>Scanning workspace...</span>
            </div>
          ) : error ? (
            <div className="p-3 text-red-500 text-xs border border-red-500/20 bg-red-500/5 rounded-lg select-none">
              {error}
            </div>
          ) : files.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-vaelox-border rounded-lg text-center text-xs text-vaelox-muted flex flex-col gap-2 select-none">
              <span>No workspace folders opened.</span>
              <button 
                onClick={refreshWorkspace}
                className="mx-auto px-3 py-1 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-500 transition-colors"
              >
                Open Workspace
              </button>
            </div>
          ) : (
            files.map(node => renderTreeNode(node))
          )}
        </div>

        {/* Recent Files Section */}
        {recentFiles.length > 0 && (
          <div className="pt-2 border-t border-vaelox-border/40" id="explorer-recents-sec">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-vaelox-muted select-none px-2 py-0.5 mb-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span>Recent Files</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {recentFiles.map((recPath) => {
                const name = recPath.substring(recPath.lastIndexOf('/') + 1);
                const isActive = activeFile === recPath;
                return (
                  <div
                    key={recPath}
                    onClick={() => {
                      openFile(recPath);
                      if (isMobile) setDrawerOpen(false);
                    }}
                    className={cn(
                      "h-7 flex items-center justify-between rounded-md cursor-pointer hover:bg-vaelox-surface/20 px-2 text-xs",
                      isActive ? "text-brand-600 dark:text-brand-400 font-semibold" : "text-vaelox-text/80"
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {getFileIcon(name)}
                      <span className="truncate">{name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating absolute context menu */}
      <AnimatePresence>
        {contextMenu?.visible && (
          <div
            ref={contextMenuRef}
            style={{ 
              top: `${Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : contextMenu.y)}px`, 
              left: `${Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 180 : contextMenu.x)}px` 
            }}
            className="fixed z-50 w-44 bg-vaelox-panel/95 backdrop-blur-md border border-vaelox-border shadow-2xl rounded-xl p-1 flex flex-col font-sans select-none"
            id="explorer-context-menu"
          >
            {contextMenu.type === 'directory' ? (
              <>
                <button
                  onClick={() => {
                    setCreationState({ parentPath: contextMenu.path, type: 'file', active: true });
                    setContextMenu(null);
                  }}
                  className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-vaelox-muted" />
                  <span>New File</span>
                </button>
                <button
                  onClick={() => {
                    setCreationState({ parentPath: contextMenu.path, type: 'directory', active: true });
                    setContextMenu(null);
                  }}
                  className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-vaelox-muted" />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => {
                    togglePinFolder(contextMenu.path);
                    setContextMenu(null);
                  }}
                  className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
                >
                  <Pin className="w-3.5 h-3.5 text-vaelox-muted" />
                  <span>{pinnedFolders.includes(contextMenu.path) ? 'Unpin Folder' : 'Pin Folder'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    toggleFavorite(contextMenu.path);
                    setContextMenu(null);
                  }}
                  className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-vaelox-muted" />
                  <span>{favorites.includes(contextMenu.path) ? 'Remove Favorite' : 'Add to Favorites'}</span>
                </button>
                <button
                  onClick={() => {
                    const parentDir = contextMenu.path.includes('/') ? contextMenu.path.substring(0, contextMenu.path.lastIndexOf('/')) : '';
                    const baseName = contextMenu.path.substring(contextMenu.path.lastIndexOf('/') + 1);
                    const extIndex = baseName.lastIndexOf('.');
                    const namePart = extIndex !== -1 ? baseName.substring(0, extIndex) : baseName;
                    const extPart = extIndex !== -1 ? baseName.substring(extIndex) : '';
                    const destName = `${namePart}_copy${extPart}`;
                    const destPath = parentDir ? `${parentDir}/${destName}` : destName;
                    
                    duplicateNode(contextMenu.path, destPath);
                    setContextMenu(null);
                  }}
                  className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-vaelox-muted" />
                  <span>Duplicate</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setRenameState({ path: contextMenu.path, active: true });
                setRenameName(contextMenu.path.substring(contextMenu.path.lastIndexOf('/') + 1));
                setContextMenu(null);
              }}
              className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-vaelox-muted" />
              <span>Rename</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.path);
                alert(`Copied: ${contextMenu.path}`);
                setContextMenu(null);
              }}
              className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-vaelox-text hover:bg-vaelox-surface text-left cursor-pointer transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-vaelox-muted" />
              <span>Copy Path</span>
            </button>

            <div className="border-t border-vaelox-border/60 my-1" />

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${contextMenu.path}?`)) {
                  deleteNode(contextMenu.path);
                }
                setContextMenu(null);
              }}
              className="h-8 flex items-center gap-2 px-2.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500/80" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
