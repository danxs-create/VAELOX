import { AgentCapability } from './agent';

export enum WorkflowNodeType {
  PLANNER = 'PLANNER',
  EXECUTOR = 'EXECUTOR',
  REVIEWER = 'REVIEWER',
  TOOL = 'TOOL',
  MEMORY = 'MEMORY',
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  priority?: number;
  agentId?: string;
  requiredCapabilities?: AgentCapability[];
  dependencies: string[];
  isParallel?: boolean;
  config?: Record<string, unknown>;
}

export enum DependencyType {
  HARD = 'HARD',
  SOFT = 'SOFT',
  OPTIONAL = 'OPTIONAL',
}

export interface WorkflowEdge {
  from: string;
  to: string;
  dependencyType?: DependencyType;
  condition?: (result: unknown) => boolean;
}

export enum ExecutionStrategy {
  SEQUENTIAL = 'SEQUENTIAL',
  PARALLEL = 'PARALLEL',
  CONDITIONAL = 'CONDITIONAL',
}

export interface WorkflowMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  totalTokens: number;
  totalCost: number;
  nodeMetrics: Record<string, unknown>;
}

export interface WorkflowState {
  nodes: Map<string, WorkflowNode>;
  edges: WorkflowEdge[];
  metrics: WorkflowMetrics;
  executionStrategy?: ExecutionStrategy;
}

export interface WorkflowMiddlewareContext {
  node: WorkflowNode;
  graph: unknown;
  input: unknown;
}

export interface IWorkflowMiddleware {
  beforeExecute?(context: WorkflowMiddlewareContext): Promise<void>;
  afterExecute?(context: WorkflowMiddlewareContext, result: unknown): Promise<void>;
  onError?(context: WorkflowMiddlewareContext, error: Error): Promise<void>;
}

export enum ValidationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  nodeId?: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
  errors: string[];
}
