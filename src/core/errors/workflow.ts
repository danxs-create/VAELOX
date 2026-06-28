import { BaseError } from './base';

export class WorkflowError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'WORKFLOW_ERROR', context);
  }
}
