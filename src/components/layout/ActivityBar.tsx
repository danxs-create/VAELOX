'use client';

import React, { useEffect, useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Sparkles, Command } from 'lucide-react';
import { panelRegistry } from '@/core/registries/PanelRegistry';

export function ActivityBar() {
  const { 
    activeActivity, 
    setActiveActivity, 
    sidebarState, 
    setSidebarState, 
    rightPanelState,
    setRightPanelState,
    toggleRightPanel, 
    toggleBottomPanel,
    setCommandPaletteOpen
  } = useLayout();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleActivityClick = (id: string) => {
    if (id === 'terminal') {
      toggleBottomPanel();
      return;
    }
    
    if (id === 'chat') {
      toggleRightPanel();
      return;
    }

    if (activeActivity === id && sidebarState === 'open') {
      setSidebarState('closed');
    } else {
      setActiveActivity(id);
      setSidebarState('open');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get sidebar panels from registry to render in the top section (excluding settings)
  const sidebarPanels = panelRegistry.getPanelsByPosition('sidebar').filter(p => p.id !== 'settings');
  // Terminal is registered for 'bottom'
  const bottomPanels = panelRegistry.getPanelsByPosition('bottom');

  // Bottom activities: bottom panels (Terminal) and Settings
  const bottomActivities = [
    ...bottomPanels,
    ...panelRegistry.getPanelsByPosition('sidebar').filter(p => p.id === 'settings'),
  ];

  return (
    <div className="w-12 h-full flex flex-col items-center py-2 bg-vaelox-surface border-r border-vaelox-border z-20 shrink-0 safe-pt safe-pb safe-pl select-none hidden md:flex">
      {/* Search / Command Palette shortcut icon at top */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center justify-center w-full h-12 text-vaelox-muted hover:text-vaelox-text transition-colors cursor-pointer outline-none focus:text-brand-500"
        title="Command Palette (Ctrl+P)"
        aria-label="Open Command Palette"
      >
        <Command className="w-5 h-5 stroke-[1.5]" />
      </button>

      {/* Horizontal Divider */}
      <div className="w-6 h-px bg-vaelox-border my-1 shrink-0" />

      {/* Sidebar activities */}
      <div className="flex-1 flex flex-col gap-1 w-full">
        {sidebarPanels.map((activity) => {
          const Icon = activity.icon;
          const isSelected = activeActivity === activity.id && sidebarState === 'open';
          
          return (
            <button
              key={activity.id}
              onClick={() => handleActivityClick(activity.id)}
              className={cn(
                "relative flex items-center justify-center w-full h-11 text-vaelox-muted hover:text-vaelox-text transition-colors cursor-pointer outline-none",
                isSelected && "text-brand-600 dark:text-brand-500"
              )}
              title={activity.title}
              aria-label={activity.title}
            >
              {isSelected && (
                <motion.div
                  layoutId="active-activity-indicator"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-600 dark:bg-brand-500"
                  transition={shouldReduceMotion ? { duration: 0 } : undefined}
                />
              )}
              <Icon className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>
          );
        })}
      </div>

      {/* Vaelox Signature Quick AI Button for Desktop */}
      <div className="w-full flex justify-center py-2 shrink-0">
        <button
          onClick={() => setRightPanelState(rightPanelState === 'open' ? 'closed' : 'open')}
          className={cn(
            "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 outline-none cursor-pointer shadow-sm group",
            rightPanelState === 'open' 
              ? "bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-brand-500/20" 
              : "bg-vaelox-panel hover:bg-vaelox-surface border border-vaelox-border hover:border-brand-500/30 text-brand-600 dark:text-brand-400 hover:text-brand-700"
          )}
          title="Vaelox Intelligent Assistant"
          aria-label="Quick AI Panel"
        >
          {/* Subtle pulsate back glow */}
          <span className="absolute inset-0 rounded-xl bg-brand-500/10 scale-105 group-hover:scale-110 group-hover:bg-brand-500/15 transition-all blur-sm animate-pulse" />
          
          <Sparkles className="w-4 h-4 stroke-[1.8] relative z-10" />
        </button>
      </div>

      {/* Theme and lower actions */}
      <div className="flex flex-col gap-1 w-full shrink-0">
        <button
          onClick={toggleTheme}
          suppressHydrationWarning
          className="flex items-center justify-center w-full h-11 text-vaelox-muted hover:text-vaelox-text transition-colors cursor-pointer outline-none"
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="w-[18px] h-[18px] stroke-[1.5]" />
          ) : (
            <Moon className="w-[18px] h-[18px] stroke-[1.5]" />
          )}
        </button>
        {bottomActivities.map((activity) => {
          const Icon = activity.icon;
          return (
            <button
              key={activity.id}
              onClick={() => handleActivityClick(activity.id)}
              className="flex items-center justify-center w-full h-11 text-vaelox-muted hover:text-vaelox-text transition-colors cursor-pointer outline-none"
              title={activity.title}
              aria-label={activity.title}
            >
              <Icon className="w-[18px] h-[18px] stroke-[1.5]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
