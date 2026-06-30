'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, FolderOpen, Plus, Settings, ShieldAlert, MonitorPlay, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLayout } from '@/contexts/LayoutContext';

export function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState('vaelox-root');
  const [workspacePath, setWorkspacePath] = useState('/app');
  const { setCommandPaletteOpen } = useLayout();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full px-3 py-2 border-b border-vaelox-border shrink-0 select-none z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg bg-vaelox-surface/60 hover:bg-vaelox-surface border border-vaelox-border/60 hover:border-vaelox-border transition-all text-left group cursor-pointer outline-none focus:ring-1 focus:ring-brand-500/50"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Switch Workspace"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <FolderOpen className="w-3.5 h-3.5 stroke-[1.8]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-vaelox-text truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {currentWorkspace}
            </span>
            <span className="text-[9px] text-vaelox-muted truncate font-mono">
              {workspacePath}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-vaelox-muted transition-transform duration-200 shrink-0", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="absolute left-3 right-3 mt-1.5 bg-vaelox-panel border border-vaelox-border rounded-xl shadow-xl overflow-hidden flex flex-col z-50"
          >
            {/* Header info */}
            <div className="px-3 py-2 bg-vaelox-surface/40 border-b border-vaelox-border flex items-center justify-between">
              <span className="text-[10px] font-semibold text-vaelox-muted uppercase tracking-wider">
                Workspaces
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full font-semibold">
                Active
              </span>
            </div>

            {/* Empty list area - "Jika backend belum menyediakan daftar workspace, gunakan state kosong tanpa mock data." */}
            <div className="p-4 text-center flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-6 h-6 text-vaelox-muted opacity-50" />
              <div className="text-[11px] font-bold text-vaelox-text">
                No Other Workspaces
              </div>
              <p className="text-[10px] text-vaelox-muted max-w-[200px] leading-relaxed">
                Connect a WorkspaceManager or load dynamic sources to register workspace mounts.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="p-1 border-t border-vaelox-border bg-vaelox-surface/30 flex flex-col gap-0.5 shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[10px] font-semibold text-vaelox-text rounded-md hover:bg-brand-500 hover:text-white transition-colors group cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-vaelox-muted group-hover:text-white" />
                <span>Search files / commands</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
