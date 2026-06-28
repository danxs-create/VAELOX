import { BaseEvent } from '../../types';
import { AgentResult, AgentConfig } from '../../types/agent';

export interface AgentStartedEvent extends BaseEvent<{
  agentConfig: AgentConfig;
  taskId: string;
}> {}

export interface AgentCompletedEvent extends BaseEvent<{
  agentConfig: AgentConfig;
  taskId: string;
  result: AgentResult;
}> {}

export interface AgentFailedEvent extends BaseEvent<{
  agentConfig: AgentConfig;
  taskId: string;
  error: Error;
}> {}

export interface PlanningStartedEvent extends BaseEvent<{
  taskId: string;
}> {}

export interface PlanningCompletedEvent extends BaseEvent<{
  taskId: string;
  plan: unknown;
}> {}

export interface ReviewCompletedEvent extends BaseEvent<{
  taskId: string;
  feedback: unknown;
  approved: boolean;
}> {}
