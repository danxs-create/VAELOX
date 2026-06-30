'use client';

import React from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { panelRegistry } from '@/core/registries/PanelRegistry';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

export function Sidebar() {
  const { sidebarState, activeActivity, setSidebarState } = useLayout();
  const shouldReduceMotion = useReducedMotion();

  // Find the active panel configuration
  const activePanel = activeActivity ? panelRegistry.getPanel(activeActivity) : null;
  const PanelComponent = activePanel ? activePanel.component : null;

  return (
    <AnimatePresence initial={false}>
      {sidebarState === 'open' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { width: 280, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.2, ease: 'easeInOut' }}
          className="h-full bg-vaelox-panel border-r border-vaelox-border flex flex-col overflow-hidden shrink-0 safe-pt safe-pb hidden md:flex"
        >
          {/* Workspace Switcher at top of left Sidebar */}
          <WorkspaceSwitcher />

          {/* Panel Title & Close Button */}
          <div className="h-10 px-4 flex items-center justify-between border-b border-vaelox-border shrink-0 bg-vaelox-surface/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-vaelox-muted select-none">
              {activePanel?.title || 'Sidebar'}
            </h2>
            <button
              onClick={() => setSidebarState('closed')}
              className="md:hidden p-1 rounded-md hover:bg-vaelox-surface text-vaelox-muted cursor-pointer outline-none focus:ring-1 focus:ring-brand-500"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {PanelComponent ? (
              <PanelComponent />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-vaelox-muted space-y-3 p-4 border-2 border-dashed border-vaelox-border rounded-lg">
                <span className="text-sm font-medium">Sidebar Placeholder</span>
                <span className="text-xs">Content for {activeActivity} will go here</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
