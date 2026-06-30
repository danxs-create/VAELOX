'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { panelRegistry } from '@/core/registries/PanelRegistry';

export function RightPanel() {
  const { rightPanelState, setRightPanelState, isMobile } = useLayout();
  const shouldReduceMotion = useReducedMotion();

  // Find panel config for right panel (AI Chat is the key panel for position 'right')
  const chatPanel = panelRegistry.getPanel('chat');
  const PanelComponent = chatPanel ? chatPanel.component : null;

  return (
    <AnimatePresence initial={false}>
      {rightPanelState === 'open' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { x: isMobile ? '100%' : 50, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { x: isMobile ? '100%' : 50, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.2, ease: 'easeOut' }}
          className="h-[calc(100%-56px)] md:h-full bg-vaelox-panel border-l md:border-l border-vaelox-border flex flex-col overflow-hidden shrink-0 absolute right-0 top-0 bottom-14 md:bottom-0 md:relative shadow-xl md:shadow-none z-30 w-full md:w-[320px] safe-pt safe-pb safe-pr"
        >
          <div className="h-12 px-4 flex items-center justify-between border-b border-vaelox-border shrink-0 bg-vaelox-surface/10">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 select-none">
              <Sparkles className="w-4 h-4 animate-pulse text-brand-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {chatPanel?.title || 'AI Chat'}
              </h2>
            </div>
            <button
              onClick={() => setRightPanelState('closed')}
              className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Close AI Chat Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {PanelComponent ? (
              <PanelComponent />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-vaelox-muted space-y-3 p-4 border-2 border-dashed border-vaelox-border rounded-lg">
                <span className="text-sm font-medium">Right Panel Placeholder</span>
                <span className="text-xs">AI Chat / Tool Execution will go here</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
