'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  X, 
  Terminal as TerminalIcon, 
  Workflow as ToolsIcon, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { panelRegistry } from '@/core/registries/PanelRegistry';
import { cn } from '@/lib/utils';

export function BottomPanel() {
  const { bottomPanelState, setBottomPanelState, isMobile } = useLayout();
  const shouldReduceMotion = useReducedMotion();

  // Selected tab state inside bottom panel
  const [activeTab, setActiveTab] = useState<'terminal' | 'tools' | 'output' | 'problems'>('tools');
  
  // Height and expansion states
  const [panelHeight, setPanelHeight] = useState(300);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Find panel components
  const terminalPanel = panelRegistry.getPanel('terminal');
  const toolsPanel = panelRegistry.getPanel('tools');

  const TerminalComponent = terminalPanel ? terminalPanel.component : null;
  const ToolsComponent = toolsPanel ? toolsPanel.component : null;

  // Drag-to-resize logic on desktop
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate height from the bottom of the viewport
      const newHeight = window.innerHeight - e.clientY - 56; // compensate for bottom nav height if needed
      if (newHeight >= 140 && newHeight <= window.innerHeight * 0.75) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Toggle mobile bottom sheet expansion
  const toggleMobileExpand = useCallback(() => {
    setIsMobileExpanded(prev => !prev);
  }, []);

  // Determine current height to render
  const currentHeight = useMemo(() => {
    if (isMobile) {
      return isMobileExpanded ? 580 : 250;
    }
    return panelHeight;
  }, [isMobile, isMobileExpanded, panelHeight]);

  return (
    <AnimatePresence initial={false}>
      {bottomPanelState === 'open' && (
        <motion.div
          ref={panelRef}
          initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { height: currentHeight, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.25, ease: 'easeOut' }}
          className={cn(
            "w-full bg-vaelox-panel border-t border-vaelox-border flex flex-col overflow-hidden shrink-0 z-20 absolute bottom-14 md:relative md:bottom-0 safe-pb shadow-2xl",
            isResizing && "select-none"
          )}
          role="region"
          aria-label="Bottom Workspace Panel"
        >
          {/* Desktop Resizer Bar & Mobile Swipe Handle */}
          <div
            ref={resizeRef}
            onMouseDown={!isMobile ? startResize : undefined}
            className={cn(
              "h-1.5 w-full bg-vaelox-border/30 absolute top-0 left-0 hover:bg-brand-500/50 transition-colors z-30 flex items-center justify-center",
              !isMobile ? "cursor-ns-resize" : "cursor-pointer"
            )}
            onClick={isMobile ? toggleMobileExpand : undefined}
            role="slider"
            aria-valuenow={currentHeight}
            aria-valuemin={140}
            aria-valuemax={600}
            aria-label="Resize workspace panel"
          >
            {/* Grab handle illustration */}
            <div className="w-10 h-1 bg-vaelox-muted/40 rounded-full" />
          </div>

          {/* Panel Header & Tabs */}
          <div className="h-11 px-4 pt-1.5 flex items-center justify-between border-b border-vaelox-border shrink-0 bg-vaelox-surface/10 select-none">
            <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold text-vaelox-muted h-full">
              {/* Tool Execution Tab */}
              <button
                onClick={() => setActiveTab('tools')}
                className={cn(
                  "px-2 sm:px-3 h-full flex items-center gap-1.5 cursor-pointer outline-none transition-all border-b-2",
                  activeTab === 'tools'
                    ? "text-brand-400 border-brand-500 font-bold"
                    : "text-vaelox-muted border-transparent hover:text-vaelox-text"
                )}
                aria-selected={activeTab === 'tools'}
                role="tab"
              >
                <ToolsIcon className="w-3.5 h-3.5" />
                <span>Tool Activity</span>
              </button>

              {/* Terminal Tab */}
              <button
                onClick={() => setActiveTab('terminal')}
                className={cn(
                  "px-2 sm:px-3 h-full flex items-center gap-1.5 cursor-pointer outline-none transition-all border-b-2",
                  activeTab === 'terminal'
                    ? "text-brand-400 border-brand-500 font-bold"
                    : "text-vaelox-muted border-transparent hover:text-vaelox-text"
                )}
                aria-selected={activeTab === 'terminal'}
                role="tab"
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Terminal</span>
              </button>

              {/* Output Tab */}
              <button
                onClick={() => setActiveTab('output')}
                className={cn(
                  "px-2 sm:px-3 h-full flex items-center gap-1.5 cursor-pointer outline-none transition-all border-b-2",
                  activeTab === 'output'
                    ? "text-brand-400 border-brand-500 font-bold"
                    : "text-vaelox-muted border-transparent hover:text-vaelox-text"
                )}
                aria-selected={activeTab === 'output'}
                role="tab"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Output</span>
              </button>

              {/* Problems Tab */}
              <button
                onClick={() => setActiveTab('problems')}
                className={cn(
                  "px-2 sm:px-3 h-full flex items-center gap-1.5 cursor-pointer outline-none transition-all border-b-2",
                  activeTab === 'problems'
                    ? "text-brand-400 border-brand-500 font-bold"
                    : "text-vaelox-muted border-transparent hover:text-vaelox-text"
                )}
                aria-selected={activeTab === 'problems'}
                role="tab"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Problems</span>
              </button>
            </div>

            {/* Panel Controls (Maximize, Minimize, Close) */}
            <div className="flex items-center gap-1 shrink-0">
              {isMobile ? (
                <button
                  onClick={toggleMobileExpand}
                  className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
                  aria-label={isMobileExpanded ? "Collapse panel" : "Expand panel"}
                >
                  {isMobileExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={() => setPanelHeight(prev => prev > 400 ? 250 : 500)}
                  className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
                  aria-label="Toggle panel size"
                >
                  {panelHeight > 400 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={() => setBottomPanelState('closed')}
                className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Close bottom panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active View Content */}
          <div className="flex-1 overflow-hidden bg-vaelox-surface">
            {activeTab === 'tools' && ToolsComponent && (
              <ToolsComponent />
            )}

            {activeTab === 'terminal' && TerminalComponent && (
              <div className="h-full overflow-auto p-4 font-mono text-sm">
                <TerminalComponent />
              </div>
            )}

            {activeTab === 'output' && (
              <div className="h-full flex flex-col items-center justify-center text-center text-vaelox-muted space-y-2 p-4">
                <FileText className="w-8 h-8 text-vaelox-muted/40" />
                <span className="font-semibold text-xs">Vaelox Compiler Output</span>
                <span className="text-[11px] font-mono">[INFO] Starting fast production compiler build... OK</span>
              </div>
            )}

            {activeTab === 'problems' && (
              <div className="h-full flex flex-col items-center justify-center text-center text-vaelox-muted space-y-2 p-4">
                <AlertCircle className="w-8 h-8 text-emerald-500/40" />
                <span className="font-semibold text-xs text-emerald-400">0 Problems found in workspace</span>
                <span className="text-[11px] font-mono">No syntactic linting or type compiler warnings.</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useMemo } from 'react';
