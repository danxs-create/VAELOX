import { BaseError } from './base';

export class ProviderError extends BaseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROVIDER_ERROR', context);
  }
}
