export interface ExecutionContext {
  workspaceId: string;
  workflowId?: string;
  agentId?: string;
  timestamp: number;
}
