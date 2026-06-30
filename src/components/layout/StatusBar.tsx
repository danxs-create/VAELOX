'use client';

import React from 'react';
import { GitBranch, Wifi, CheckCircle2, Cloud } from 'lucide-react';

export function StatusBar() {
  return (
    <div className="h-6 w-full bg-brand-600 dark:bg-brand-900 text-white flex items-center justify-between px-3 text-xs font-medium select-none shrink-0 z-30 safe-pb safe-pl safe-pr">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-colors">
          <GitBranch className="w-3.5 h-3.5" />
          <span>main</span>
        </div>
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-colors">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>0 Errors, 0 Warnings</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-colors">
          <Cloud className="w-3.5 h-3.5" />
          <span>Vaelox Sync</span>
        </div>
        <div className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 h-full cursor-pointer transition-colors">
          <Wifi className="w-3.5 h-3.5" />
          <span>Ready</span>
        </div>
      </div>
    </div>
  );
}
