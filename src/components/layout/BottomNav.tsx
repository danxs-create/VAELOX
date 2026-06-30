'use client';

import React from 'react';
import { Home, Files, Sparkles, Terminal, Settings } from 'lucide-react';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function BottomNav() {
  const {
    isMobile,
    keyboardOpen,
    mobileTab,
    setMobileTab,
    rightPanelState,
    setRightPanelState,
    bottomPanelState,
    setBottomPanelState,
    drawerOpen,
    setDrawerOpen,
    drawerPanel,
    setDrawerPanel,
    sidebarState,
    setSidebarState,
    setActiveActivity,
  } = useLayout();

  if (!isMobile) return null;

  // Detect if we are in "Editor Mode" (sidebar closed, right panel closed, drawer closed, home tab active)
  const isEditorMode = 
    mobileTab === 'home' && 
    rightPanelState === 'closed' && 
    bottomPanelState === 'closed' && 
    !drawerOpen;

  const handleTabClick = (tab: 'home' | 'explorer' | 'ai' | 'terminal' | 'settings') => {
    setMobileTab(tab);

    if (tab === 'home') {
      // Close everything on mobile to focus on editor
      setRightPanelState('closed');
      setBottomPanelState('closed');
      setDrawerOpen(false);
      setSidebarState('closed');
    } else if (tab === 'explorer') {
      // Open explorer in mobile drawer
      setRightPanelState('closed');
      setBottomPanelState('closed');
      setDrawerPanel('explorer');
      setDrawerOpen(true);
    } else if (tab === 'ai') {
      // Quick AI Button Behavior:
      // AI Chat becomes primary panel, fast transition, no page change, preserves state
      setBottomPanelState('closed');
      setDrawerOpen(false);
      setRightPanelState('open');
    } else if (tab === 'terminal') {
      // Toggle bottom terminal panel
      setRightPanelState('closed');
      setDrawerOpen(false);
      setBottomPanelState(bottomPanelState === 'open' ? 'closed' : 'open');
    } else if (tab === 'settings') {
      // Open settings in mobile drawer or left sidebar
      setRightPanelState('closed');
      setBottomPanelState('closed');
      setDrawerPanel('extensions'); // Settings or extensions can be selected
      setDrawerOpen(true);
      setActiveActivity('settings');
    }
  };

  // Safe area bottom class / padding
  const safeAreaBottomClass = "pb-[env(safe-area-inset-bottom,0px)]";

  return (
    <motion.nav
      id="mobile-bottom-nav"
      animate={{
        y: keyboardOpen ? 80 : 0,
        opacity: keyboardOpen ? 0 : 1,
        height: isEditorMode ? 36 : 56,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 240 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 bg-vaelox-panel/95 border-t border-vaelox-border backdrop-blur-md flex items-center justify-around px-2 shadow-lg select-none transition-all duration-200 overflow-hidden",
        safeAreaBottomClass
      )}
      role="navigation"
      aria-label="Mobile Navigation"
    >
      {/* Home Tab */}
      <button
        onClick={() => handleTabClick('home')}
        className={cn(
          "flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none",
          isEditorMode ? "w-10 h-8" : "w-14 h-12",
          mobileTab === 'home' && rightPanelState === 'closed'
            ? "text-brand-600 dark:text-brand-500" 
            : "text-vaelox-muted hover:text-vaelox-text"
        )}
        style={{ minHeight: isEditorMode ? '32px' : '44px', minWidth: isEditorMode ? '32px' : '44px' }}
        aria-label="Home / Code Editor"
      >
        <Home className={cn("transition-transform duration-200", isEditorMode ? "w-4 h-4" : "w-5 h-5")} />
        {!isEditorMode && <span className="text-[9px] mt-0.5 font-medium leading-none">Home</span>}
      </button>

      {/* Explorer Tab */}
      <button
        onClick={() => handleTabClick('explorer')}
        className={cn(
          "flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none",
          isEditorMode ? "w-10 h-8" : "w-14 h-12",
          drawerOpen && drawerPanel === 'explorer'
            ? "text-brand-600 dark:text-brand-500" 
            : "text-vaelox-muted hover:text-vaelox-text"
        )}
        style={{ minHeight: isEditorMode ? '32px' : '44px', minWidth: isEditorMode ? '32px' : '44px' }}
        aria-label="File Explorer"
      >
        <Files className={cn("transition-transform duration-200", isEditorMode ? "w-4 h-4" : "w-5 h-5")} />
        {!isEditorMode && <span className="text-[9px] mt-0.5 font-medium leading-none">Files</span>}
      </button>

      {/* Vaelox Signature Quick AI Button */}
      <button
        onClick={() => handleTabClick('ai')}
        className={cn(
          "relative flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none",
          isEditorMode ? "w-12 h-8" : "w-16 h-12"
        )}
        style={{ minHeight: isEditorMode ? '32px' : '44px', minWidth: isEditorMode ? '32px' : '44px' }}
        aria-label="Vaelox AI Assistant"
      >
        {/* Glow backdrop effect for that signature Vaelox AI IDE brand identity */}
        <span className="absolute inset-0 m-auto w-10 h-10 bg-brand-500/20 rounded-full blur-md opacity-70 animate-pulse pointer-events-none" />
        
        <div className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/25 transition-all duration-200",
          isEditorMode ? "w-7 h-7" : "w-9 h-9 hover:scale-105"
        )}>
          <Sparkles className={isEditorMode ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
        </div>
        {!isEditorMode && <span className="text-[9px] mt-0.5 font-bold text-brand-600 dark:text-brand-400 leading-none">AI Chat</span>}
      </button>

      {/* Terminal Tab */}
      <button
        onClick={() => handleTabClick('terminal')}
        className={cn(
          "flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none",
          isEditorMode ? "w-10 h-8" : "w-14 h-12",
          bottomPanelState === 'open'
            ? "text-brand-600 dark:text-brand-500" 
            : "text-vaelox-muted hover:text-vaelox-text"
        )}
        style={{ minHeight: isEditorMode ? '32px' : '44px', minWidth: isEditorMode ? '32px' : '44px' }}
        aria-label="Terminal"
      >
        <Terminal className={cn("transition-transform duration-200", isEditorMode ? "w-4 h-4" : "w-5 h-5")} />
        {!isEditorMode && <span className="text-[9px] mt-0.5 font-medium leading-none">Terminal</span>}
      </button>

      {/* Settings Tab */}
      <button
        onClick={() => handleTabClick('settings')}
        className={cn(
          "flex flex-col items-center justify-center transition-all cursor-pointer select-none outline-none",
          isEditorMode ? "w-10 h-8" : "w-14 h-12",
          mobileTab === 'settings'
            ? "text-brand-600 dark:text-brand-500" 
            : "text-vaelox-muted hover:text-vaelox-text"
        )}
        style={{ minHeight: isEditorMode ? '32px' : '44px', minWidth: isEditorMode ? '32px' : '44px' }}
        aria-label="Settings"
      >
        <Settings className={cn("transition-transform duration-200", isEditorMode ? "w-4 h-4" : "w-5 h-5")} />
        {!isEditorMode && <span className="text-[9px] mt-0.5 font-medium leading-none">Settings</span>}
      </button>
    </motion.nav>
  );
}
