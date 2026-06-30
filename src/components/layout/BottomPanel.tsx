'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Terminal as TerminalIcon } from 'lucide-react';
import { panelRegistry } from '@/core/registries/PanelRegistry';

export function BottomPanel() {
  const { bottomPanelState, setBottomPanelState, isMobile } = useLayout();
  const shouldReduceMotion = useReducedMotion();

  // Find panel config for terminal
  const terminalPanel = panelRegistry.getPanel('terminal');
  const PanelComponent = terminalPanel ? terminalPanel.component : null;

  return (
    <AnimatePresence initial={false}>
      {bottomPanelState === 'open' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { height: isMobile ? 210 : 250, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.2, ease: 'easeInOut' }}
          className="w-full bg-vaelox-panel border-t border-vaelox-border flex flex-col overflow-hidden shrink-0 z-20 absolute bottom-14 md:relative md:bottom-0 safe-pb"
        >
          <div className="h-10 px-4 flex items-center justify-between border-b border-vaelox-border shrink-0 bg-vaelox-surface/10 select-none">
            <div className="flex items-center gap-4 text-xs font-semibold text-vaelox-muted">
              <button className="text-vaelox-text uppercase tracking-wider flex items-center gap-1.5 cursor-pointer outline-none focus:text-brand-500">
                <TerminalIcon className="w-3.5 h-3.5" />
                {terminalPanel?.title || 'Terminal'}
              </button>
              <button className="uppercase tracking-wider hover:text-vaelox-text transition-colors cursor-pointer outline-none hidden sm:inline-block">
                Output
              </button>
              <button className="uppercase tracking-wider hover:text-vaelox-text transition-colors cursor-pointer outline-none hidden sm:inline-block">
                Problems
              </button>
            </div>
            <button
              onClick={() => setBottomPanelState('closed')}
              className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Close terminal panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-vaelox-surface font-mono text-sm">
            {PanelComponent ? (
              <PanelComponent />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-vaelox-muted space-y-3 p-4 border-2 border-dashed border-vaelox-border rounded-lg">
                <span className="font-medium font-sans">Bottom Panel Placeholder</span>
                <span>$ Terminal output will go here</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
