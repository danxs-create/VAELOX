import { BaseEvent } from '../../types';
import { WorkflowResult, WorkflowStatus } from '../../types/workflow';

export interface WorkflowStartedEvent extends BaseEvent<{
  workflowId: string;
}> {}

export interface WorkflowPausedEvent extends BaseEvent<{
  workflowId: string;
}> {}

export interface WorkflowResumedEvent extends BaseEvent<{
  workflowId: string;
}> {}

export interface WorkflowCompletedEvent extends BaseEvent<{
  workflowId: string;
  result: WorkflowResult;
}> {}

export interface WorkflowFailedEvent extends BaseEvent<{
  workflowId: string;
  error: Error;
}> {}

export interface WorkflowCancelledEvent extends BaseEvent<{
  workflowId: string;
}> {}
