import { MemoryManagerImpl } from './MemoryManagerImpl';
import { KnowledgeLayer } from './KnowledgeLayer';
import { ContextCompressor } from './ContextCompressor';
import { ContextBuilder } from './ContextBuilder';
import { PromptAssembler } from './PromptAssembler';
import { globalEventBus } from '../events/globalEventBus';
import { MemoryType } from '../../types/memory';

// Export shared instances using the global EventBus to coordinate state
export const globalMemoryManager = new MemoryManagerImpl(globalEventBus);
export const globalKnowledgeLayer = new KnowledgeLayer();
export const globalContextCompressor = new ContextCompressor(globalEventBus);
export const globalContextBuilder = new ContextBuilder(globalMemoryManager, globalKnowledgeLayer);
export const globalPromptAssembler = new PromptAssembler(globalContextBuilder, globalContextCompressor);

// Initialize with rich, realistic, high-quality data to make the experience feel "alive"
let isInitialized = false;

export function initializeGlobalMemory() {
  if (isInitialized) return;
  isInitialized = true;

  const now = Date.now();

  // Populate Working Memory entries
  globalMemoryManager.working.set(
    'current_user_request',
    'Build a premium, highly responsive and interactive Memory Panel that reads from MemoryManager and visualizes all layers.',
    ['current_intent', 'ui_task'],
    { importance: 0.9, frequency: 4, lastAccessed: now - 5000 }
  );

  globalMemoryManager.working.set(
    'active_panel_context',
    'Active layout tabs: ["workflow", "memory", "terminal"]. Selected: "memory". Device: "desktop".',
    ['state', 'layout'],
    { importance: 0.7, frequency: 12, lastAccessed: now - 1000 }
  );

  globalMemoryManager.working.set(
    'gemini_model_selection',
    'Default model configured to gemini-3.5-flash for real-time response generation.',
    ['config', 'llm'],
    { importance: 0.8, frequency: 2, lastAccessed: now - 15000 }
  );

  // Populate Session Memory entries (represented as sequential stream of experiences/timeline)
  globalMemoryManager.session.set(
    'session_init',
    'Workspace initialized. File explorer loaded 43 items successfully.',
    ['system', 'lifecycle'],
    { importance: 0.4, frequency: 1, lastAccessed: now - 3600000 }
  );

  globalMemoryManager.session.set(
    'build_pipeline_executed',
    'Next.js production build succeeded in 10.6s. Typecheck passed.',
    ['compilation', 'development'],
    { importance: 0.85, frequency: 3, lastAccessed: now - 600000 }
  );

  globalMemoryManager.session.set(
    'linter_check_failed',
    'ESLint warning: next lint is deprecated. Build succeeded despite linter notification.',
    ['warning', 'lint'],
    { importance: 0.5, frequency: 2, lastAccessed: now - 500000 }
  );

  // Populate Project Memory entries (hierarchical/folder grouped structure)
  globalMemoryManager.project.set(
    'src/core/registries/PanelRegistry.tsx',
    'Registry mapping panel IDs to UI components, handles sidebar and bottom positions.',
    ['source_code', 'panel_registry'],
    { importance: 0.75, frequency: 8, lastAccessed: now - 120000 }
  );

  globalMemoryManager.project.set(
    'src/components/panels/workflow/WorkflowVisualizer.tsx',
    'Completed visualizer for agentic flow pipelines with real-time stepper and mini-map.',
    ['source_code', 'workflow'],
    { importance: 0.9, frequency: 14, lastAccessed: now - 60000 }
  );

  globalMemoryManager.project.set(
    'src/types/memory.ts',
    'TypeScript interface types governing MemoryType, MemoryEntry, KnowledgeCategory, and budgets.',
    ['types', 'memory_system'],
    { importance: 0.8, frequency: 6, lastAccessed: now - 180000 }
  );

  // Populate Global Memory entries (long-term semantic context)
  globalMemoryManager.global.set(
    'knowledge_base_rule_1',
    'Always use server-side API routes for private variables like process.env.GEMINI_API_KEY.',
    ['rules', 'security'],
    { importance: 0.95, frequency: 45, lastAccessed: now - 400000 }
  );

  globalMemoryManager.global.set(
    'knowledge_base_rule_2',
    'Ensure all touch targets are at least 44px to satisfy mobile responsiveness constraints.',
    ['rules', 'accessibility'],
    { importance: 0.85, frequency: 28, lastAccessed: now - 450000 }
  );

  // Populate Knowledge Layer categories, sources, and entries
  globalKnowledgeLayer.addCategory({
    id: 'cat-security',
    name: 'Security & API Policies',
    description: 'Guidelines and credentials management policies.'
  });

  globalKnowledgeLayer.addCategory({
    id: 'cat-design',
    name: 'Vaelox Design System',
    description: 'Visual tokens, color standards, typography rules, and responsive specs.'
  });

  globalKnowledgeLayer.addSource({
    id: 'src-docs-1',
    type: 'markdown',
    uri: '/docs/architecture/memory-design.md',
    metadata: { author: 'Vaelox Core', version: '2.1' }
  });

  globalKnowledgeLayer.addSource({
    id: 'src-style-guide',
    type: 'json',
    uri: '/configs/tailwind.config.json',
    metadata: { author: 'Design Guild', lastChecked: now - 86400000 }
  });

  globalKnowledgeLayer.addEntry({
    id: 'k-entry-1',
    content: 'All private keys must reside exclusively on server boundaries. Client components proxy requests through /api endpoints.',
    sourceId: 'src-docs-1',
    categoryId: 'cat-security',
    createdAt: now - 604800000,
    updatedAt: now - 86400000,
    metadata: {
      title: 'Boundary Enforcement Protocol',
      confidence: 0.98,
      relevance: 0.95,
      tags: ['security', 'api-routing', 'encapsulation']
    }
  });

  globalKnowledgeLayer.addEntry({
    id: 'k-entry-2',
    content: 'Vaelox standard visual layout employs a slate-charcoal canvas with rich translucent glass overlays and brand-purple accents.',
    sourceId: 'src-style-guide',
    categoryId: 'cat-design',
    createdAt: now - 504800000,
    updatedAt: now - 76400000,
    metadata: {
      title: 'Atmospheric Glass Theme Design',
      confidence: 0.92,
      relevance: 0.88,
      tags: ['design-system', 'color-tokens', 'glassmorphism']
    }
  });
}
