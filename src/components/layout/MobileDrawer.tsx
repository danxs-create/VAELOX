'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { panelRegistry } from '@/core/registries/PanelRegistry';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function MobileDrawer() {
  const { 
    drawerOpen, 
    setDrawerOpen, 
    drawerPanel, 
    setDrawerPanel 
  } = useLayout();

  const activePanelId = drawerPanel || 'explorer';
  const activePanel = panelRegistry.getPanel(activePanelId);
  const PanelComponent = activePanel ? activePanel.component : null;
  
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  // Focus trap / Accessibility
  useEffect(() => {
    if (drawerOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [drawerOpen]);

  return (
    <AnimatePresence>
      {drawerOpen && drawerPanel && (
        <div className="fixed inset-0 z-40 md:hidden flex justify-start">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding Panel (Slide in from Left, which is very natural for Sidebars) */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-[300px] max-w-[85vw] h-full bg-vaelox-panel border-r border-vaelox-border shadow-2xl flex flex-col z-50 safe-pt safe-pb safe-pl"
            role="dialog"
            aria-modal="true"
            aria-label={`${activePanel?.title || 'Navigation'} Panel`}
          >
            {/* Header */}
            <div className="h-12 px-4 border-b border-vaelox-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {activePanel && (
                  <activePanel.icon className="w-4 h-4 text-brand-600 dark:text-brand-400 stroke-[1.8]" />
                )}
                <span className="text-xs font-bold text-vaelox-text uppercase tracking-wider">
                  {activePanel?.title || 'Navigation'}
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-vaelox-surface text-vaelox-muted cursor-pointer transition-colors outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Close panel drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {PanelComponent ? (
                <PanelComponent />
              ) : (
                <div className="text-center text-vaelox-muted text-xs py-8">
                  No content loaded
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
