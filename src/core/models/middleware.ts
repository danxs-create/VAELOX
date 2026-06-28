import { ChatMessage, ProviderConfig, ProviderResponse } from '../../types';

export interface RequestContext {
  messages: ChatMessage[];
  config?: Partial<ProviderConfig>;
  providerId: string;
}

export type NextFunction = (context: RequestContext) => Promise<ProviderResponse>;

export interface IMiddleware {
  execute(context: RequestContext, next: NextFunction): Promise<ProviderResponse>;
}

export class LoggingMiddleware implements IMiddleware {
  public async execute(context: RequestContext, next: NextFunction): Promise<ProviderResponse> {
    // Basic stub for logging
    return next(context);
  }
}

export class ValidationMiddleware implements IMiddleware {
  public async execute(context: RequestContext, next: NextFunction): Promise<ProviderResponse> {
    if (context.messages.length === 0) {
      throw new Error('Validation failed: messages cannot be empty');
    }
    return next(context);
  }
}
