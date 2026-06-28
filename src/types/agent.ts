import { AgentStatus } from '../core/constants';
import { IModelProvider } from '../core/providers/IModelProvider';
import { IWorkspaceProvider } from '../core/providers/IWorkspaceProvider';

export enum AgentCapability {
  PLANNING = 'PLANNING',
  EXECUTION = 'EXECUTION',
  REVIEW = 'REVIEW',
  TOOL_CALLING = 'TOOL_CALLING',
  CODE_GENERATION = 'CODE_GENERATION',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
}

export enum AgentState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  RUNNING = 'RUNNING',
  WAITING = 'WAITING',
  CANCELLING = 'CANCELLING',
  DISPOSED = 'DISPOSED',
}

export interface AgentMetadata {
  version: string;
  author: string;
  description: string;
  supportedCapabilities: AgentCapability[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  modelId: string;
  tools: string[];
  metadata?: AgentMetadata;
}

export interface MemorySnapshot {
  history: unknown[];
  context: Record<string, unknown>;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested(listener: () => void): void;
}

export interface AgentMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  errors: number;
}

export interface AgentContext {
  workspace: IWorkspaceProvider;
  memorySnapshot: MemorySnapshot;
  configuration: Record<string, unknown>;
  provider: IModelProvider;
  cancellationToken: CancellationToken;
  metrics: AgentMetrics;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  retryableErrors?: string[];
}

export interface AgentResult<T = unknown> {
  output?: T;
  status: AgentStatus;
  duration: number;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  error?: Error;
  metadata?: Record<string, unknown>;
  retryPolicy?: RetryPolicy;
}

export interface Agent {
  config: AgentConfig;
  status: AgentStatus;
  state: AgentState;
  execute(task: string, context: AgentContext): Promise<AgentResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
}
