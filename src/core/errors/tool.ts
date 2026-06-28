import { BaseError } from './base';

export class ToolExecutionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TOOL_EXECUTION_ERROR', context);
  }
}
