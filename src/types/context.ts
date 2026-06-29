import { AgentContext, CancellationToken } from './agent';
import { WorkflowMetrics } from './workflow';
import { WorkflowGraph } from '../core/workflow/WorkflowGraph';

export interface ExecutionContext {
  executionId: string;
  workflow: WorkflowGraph;
  agentContext: AgentContext;
  cancellationToken: CancellationToken;
  metrics: WorkflowMetrics;
  timestamp: number;
}
