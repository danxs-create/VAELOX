export enum RecoveryAction {
  RETRY = 'RETRY',
  SKIP = 'SKIP',
  STOP = 'STOP',
}

export interface RecoveryPolicy {
  maxRetries: number;
  actionOnFail: RecoveryAction;
}

export class VaeloxError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'VaeloxError';
  }
}
