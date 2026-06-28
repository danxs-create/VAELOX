import { BaseError } from './base';

export class PermissionError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PERMISSION_ERROR', context);
  }
}
