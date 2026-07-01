'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PanelState = 'open' | 'closed';
type MobileTab = 'home' | 'explorer' | 'ai' | 'terminal' | 'settings';
type DrawerPanel = 'explorer' | 'git' | 'extensions' | null;

interface LayoutContextType {
  sidebarState: PanelState;
  setSidebarState: (state: PanelState) => void;
  toggleSidebar: () => void;
  
  rightPanelState: PanelState;
  setRightPanelState: (state: PanelState) => void;
  toggleRightPanel: () => void;
  
  bottomPanelState: PanelState;
  setBottomPanelState: (state: PanelState) => void;
  toggleBottomPanel: () => void;
  
  activeActivity: string | null;
  setActiveActivity: (activity: string | null) => void;
  
  // Mobile states
  isMobile: boolean;
  keyboardOpen: boolean;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  drawerPanel: DrawerPanel;
  setDrawerPanel: (panel: DrawerPanel) => void;
  
  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Settings Overlay
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SIDEBAR: 'vaelox-layout-sidebar',
  RIGHT_PANEL: 'vaelox-layout-right-panel',
  BOTTOM_PANEL: 'vaelox-layout-bottom-panel',
  ACTIVE_ACTIVITY: 'vaelox-layout-active-activity',
  MOBILE_TAB: 'vaelox-layout-mobile-tab',
};

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarState, setSidebarState] = useState<PanelState>('open');
  const [rightPanelState, setRightPanelState] = useState<PanelState>('closed');
  const [bottomPanelState, setBottomPanelState] = useState<PanelState>('closed');
  const [activeActivity, setActiveActivity] = useState<string | null>('explorer');
  
  // Mobile & responsive states
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [keyboardOpen, setKeyboardOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTabState] = useState<MobileTab>('home');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerPanel, setDrawerPanel] = useState<DrawerPanel>(null);
  
  // Command Palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Load and sync state on mount
  useEffect(() => {
    try {
      const savedSidebar = localStorage.getItem(STORAGE_KEYS.SIDEBAR) as PanelState | null;
      const savedRight = localStorage.getItem(STORAGE_KEYS.RIGHT_PANEL) as PanelState | null;
      const savedBottom = localStorage.getItem(STORAGE_KEYS.BOTTOM_PANEL) as PanelState | null;
      const savedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVE_ACTIVITY);
      const savedMobileTab = localStorage.getItem(STORAGE_KEYS.MOBILE_TAB) as MobileTab | null;

      const timer = setTimeout(() => {
        if (savedSidebar === 'open' || savedSidebar === 'closed') setSidebarState(savedSidebar);
        if (savedRight === 'open' || savedRight === 'closed') setRightPanelState(savedRight);
        if (savedBottom === 'open' || savedBottom === 'closed') setBottomPanelState(savedBottom);
        if (savedActivity !== null) setActiveActivity(savedActivity || null);
        if (savedMobileTab === 'home' || savedMobileTab === 'explorer' || savedMobileTab === 'ai' || savedMobileTab === 'terminal' || savedMobileTab === 'settings') {
          setMobileTabState(savedMobileTab);
        }
      }, 0);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Failed to load layout from localStorage:', e);
    }
  }, []);

  // Screen resize & Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // initial run
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard open detection for mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      const handleViewportResize = () => {
        const isKeyboard = window.innerHeight - visualViewport.height > 120;
        setKeyboardOpen(isKeyboard);
      };
      visualViewport.addEventListener('resize', handleViewportResize);
      return () => visualViewport.removeEventListener('resize', handleViewportResize);
    }
  }, []);

  // Save states to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, sidebarState);
    } catch (e) {
      console.error(e);
    }
  }, [sidebarState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RIGHT_PANEL, rightPanelState);
    } catch (e) {
      console.error(e);
    }
  }, [rightPanelState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOTTOM_PANEL, bottomPanelState);
    } catch (e) {
      console.error(e);
    }
  }, [bottomPanelState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACTIVITY, activeActivity || '');
    } catch (e) {
      console.error(e);
    }
  }, [activeActivity]);

  const setMobileTab = (tab: MobileTab) => {
    setMobileTabState(tab);
    try {
      localStorage.setItem(STORAGE_KEYS.MOBILE_TAB, tab);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSidebar = () => {
    setSidebarState(prev => (prev === 'open' ? 'closed' : 'open'));
  };

  const toggleRightPanel = () => {
    setRightPanelState(prev => (prev === 'open' ? 'closed' : 'open'));
  };

  const toggleBottomPanel = () => {
    setBottomPanelState(prev => (prev === 'open' ? 'closed' : 'open'));
  };

  return (
    <LayoutContext.Provider
      value={{
        sidebarState,
        setSidebarState,
        toggleSidebar,
        
        rightPanelState,
        setRightPanelState,
        toggleRightPanel,
        
        bottomPanelState,
        setBottomPanelState,
        toggleBottomPanel,
        
        activeActivity,
        setActiveActivity,
        
        // Mobile layout states
        isMobile,
        keyboardOpen,
        mobileTab,
        setMobileTab,
        drawerOpen,
        setDrawerOpen,
        drawerPanel,
        setDrawerPanel,
        
        // Command Palette
        commandPaletteOpen,
        setCommandPaletteOpen,
        
        // Settings Overlay
        settingsOpen,
        setSettingsOpen,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
