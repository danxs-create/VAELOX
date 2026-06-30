'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Menu, Search, FolderOpen, Save, X, FileCode, Undo, Redo, Copy, ClipboardPaste, Type, ListTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MonacoEditor } from '@/components/editor/MonacoEditor';

export function EditorArea() {
  const { 
    isMobile, 
    toggleSidebar, 
    setCommandPaletteOpen, 
    setDrawerOpen, 
    setDrawerPanel 
  } = useLayout();

  const {
    activeFile,
    activeFileContent,
    openTabs,
    setOpenTabs,
    activeTab,
    closeTab,
    setActiveTab,
    saveActiveFile,
    dirtyFiles,
    updateFileContent,
    pinnedTabs,
    togglePinTab,
    openFile
  } = useWorkspace();

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [tabToClose, setTabToClose] = useState<string | null>(null);
  
  // Tab Context Menu State
  const [tabMenu, setTabMenu] = useState<{ visible: boolean; x: number; y: number; tabPath: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    tabPath: null,
  });

  const editorInstRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const hasChanges = activeFile ? dirtyFiles.has(activeFile) : false;

  const handleSave = async () => {
    if (!activeFile) return;
    setIsSaving(true);
    await saveActiveFile();
    setIsSaving(false);
  };

  const handleMenuClick = () => {
    if (isMobile) {
      setDrawerPanel('explorer');
      setDrawerOpen(true);
    } else {
      toggleSidebar();
    }
  };

  // Get active file name
  const getFileName = (pathStr: string) => {
    return pathStr.substring(pathStr.lastIndexOf('/') + 1);
  };

  const attemptCloseTab = (e: React.MouseEvent, tabPath: string) => {
    e.stopPropagation();
    if (dirtyFiles.has(tabPath)) {
      setTabToClose(tabPath);
    } else {
      closeTab(tabPath);
    }
  };

  const confirmCloseTab = () => {
    if (tabToClose) {
      closeTab(tabToClose);
      setTabToClose(null);
    }
  };

  // Context Menu Handlers
  const handleTabContextMenu = (e: React.MouseEvent, tabPath: string) => {
    e.preventDefault();
    setTabMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabPath,
    });
  };

  const closeTabMenu = () => {
    setTabMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (tabMenu.visible) {
      window.addEventListener('click', closeTabMenu);
      return () => window.removeEventListener('click', closeTabMenu);
    }
  }, [tabMenu.visible]);

  const handleCloseOthers = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = tabMenu.tabPath;
    if (!target) return;
    openTabs.forEach((tab) => {
      if (tab !== target) {
        closeTab(tab);
      }
    });
    closeTabMenu();
  };

  const handleCloseLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = tabMenu.tabPath;
    if (!target) return;
    const index = openTabs.indexOf(target);
    const tabsToClose = openTabs.slice(0, index);
    tabsToClose.forEach((tab) => closeTab(tab));
    closeTabMenu();
  };

  const handleCloseRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const target = tabMenu.tabPath;
    if (!target) return;
    const index = openTabs.indexOf(target);
    const tabsToClose = openTabs.slice(index + 1);
    tabsToClose.forEach((tab) => closeTab(tab));
    closeTabMenu();
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorInstRef.current = editor;
    monacoRef.current = monaco;
  };

  const execMobileAction = (action: string) => {
    if (!editorInstRef.current) return;
    const editor = editorInstRef.current;
    
    switch (action) {
      case 'undo': editor.trigger('keyboard', 'undo', null); break;
      case 'redo': editor.trigger('keyboard', 'redo', null); break;
      case 'copy': 
        editor.focus();
        document.execCommand('copy');
        break;
      case 'paste':
        editor.focus();
        navigator.clipboard.readText().then(text => {
          editor.executeEdits('clipboard', [{
            range: editor.getSelection(),
            text,
            forceMoveMarkers: true
          }]);
        }).catch(err => console.error('Paste failed:', err));
        break;
      case 'find': editor.trigger('keyboard', 'actions.find', null); break;
      case 'save': handleSave(); break;
    }
  };

  // Breadcrumbs
  const breadcrumbParts = activeFile ? activeFile.split('/') : [];

  return (
    <div className="flex-1 h-full flex flex-col bg-vaelox-panel min-w-0 relative" id="editor-area-container">
      {/* Editor Header Bar */}
      <div className="h-12 md:h-10 flex items-center justify-between px-3 border-b border-vaelox-border bg-vaelox-surface/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1 h-full overflow-x-auto no-scrollbar max-w-[80%]">
          {/* Menu / Hamburger Button with min-width/height 44px on mobile for accessibility */}
          <button
            onClick={handleMenuClick}
            className="p-2.5 md:p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-brand-500 flex items-center justify-center shrink-0"
            style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
            aria-label="Toggle Navigation Panel"
            id="editor-toggle-sidebar-btn"
          >
            <Menu className="w-4.5 h-4.5 md:w-4 md:h-4" />
          </button>
          
          {/* Editor Tabs */}
          <div className="flex items-center h-full pt-1.5 gap-1 overflow-x-auto no-scrollbar" id="editor-tabs-row">
            {openTabs.map((tabPath, index) => {
              const isActive = activeTab === tabPath;
              const name = getFileName(tabPath);
              const isDirty = dirtyFiles.has(tabPath);
              return (
                <div
                  key={tabPath}
                  onClick={() => setActiveTab(tabPath)}
                  onContextMenu={(e) => handleTabContextMenu(e, tabPath)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                    const toIndex = index;
                    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                      const newTabs = [...openTabs];
                      const [moved] = newTabs.splice(fromIndex, 1);
                      newTabs.splice(toIndex, 0, moved);
                      setOpenTabs(newTabs);
                    }
                  }}
                  className={cn(
                    "group h-full px-3 py-1 flex items-center gap-2 text-xs font-semibold cursor-pointer rounded-t-md border-r border-vaelox-border select-none transition-all duration-150 shrink-0",
                    isActive 
                      ? "bg-vaelox-panel border-t-2 border-brand-500 text-vaelox-text" 
                      : "bg-vaelox-surface/30 border-t-2 border-transparent text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface/50"
                  )}
                  id={`tab-${tabPath.replace(/[^a-zA-Z0-9]/g, '-')}`}
                >
                  <FileCode className={cn("w-3.5 h-3.5", isActive ? "text-brand-500" : "text-vaelox-muted group-hover:text-vaelox-text")} />
                  <span className="truncate max-w-[120px]">{name}</span>
                  {pinnedTabs.includes(tabPath) && (
                    <span className="text-brand-500 ml-1">📌</span>
                  )}
                  {isDirty && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse ml-1" title="Unsaved changes" />
                  )}
                  <button
                    onClick={(e) => attemptCloseTab(e, tabPath)}
                    className="p-0.5 rounded hover:bg-vaelox-surface text-vaelox-muted hover:text-vaelox-text"
                    aria-label={`Close tab ${name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right actions: Command Palette trigger for mobile & Save action */}
        <div className="flex items-center gap-1 shrink-0">
          {activeFile && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                "p-2.5 md:p-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer",
                hasChanges 
                  ? "bg-brand-600 hover:bg-brand-500 text-white shadow-sm" 
                  : "text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface"
              )}
              style={{ minWidth: isMobile ? '44px' : 'auto', minHeight: isMobile ? '44px' : 'auto' }}
              title="Save Changes (Ctrl+S)"
              id="editor-save-btn"
            >
              <Save className="w-4 h-4" />
              <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}

          {isMobile && (
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="p-2.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-brand-500 flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px' }}
              title="Command Palette"
              aria-label="Open Command Palette"
              id="editor-mobile-search-btn"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {activeFile && (
        <div className="h-6 flex items-center px-4 bg-vaelox-surface/20 text-[11px] text-vaelox-muted/80 font-mono border-b border-vaelox-border shrink-0 select-none overflow-x-auto no-scrollbar">
          <span className="hover:text-vaelox-text cursor-pointer">Workspace</span>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className="mx-1.5 opacity-50">«»</span>
              <span className={cn(index === breadcrumbParts.length - 1 ? "text-vaelox-text font-medium" : "hover:text-vaelox-text cursor-pointer")}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* Code Editor Workspace View */}
      <div className="flex-1 overflow-hidden flex relative" id="editor-workspace-view">
        {activeFile ? (
          <div className="flex-1 h-full overflow-hidden bg-vaelox-surface/10 relative">
            <MonacoEditor
              path={activeFile}
              value={activeFileContent ?? ''}
              onChange={(val) => {
                if (val !== undefined) {
                  updateFileContent(activeFile, val);
                }
              }}
              onSave={handleSave}
              onMount={handleEditorMount}
            />

            {/* Mobile Floating Toolbar */}
            {isMobile && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-vaelox-panel/90 backdrop-blur-md border border-vaelox-border rounded-full shadow-lg shadow-black/50 p-1 flex items-center gap-1 z-10">
                <button onClick={() => execMobileAction('undo')} className="p-2 rounded-full hover:bg-vaelox-surface text-vaelox-text active:scale-95" aria-label="Undo"><Undo className="w-4 h-4" /></button>
                <button onClick={() => execMobileAction('redo')} className="p-2 rounded-full hover:bg-vaelox-surface text-vaelox-text active:scale-95" aria-label="Redo"><Redo className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-vaelox-border/60 mx-0.5" />
                <button onClick={() => execMobileAction('copy')} className="p-2 rounded-full hover:bg-vaelox-surface text-vaelox-text active:scale-95" aria-label="Copy"><Copy className="w-4 h-4" /></button>
                <button onClick={() => execMobileAction('paste')} className="p-2 rounded-full hover:bg-vaelox-surface text-vaelox-text active:scale-95" aria-label="Paste"><ClipboardPaste className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-vaelox-border/60 mx-0.5" />
                <button onClick={() => execMobileAction('find')} className="p-2 rounded-full hover:bg-vaelox-surface text-vaelox-text active:scale-95" aria-label="Find"><Search className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 md:p-6 flex flex-col h-full" id="editor-placeholder-view">
            <div className="flex-1 border-2 border-dashed border-vaelox-border rounded-xl flex items-center justify-center text-vaelox-muted flex-col gap-3 bg-vaelox-surface/20 p-6 text-center select-none">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center animate-pulse">
                <FolderOpen className="w-6 h-6" />
              </div>
              <span className="font-bold text-vaelox-text text-sm md:text-base">Editor Canvas Ready</span>
              <p className="text-xs max-w-sm leading-relaxed text-vaelox-muted">
                Open any file from the File Explorer sidebar on the left or search with the Command Palette to begin hacking.
              </p>
              
              {isMobile ? (
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="mt-2 px-4 py-2 bg-brand-600 text-white font-semibold text-xs rounded-lg shadow-sm shadow-brand-500/10 hover:bg-brand-500 transition-colors cursor-pointer"
                  id="editor-palette-mobile-trigger"
                >
                  Launch Command Palette
                </button>
              ) : (
                <div className="text-xs font-mono text-vaelox-muted/60 mt-2 bg-vaelox-surface/60 px-3 py-1.5 rounded-md border border-vaelox-border">
                  Press <kbd className="bg-vaelox-panel px-1.5 py-0.5 rounded border border-vaelox-border text-[10px]">Ctrl</kbd> + <kbd className="bg-vaelox-panel px-1.5 py-0.5 rounded border border-vaelox-border text-[10px]">P</kbd> to find files
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dirty Tab Close Confirmation Dialog */}
      {tabToClose && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-vaelox-panel border border-vaelox-border rounded-xl shadow-2xl max-w-sm w-full p-5">
            <h3 className="text-vaelox-text font-bold mb-2">Unsaved Changes</h3>
            <p className="text-sm text-vaelox-muted mb-6">
              You have unsaved changes in <span className="font-mono text-brand-400">{getFileName(tabToClose)}</span>. Are you sure you want to close it? Changes will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setTabToClose(null)} 
                className="px-4 py-2 rounded-lg text-sm font-medium text-vaelox-text hover:bg-vaelox-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmCloseTab} 
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Context Menu Overlay */}
      {tabMenu.visible && (
        <div 
          className="fixed z-50 bg-vaelox-panel border border-vaelox-border shadow-xl rounded-lg py-1 min-w-[160px] text-sm"
          style={{ top: tabMenu.y, left: tabMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={(e) => { e.stopPropagation(); togglePinTab(tabMenu.tabPath!); closeTabMenu(); }}
          >
            {tabMenu.tabPath && pinnedTabs.includes(tabMenu.tabPath) ? 'Unpin Tab' : 'Pin Tab'}
          </button>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={(e) => { e.stopPropagation(); openFile(tabMenu.tabPath!); closeTabMenu(); }}
          >
            Duplicate Tab
          </button>
          <div className="h-px bg-vaelox-border my-1" />
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={(e) => { e.stopPropagation(); closeTab(tabMenu.tabPath!); closeTabMenu(); }}
          >
            Close Tab
          </button>
          <div className="h-px bg-vaelox-border my-1" />
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={handleCloseOthers}
          >
            Close Others
          </button>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={handleCloseLeft}
          >
            Close to the Left
          </button>
          <button 
            className="w-full text-left px-4 py-1.5 hover:bg-vaelox-surface text-vaelox-text transition-colors"
            onClick={handleCloseRight}
          >
            Close to the Right
          </button>
        </div>
      )}
    </div>
  );
}
