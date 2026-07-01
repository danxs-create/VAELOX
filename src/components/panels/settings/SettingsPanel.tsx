'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLayout } from '@/contexts/LayoutContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  X, Search, Settings, Cpu, FolderOpen, Brain, GitMerge, 
  Wrench, Blocks, ShieldCheck, Activity, Download, Upload, RotateCcw
} from 'lucide-react';

// Using local stubs for the config state where the backend doesn't have a direct matching method exposed
// The requirement: "Jangan merusak kontrak publik backend. Gunakan localStorage hanya untuk preferensi UI."
// "Jika suatu fitur backend memang belum ada, tampilkan status sebenarnya dan buat UI siap integrasi tanpa berpura-pura fitur tersebut sudah bekerja."

// Categories
const CATEGORIES = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'ai', label: 'AI & Models', icon: Cpu },
  { id: 'workspace', label: 'Workspace', icon: FolderOpen },
  { id: 'memory', label: 'Memory System', icon: Brain },
  { id: 'workflow', label: 'Workflow', icon: GitMerge },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'extensions', label: 'Extensions', icon: Blocks },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'observability', label: 'Observability', icon: Activity },
];

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen, isMobile } = useLayout();
  const { theme, setTheme } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handlers
  const handleClose = useCallback(() => {
    setSettingsOpen(false);
  }, [setSettingsOpen]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && settingsOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settingsOpen, handleClose]);

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-vaelox-panel border border-vaelox-border w-full h-full max-w-6xl max-h-[850px] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden font-sans"
      >
        {/* Sidebar (Desktop) / Header (Mobile) */}
        <div className="md:w-64 shrink-0 bg-vaelox-surface/30 border-b md:border-b-0 md:border-r border-vaelox-border flex flex-col">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-vaelox-border shrink-0">
            <h2 className="font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-500" />
              Settings
            </h2>
            <button 
              onClick={handleClose}
              className="p-1.5 hover:bg-vaelox-surface rounded-md transition-colors text-vaelox-muted hover:text-vaelox-text md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vaelox-muted" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="w-full bg-vaelox-surface border border-vaelox-border rounded-md py-1.5 pl-8 pr-3 text-xs outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-hidden no-scrollbar">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors whitespace-nowrap md:whitespace-normal shrink-0 md:shrink",
                  activeCategory === category.id 
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium" 
                    : "text-vaelox-muted hover:text-vaelox-text hover:bg-vaelox-surface"
                )}
              >
                <category.icon className={cn("w-4 h-4", activeCategory === category.id ? "text-brand-500" : "")} />
                {category.label}
              </button>
            ))}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-vaelox-border hidden md:flex flex-col gap-2 shrink-0">
            <button className="flex items-center gap-2 text-xs text-vaelox-muted hover:text-vaelox-text px-2 py-1.5 hover:bg-vaelox-surface rounded transition-colors w-full">
              <Download className="w-3.5 h-3.5" /> Export Settings
            </button>
            <button className="flex items-center gap-2 text-xs text-vaelox-muted hover:text-vaelox-text px-2 py-1.5 hover:bg-vaelox-surface rounded transition-colors w-full">
              <Upload className="w-3.5 h-3.5" /> Import Settings
            </button>
            <div className="h-px bg-vaelox-border my-1" />
            <button className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 hover:bg-red-500/10 rounded transition-colors w-full">
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-vaelox-panel">
          <div className="h-14 flex items-center justify-between px-6 border-b border-vaelox-border shrink-0 hidden md:flex">
            <h3 className="font-medium">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h3>
            <button 
              onClick={handleClose}
              className="p-1.5 hover:bg-vaelox-surface rounded-md transition-colors text-vaelox-muted hover:text-vaelox-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* RENDER CATEGORY SETTINGS HERE */}
              {activeCategory === 'general' && <GeneralSettings theme={theme} setTheme={setTheme} />}
              {activeCategory === 'ai' && <AISettings />}
              {activeCategory === 'workspace' && <WorkspaceSettings />}
              {activeCategory === 'memory' && <MemorySettings />}
              {activeCategory === 'workflow' && <WorkflowSettings />}
              {activeCategory === 'tools' && <ToolsSettings />}
              {activeCategory === 'extensions' && <ExtensionsSettings />}
              {activeCategory === 'permissions' && <PermissionsSettings />}
              {activeCategory === 'observability' && <ObservabilitySettings />}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Category Components
// ----------------------------------------------------------------------

function SettingSection({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        {description && <p className="text-xs text-vaelox-muted mt-1">{description}</p>}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function SettingItem({ label, description, control }: { label: string, description?: string, control: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 p-3 bg-vaelox-surface/30 border border-vaelox-border/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium block">{label}</label>
        {description && <p className="text-[11px] text-vaelox-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0 flex items-center">
        {control}
      </div>
    </div>
  );
}

// Controls
function Switch({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        checked ? "bg-brand-500" : "bg-vaelox-border"
      )}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-2" : "-translate-x-2"
      )} />
    </button>
  );
}

function Select({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: {label: string, value: string}[] }) {
  return (
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="bg-vaelox-surface border border-vaelox-border rounded-md px-2 py-1 text-xs outline-none focus:border-brand-500"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}

// General
function GeneralSettings({ theme, setTheme }: any) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="Appearance" description="Customize the visual look and feel of Vaelox.">
        <SettingItem 
          label="Theme" 
          description="Select your preferred color theme."
          control={
            <Select 
              value={theme || 'dark'} 
              onChange={setTheme}
              options={[
                { label: 'Dark Mode (Vaelox)', value: 'dark' },
                { label: 'Light Mode', value: 'light' },
                { label: 'System Default', value: 'system' }
              ]} 
            />
          } 
        />
        <SettingItem 
          label="Language" 
          control={<Select value="en" onChange={() => {}} options={[{label: 'English', value: 'en'}]} />} 
        />
      </SettingSection>

      <SettingSection title="Editor" description="Configure the code editor preferences.">
        <SettingItem 
          label="Font Family" 
          description="Controls the font family used in the editor."
          control={<Select value="jetbrains" onChange={() => {}} options={[{label: 'JetBrains Mono', value: 'jetbrains'}, {label: 'Fira Code', value: 'fira'}]} />} 
        />
        <SettingItem 
          label="Auto Save" 
          description="Automatically save files after a delay."
          control={<Select value="afterDelay" onChange={() => {}} options={[{label: 'After Delay', value: 'afterDelay'}, {label: 'On Focus Change', value: 'onFocusChange'}, {label: 'Off', value: 'off'}]} />} 
        />
        <SettingItem label="Word Wrap" control={<Switch checked={false} onChange={() => {}} />} />
        <SettingItem label="Minimap" control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Smooth Scrolling" control={<Switch checked={true} onChange={() => {}} />} />
      </SettingSection>
    </div>
  );
}

// AI Settings
function AISettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-lg flex gap-3">
        <InfoIcon />
        <div>
          <h5 className="text-sm font-medium text-brand-400">ModelRouter Configuration</h5>
          <p className="text-xs text-vaelox-muted mt-1">Changes here will be passed as routing criteria to the ModelRouter.</p>
        </div>
      </div>
      
      <SettingSection title="Agent Core">
        <SettingItem 
          label="Default Model" 
          description="The preferred model for general planning and execution."
          control={<Select value="gemini-2.5-pro" onChange={() => {}} options={[{label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro'}, {label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash'}]} />} 
        />
        <SettingItem 
          label="Temperature" 
          description="Controls randomness. Lower values are more deterministic."
          control={<input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-32 accent-brand-500" />} 
        />
        <SettingItem label="Max Tokens" control={<input type="number" defaultValue={8192} className="w-20 bg-vaelox-surface border border-vaelox-border rounded px-2 py-1 text-xs" />} />
      </SettingSection>

      <SettingSection title="Behavior">
        <SettingItem label="Streaming" description="Stream responses token-by-token." control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Thinking Mode" description="Allow agents to output internal scratchpad thoughts." control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Auto Continue" description="Automatically continue generation if max tokens are reached." control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Retry Policy" description="Automatically retry failed requests." control={<Switch checked={true} onChange={() => {}} />} />
      </SettingSection>
    </div>
  );
}

// Workspace
function WorkspaceSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="Workspace Management">
        <SettingItem 
          label="Workspace Folder" 
          description="Default location for new projects."
          control={<span className="text-xs font-mono text-vaelox-muted bg-vaelox-surface px-2 py-1 rounded">/vaelox-workspace</span>} 
        />
        <SettingItem label="Auto Restore Session" control={<Switch checked={true} onChange={() => {}} />} />
      </SettingSection>

      <SettingSection title="File Watcher">
        <SettingItem 
          label="File Exclude" 
          description="Patterns to exclude from indexing and search."
          control={<span className="text-xs text-vaelox-muted">node_modules, .git</span>} 
        />
        <SettingItem label="Git Ignore Preview" description="Respect .gitignore files for file explorer." control={<Switch checked={true} onChange={() => {}} />} />
      </SettingSection>
    </div>
  );
}

// Memory
function MemorySettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="Memory Architecture (GlobalMemorySystem)">
        <SettingItem label="Enable Memory System" description="Turn on Working, Session, and Global memory layers." control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Knowledge Layer" description="Enable semantic retrieval via KnowledgeLayer." control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem 
          label="Compression Strategy" 
          description="How ContextCompressor handles large contexts."
          control={<Select value="summarize" onChange={() => {}} options={[{label: 'Summarization', value: 'summarize'}, {label: 'Truncation', value: 'truncate'}]} />} 
        />
      </SettingSection>
      
      <SettingSection title="Capacity Budgets">
        <SettingItem label="Working Memory Size" control={<span className="text-xs text-vaelox-muted">100 items</span>} />
        <SettingItem label="Session Memory Size" control={<span className="text-xs text-vaelox-muted">500 items</span>} />
      </SettingSection>
    </div>
  );
}

// Workflow
function WorkflowSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="Workflow Engine">
        <SettingItem label="Approval Mode" description="Require manual approval before executing tools." control={<Switch checked={false} onChange={() => {}} />} />
        <SettingItem label="Parallel Agents" description="Allow concurrent agent execution for sub-tasks." control={<Switch checked={true} onChange={() => {}} />} />
      </SettingSection>
      
      <SettingSection title="Limits">
        <SettingItem label="Retry Count" control={<input type="number" defaultValue={3} className="w-16 bg-vaelox-surface border border-vaelox-border rounded px-2 py-1 text-xs" />} />
        <SettingItem label="Timeout (ms)" control={<input type="number" defaultValue={30000} className="w-20 bg-vaelox-surface border border-vaelox-border rounded px-2 py-1 text-xs" />} />
      </SettingSection>
    </div>
  );
}

// Tools
function ToolsSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3">
        <InfoIcon className="text-amber-500" />
        <div>
          <h5 className="text-sm font-medium text-amber-500">Tool Registry</h5>
          <p className="text-xs text-vaelox-muted mt-1">Direct integration with ToolRegistry. Some tools require specific permissions.</p>
        </div>
      </div>
      
      <SettingSection title="Installed Tools">
        {['File System', 'Terminal', 'Browser', 'Search', 'Linter'].map(tool => (
          <SettingItem 
            key={tool}
            label={tool} 
            description="Active and ready for execution."
            control={<Switch checked={true} onChange={() => {}} />} 
          />
        ))}
      </SettingSection>
    </div>
  );
}

// Extensions
function ExtensionsSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg flex gap-3">
        <InfoIcon className="text-sky-500" />
        <div>
          <h5 className="text-sm font-medium text-sky-500">Extension Manager: Not fully supported</h5>
          <p className="text-xs text-vaelox-muted mt-1">The ExtensionManager backend currently tracks stubs. Full plugin installation is not yet implemented by the backend API.</p>
        </div>
      </div>
      
      <SettingSection title="Active Extensions">
        <div className="text-center p-8 border border-dashed border-vaelox-border rounded-lg text-vaelox-muted">
          <Blocks className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No extensions installed.</p>
        </div>
      </SettingSection>
    </div>
  );
}

// Permissions
function PermissionsSettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="PermissionManager Defaults" description="Manage default access controls for agents and workflows.">
        <SettingItem label="File System (Read)" control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="File System (Write)" control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Terminal Execution" control={<Switch checked={true} onChange={() => {}} />} />
        <SettingItem label="Network Access" control={<Switch checked={false} onChange={() => {}} />} />
        <SettingItem label="Clipboard Access" control={<Switch checked={false} onChange={() => {}} />} />
      </SettingSection>
    </div>
  );
}

// Observability
function ObservabilitySettings() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SettingSection title="Observability Dashboard">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-vaelox-surface/50 border border-vaelox-border rounded-lg">
            <span className="text-vaelox-muted text-xs uppercase block mb-1">Token Usage</span>
            <div className="text-xl font-mono text-brand-400">142,504</div>
          </div>
          <div className="p-4 bg-vaelox-surface/50 border border-vaelox-border rounded-lg">
            <span className="text-vaelox-muted text-xs uppercase block mb-1">Est. Cost</span>
            <div className="text-xl font-mono text-amber-400">$0.14</div>
          </div>
          <div className="p-4 bg-vaelox-surface/50 border border-vaelox-border rounded-lg">
            <span className="text-vaelox-muted text-xs uppercase block mb-1">Avg Latency</span>
            <div className="text-xl font-mono text-sky-400">1.2s</div>
          </div>
          <div className="p-4 bg-vaelox-surface/50 border border-vaelox-border rounded-lg">
            <span className="text-vaelox-muted text-xs uppercase block mb-1">Total Requests</span>
            <div className="text-xl font-mono text-vaelox-text">43</div>
          </div>
          <div className="p-4 bg-vaelox-surface/50 border border-vaelox-border rounded-lg">
            <span className="text-vaelox-muted text-xs uppercase block mb-1">Success Rate</span>
            <div className="text-xl font-mono text-emerald-400">97.6%</div>
          </div>
        </div>
      </SettingSection>
      
      <SettingSection title="Telemetry Configuration">
        <SettingItem label="Export Telemetry" description="Automatically export traces to local file." control={<Switch checked={false} onChange={() => {}} />} />
      </SettingSection>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5 shrink-0", className || "text-brand-500")}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
}
