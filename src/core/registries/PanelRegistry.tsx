'use client';

import React from 'react';
import { 
  Files, 
  Search, 
  GitBranch, 
  MessageSquare, 
  Terminal, 
  Settings, 
  Workflow, 
  Brain,
  Blocks
} from 'lucide-react';
import { ExplorerPanel } from '@/components/layout/ExplorerPanel';
import { AIChatPanel } from '@/components/panels/chat/AIChatPanel';
import { ToolExecutionPanel } from '@/components/panels/tools/ToolExecutionPanel';

export interface PanelConfig {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  position: 'sidebar' | 'right' | 'bottom';
  component: React.ComponentType<any>;
}

class PanelRegistry {
  private panels: Map<string, PanelConfig> = new Map();

  constructor() {
    // Register default panels
    this.register({
      id: 'explorer',
      title: 'Explorer',
      icon: Files,
      position: 'sidebar',
      component: ExplorerPanel
    });

    this.register({
      id: 'search',
      title: 'Search',
      icon: Search,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">Search in Workspace</span>
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full px-2.5 py-1.5 text-xs bg-vaelox-surface border border-vaelox-border rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )
    });

    this.register({
      id: 'source-control',
      title: 'Source Control',
      icon: GitBranch,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">Source Control</span>
          <div className="p-4 border-2 border-dashed border-vaelox-border rounded text-center text-xs text-vaelox-muted">
            Initialize git repository or stage changes.
          </div>
        </div>
      )
    });

    this.register({
      id: 'chat',
      title: 'AI Chat',
      icon: MessageSquare,
      position: 'right',
      component: AIChatPanel
    });

    this.register({
      id: 'terminal',
      title: 'Terminal',
      icon: Terminal,
      position: 'bottom',
      component: () => (
        <div className="font-mono text-xs flex flex-col gap-1 text-green-500 p-2">
          <div>$ neofetch --ascii_distro vaelox</div>
          <div className="text-vaelox-text">Vaelox OS v1.0.0 (x86_64)</div>
          <div className="text-vaelox-muted">$ _</div>
        </div>
      )
    });

    this.register({
      id: 'tools',
      title: 'Tool Executions',
      icon: Workflow,
      position: 'bottom',
      component: ToolExecutionPanel
    });

    this.register({
      id: 'workflow',
      title: 'Workflow',
      icon: Workflow,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">Workflow Executor</span>
          <div className="p-4 border-2 border-dashed border-vaelox-border rounded text-center text-xs text-vaelox-muted">
            Configure agentic execution pipelines and workflows.
          </div>
        </div>
      )
    });

    this.register({
      id: 'memory',
      title: 'Memory View',
      icon: Brain,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">Agent Memory Layer</span>
          <div className="p-4 border-2 border-dashed border-vaelox-border rounded text-center text-xs text-vaelox-muted">
            Inspect working, session, project, and global memories.
          </div>
        </div>
      )
    });

    this.register({
      id: 'extensions',
      title: 'Extensions',
      icon: Blocks,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">Extensions Marketplace</span>
          <div className="p-4 border-2 border-dashed border-vaelox-border rounded text-center text-xs text-vaelox-muted">
            Manage your plugins and language tools.
          </div>
        </div>
      )
    });

    this.register({
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      position: 'sidebar',
      component: () => (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-vaelox-muted uppercase tracking-wider">IDE Settings</span>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-vaelox-text">Font Family</label>
            <select className="px-2 py-1.5 text-xs bg-vaelox-surface border border-vaelox-border rounded">
              <option>Inter (Sans-Serif)</option>
              <option>JetBrains Mono</option>
            </select>
          </div>
        </div>
      )
    });
  }

  public register(config: PanelConfig) {
    this.panels.set(config.id, config);
  }

  public getPanel(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }

  public getPanelsByPosition(position: 'sidebar' | 'right' | 'bottom'): PanelConfig[] {
    return Array.from(this.panels.values()).filter(p => p.position === position);
  }

  public getAllPanels(): PanelConfig[] {
    return Array.from(this.panels.values());
  }
}

export const panelRegistry = new PanelRegistry();
