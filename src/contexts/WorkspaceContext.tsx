/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { globalEventBus } from '@/core/events/globalEventBus';
import { PermissionManager } from '@/core/permissions/PermissionManager';
import { Permission } from '@/core/constants/permissions';
import { WorkspaceManagerImpl } from '@/core/workspace/WorkspaceManagerImpl';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modifiedTime?: number;
}

interface WorkspaceContextType {
  files: FileNode[];
  loading: boolean;
  error: string | null;
  refreshWorkspace: () => Promise<void>;
  
  // Tab and Active File Management
  activeFile: string | null;
  activeFileContent: string | null; // For backward compat, points to active cache
  openTabs: string[];
  setOpenTabs: (tabs: string[]) => void;
  pinnedTabs: string[];
  togglePinTab: (path: string) => void;
  activeTab: string | null;
  fileContentsCache: Record<string, string>;
  dirtyFiles: Set<string>;
  openFile: (path: string) => Promise<void>;
  closeTab: (path: string) => void;
  setActiveTab: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  saveActiveFile: (content?: string) => Promise<boolean>;
  
  // Folder expansion
  openFolderPaths: string[];
  toggleFolder: (path: string) => void;
  setFolderOpen: (path: string, isOpen: boolean) => void;

  // File operations
  createNode: (nodePath: string, type: 'file' | 'directory', content?: string) => Promise<boolean>;
  renameNode: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteNode: (nodePath: string) => Promise<boolean>;
  duplicateNode: (source: string, destination: string) => Promise<boolean>;
  moveNode: (source: string, destination: string) => Promise<boolean>;

  // Vaelox Identity Features
  favorites: string[];
  toggleFavorite: (path: string) => void;
  pinnedFolders: string[];
  togglePinFolder: (path: string) => void;
  recentFiles: string[];
  clearRecentFiles: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  OPEN_FOLDERS: 'vaelox-explorer-open-folders',
  ACTIVE_FILE: 'vaelox-explorer-active-file',
  OPEN_TABS: 'vaelox-explorer-open-tabs',
  FAVORITES: 'vaelox-explorer-favorites',
  PIN_FOLDERS: 'vaelox-explorer-pinned-folders',
  RECENT_FILES: 'vaelox-explorer-recent-files',
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active file / editor states
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [pinnedTabs, setPinnedTabs] = useState<string[]>([]);
  const [activeTab, setActiveTabState] = useState<string | null>(null);

  // Cache and dirty state
  const [fileContentsCache, setFileContentsCache] = useState<Record<string, string>>({});
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());

  const togglePinTab = (path: string) => {
    setPinnedTabs(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      }
      return [...prev, path];
    });
  };

  // Folder and Pin management states
  const [openFolderPaths, setOpenFolderPaths] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pinnedFolders, setPinnedFolders] = useState<string[]>([]);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  // Workspace Manager reference
  const workspaceManager = new WorkspaceManagerImpl();

  // Load persistent states on mount
  useEffect(() => {
    try {
      const savedFolders = localStorage.getItem(STORAGE_KEYS.OPEN_FOLDERS);
      if (savedFolders) setOpenFolderPaths(JSON.parse(savedFolders));

      const savedTabs = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
      if (savedTabs) setOpenTabs(JSON.parse(savedTabs));

      const savedActiveFile = localStorage.getItem(STORAGE_KEYS.ACTIVE_FILE);
      if (savedActiveFile) {
        setActiveFile(savedActiveFile);
        setActiveTabState(savedActiveFile);
      }

      const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedPins = localStorage.getItem(STORAGE_KEYS.PIN_FOLDERS);
      if (savedPins) setPinnedFolders(JSON.parse(savedPins));

      const savedRecents = localStorage.getItem(STORAGE_KEYS.RECENT_FILES);
      if (savedRecents) setRecentFiles(JSON.parse(savedRecents));
    } catch (e) {
      console.error('Failed to restore persistent workspace state:', e);
    }
  }, []);

  // Fetch initial file tree
  const refreshWorkspace = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace');
      if (!res.ok) throw new Error('Failed to load workspace files');
      const data = await res.json();
      setFiles(data.tree || []);
      setError(null);
      
      // Emit event
      globalEventBus.publish('workspace.refresh', {
        id: Math.random().toString(),
        name: 'workspace.refresh',
        timestamp: Date.now(),
        payload: { fileCount: data.tree?.length || 0 },
        source: 'WorkspaceProvider',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while scanning workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  // Fetch file content on file activation
  useEffect(() => {
    if (!activeFile) {
      setActiveFileContent(null);
      return;
    }

    if (fileContentsCache[activeFile] !== undefined) {
      setActiveFileContent(fileContentsCache[activeFile]);
      return;
    }

    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/workspace?action=read&path=${encodeURIComponent(activeFile)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContentsCache(prev => ({ ...prev, [activeFile]: data.content }));
          setActiveFileContent(data.content);
        } else {
          setActiveFileContent('// Failed to load file content.');
        }
      } catch (e) {
        setActiveFileContent('// Error loading file.');
      }
    };

    fetchContent();
  }, [activeFile, fileContentsCache]);

  const updateFileContent = (path: string, content: string) => {
    setFileContentsCache(prev => ({ ...prev, [path]: content }));
    setDirtyFiles(prev => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
    if (activeFile === path) {
      setActiveFileContent(content);
    }
  };

  // Persist actions to localStorage
  const saveFoldersToStorage = (folders: string[]) => {
    localStorage.setItem(STORAGE_KEYS.OPEN_FOLDERS, JSON.stringify(folders));
  };

  const saveTabsToStorage = (tabs: string[]) => {
    localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(tabs));
  };

  const saveActiveFileToStorage = (path: string | null) => {
    if (path) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_FILE, path);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_FILE);
    }
  };

  // Open a file
  const openFile = async (filePath: string) => {
    if (!PermissionManager.hasPermission(Permission.FILE_READ)) {
      await PermissionManager.requestPermission(Permission.FILE_READ, 'Open file in editor');
    }

    // Add to open tabs if not present
    const updatedTabs = openTabs.includes(filePath) ? openTabs : [...openTabs, filePath];
    setOpenTabs(updatedTabs);
    saveTabsToStorage(updatedTabs);

    setActiveFile(filePath);
    setActiveTabState(filePath);
    saveActiveFileToStorage(filePath);

    // Track recently opened
    const filteredRecents = recentFiles.filter(p => p !== filePath);
    const updatedRecents = [filePath, ...filteredRecents].slice(0, 10);
    setRecentFiles(updatedRecents);
    localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(updatedRecents));

    // Emit event
    globalEventBus.publish('file.open', {
      id: Math.random().toString(),
      name: 'file.open',
      timestamp: Date.now(),
      payload: { path: filePath },
      source: 'WorkspaceProvider',
    });
  };

  // Close a tab
  const closeTab = (filePath: string) => {
    // If dirty, we could show confirmation but the requirement says "Saat menutup: Tampilkan dialog konfirmasi."
    // We will do this confirmation in EditorArea before calling closeTab, so here we just force close.
    const updatedTabs = openTabs.filter(p => p !== filePath);
    setOpenTabs(updatedTabs);
    saveTabsToStorage(updatedTabs);

    setDirtyFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });

    if (activeTab === filePath) {
      const nextActive = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null;
      setActiveFile(nextActive);
      setActiveTabState(nextActive);
      saveActiveFileToStorage(nextActive);
    }
  };

  // Set active tab
  const setActiveTab = (filePath: string | null) => {
    setActiveTabState(filePath);
    setActiveFile(filePath);
    saveActiveFileToStorage(filePath);
  };

  // Save changes to active file
  const saveActiveFile = async (providedContent?: string): Promise<boolean> => {
    if (!activeFile) return false;
    
    const content = providedContent !== undefined ? providedContent : fileContentsCache[activeFile] || '';

    if (!PermissionManager.hasPermission(Permission.FILE_WRITE)) {
      await PermissionManager.requestPermission(Permission.FILE_WRITE, 'Save modifications to file');
    }

    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'write',
          path: activeFile,
          content,
        }),
      });

      if (res.ok) {
        setActiveFileContent(content);
        setFileContentsCache(prev => ({ ...prev, [activeFile]: content }));
        setDirtyFiles(prev => {
          const next = new Set(prev);
          next.delete(activeFile);
          return next;
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to save file:', e);
    }
    return false;
  };

  // Toggle folders expand/collapse
  const toggleFolder = (path: string) => {
    const isCurrentlyOpen = openFolderPaths.includes(path);
    let updated: string[];
    if (isCurrentlyOpen) {
      updated = openFolderPaths.filter(p => p !== path);
      // Emit event
      globalEventBus.publish('folder.collapse', {
        id: Math.random().toString(),
        name: 'folder.collapse',
        timestamp: Date.now(),
        payload: { path },
        source: 'WorkspaceProvider',
      });
    } else {
      updated = [...openFolderPaths, path];
      // Emit event
      globalEventBus.publish('folder.expand', {
        id: Math.random().toString(),
        name: 'folder.expand',
        timestamp: Date.now(),
        payload: { path },
        source: 'WorkspaceProvider',
      });
    }
    setOpenFolderPaths(updated);
    saveFoldersToStorage(updated);
  };

  const setFolderOpen = (path: string, isOpen: boolean) => {
    const isCurrentlyOpen = openFolderPaths.includes(path);
    if (isOpen && !isCurrentlyOpen) {
      const updated = [...openFolderPaths, path];
      setOpenFolderPaths(updated);
      saveFoldersToStorage(updated);
    } else if (!isOpen && isCurrentlyOpen) {
      const updated = openFolderPaths.filter(p => p !== path);
      setOpenFolderPaths(updated);
      saveFoldersToStorage(updated);
    }
  };

  // File CRUD Operations
  const createNode = async (nodePath: string, type: 'file' | 'directory', content = ''): Promise<boolean> => {
    if (!PermissionManager.hasPermission(Permission.FILE_WRITE)) {
      await PermissionManager.requestPermission(Permission.FILE_WRITE, 'Create new item');
    }

    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: nodePath,
          type,
          content,
        }),
      });

      if (res.ok) {
        await refreshWorkspace();
        // Expand the parent directory if possible
        const parentPath = nodePath.includes('/') ? nodePath.substring(0, nodePath.lastIndexOf('/')) : '';
        if (parentPath) {
          setFolderOpen(parentPath, true);
        }
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const renameNode = async (oldPath: string, newPath: string): Promise<boolean> => {
    if (!PermissionManager.hasPermission(Permission.FILE_WRITE)) {
      await PermissionManager.requestPermission(Permission.FILE_WRITE, 'Rename item');
    }

    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          oldPath,
          newPath,
        }),
      });

      if (res.ok) {
        // Update active file & open tabs if affected
        if (activeFile === oldPath) {
          setActiveFile(newPath);
          setActiveTabState(newPath);
          saveActiveFileToStorage(newPath);
        } else if (activeFile?.startsWith(oldPath + '/')) {
          const updatedActive = activeFile.replace(oldPath + '/', newPath + '/');
          setActiveFile(updatedActive);
          setActiveTabState(updatedActive);
          saveActiveFileToStorage(updatedActive);
        }

        const updatedTabs = openTabs.map(tab => {
          if (tab === oldPath) return newPath;
          if (tab.startsWith(oldPath + '/')) {
            return tab.replace(oldPath + '/', newPath + '/');
          }
          return tab;
        });
        setOpenTabs(updatedTabs);
        saveTabsToStorage(updatedTabs);

        // Update folders too
        const updatedFolders = openFolderPaths.map(folder => {
          if (folder === oldPath) return newPath;
          if (folder.startsWith(oldPath + '/')) {
            return folder.replace(oldPath + '/', newPath + '/');
          }
          return folder;
        });
        setOpenFolderPaths(updatedFolders);
        saveFoldersToStorage(updatedFolders);

        await refreshWorkspace();

        // Emit rename event
        globalEventBus.publish('file.rename', {
          id: Math.random().toString(),
          name: 'file.rename',
          timestamp: Date.now(),
          payload: { oldPath, newPath },
          source: 'WorkspaceProvider',
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteNode = async (nodePath: string): Promise<boolean> => {
    if (!PermissionManager.hasPermission(Permission.FILE_DELETE)) {
      await PermissionManager.requestPermission(Permission.FILE_DELETE, 'Delete item');
    }

    try {
      const res = await fetch('/api/workspace', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          path: nodePath,
        }),
      });

      if (res.ok) {
        // Remove from open tabs
        const isAffected = (p: string) => p === nodePath || p.startsWith(nodePath + '/');
        const updatedTabs = openTabs.filter(tab => !isAffected(tab));
        setOpenTabs(updatedTabs);
        saveTabsToStorage(updatedTabs);

        if (activeFile && isAffected(activeFile)) {
          const nextActive = updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null;
          setActiveFile(nextActive);
          setActiveTabState(nextActive);
          saveActiveFileToStorage(nextActive);
        }

        // Clean up open folders
        const updatedFolders = openFolderPaths.filter(folder => !isAffected(folder));
        setOpenFolderPaths(updatedFolders);
        saveFoldersToStorage(updatedFolders);

        await refreshWorkspace();

        // Emit delete event
        globalEventBus.publish('file.delete', {
          id: Math.random().toString(),
          name: 'file.delete',
          timestamp: Date.now(),
          payload: { path: nodePath },
          source: 'WorkspaceProvider',
        });
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const duplicateNode = async (source: string, destination: string): Promise<boolean> => {
    if (!PermissionManager.hasPermission(Permission.FILE_WRITE)) {
      await PermissionManager.requestPermission(Permission.FILE_WRITE, 'Duplicate item');
    }

    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          source,
          destination,
        }),
      });

      if (res.ok) {
        await refreshWorkspace();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const moveNode = async (source: string, destination: string): Promise<boolean> => {
    // A move is essentially a rename!
    const nodeName = source.substring(source.lastIndexOf('/') + 1);
    const newPath = destination ? `${destination}/${nodeName}` : nodeName;
    return renameNode(source, newPath);
  };

  // Vaelox Identity Features: Favorites / Pins / Recent Files
  const toggleFavorite = (filePath: string) => {
    const isCurrentlyFav = favorites.includes(filePath);
    let updated: string[];
    if (isCurrentlyFav) {
      updated = favorites.filter(p => p !== filePath);
    } else {
      updated = [...favorites, filePath];
    }
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  };

  const togglePinFolder = (folderPath: string) => {
    const isCurrentlyPinned = pinnedFolders.includes(folderPath);
    let updated: string[];
    if (isCurrentlyPinned) {
      updated = pinnedFolders.filter(p => p !== folderPath);
    } else {
      updated = [...pinnedFolders, folderPath];
    }
    setPinnedFolders(updated);
    localStorage.setItem(STORAGE_KEYS.PIN_FOLDERS, JSON.stringify(updated));
  };

  const clearRecentFiles = () => {
    setRecentFiles([]);
    localStorage.removeItem(STORAGE_KEYS.RECENT_FILES);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        files,
        loading,
        error,
        refreshWorkspace,
        
        activeFile,
        activeFileContent,
        openTabs,
        setOpenTabs,
        pinnedTabs,
        togglePinTab,
        activeTab,
        fileContentsCache,
        dirtyFiles,
        openFile,
        closeTab,
        setActiveTab,
        updateFileContent,
        saveActiveFile,
        
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
        clearRecentFiles,

        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
