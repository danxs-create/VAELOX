'use client';

import React from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { EditorArea } from './EditorArea';
import { RightPanel } from './RightPanel';
import { BottomPanel } from './BottomPanel';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { MobileDrawer } from './MobileDrawer';
import { BottomNav } from './BottomNav';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

function LayoutContent() {
  const { rightPanelState, setRightPanelState, isMobile } = useLayout();

  // On mobile, let's offset the main workspace panels so the bottom navigation doesn't clip content
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-vaelox-bg text-vaelox-text selection:bg-brand-500/30">
      {/* Search / Command Palette Modal Overlay */}
      <CommandPalette />

      {/* Slide-in Drawers for Mobile Navigation */}
      <MobileDrawer />

      <div className="flex flex-1 overflow-hidden relative pb-[36px] md:pb-0">
        {/* Left Side: Desktop Activity Bar */}
        <ActivityBar />
        
        {/* Left Side: Collapsible Desktop Sidebar */}
        <div className="absolute inset-y-0 left-12 z-20 md:relative md:left-0 shadow-2xl md:shadow-none h-full flex">
          <Sidebar />
        </div>
        
        {/* Center Canvas: Code Editor & Bottom Terminal */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 pb-5 md:pb-0">
          <EditorArea />
          <BottomPanel />
        </div>
        
        {/* Right Side: AI Chat & Intelligent Copilot */}
        <RightPanel />

        {/* Mobile backdrop overlay for the right AI panel */}
        {rightPanelState === 'open' && (
          <div 
            className="md:hidden fixed inset-0 bg-black/20 dark:bg-black/40 z-20 backdrop-blur-sm"
            onClick={() => setRightPanelState('closed')}
            aria-hidden="true"
          />
        )}
      </div>
      
      {/* Mobile Bottom Navigation Bar */}
      <BottomNav />

      {/* Bottom Status Bar - Hidden on mobile to maximize viewport size */}
      <div className="hidden md:block shrink-0">
        <StatusBar />
      </div>
    </div>
  );
}

export function MainLayout() {
  return (
    <LayoutProvider>
      <WorkspaceProvider>
        <LayoutContent />
      </WorkspaceProvider>
    </LayoutProvider>
  );
}
