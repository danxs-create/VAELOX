export interface ErrorDetails {
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}
