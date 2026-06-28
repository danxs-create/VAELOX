export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, baseDelayMs: 1000, maxDelayMs: 10000 }
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt > options.maxRetries) {
        throw error;
      }
      const delayMs = Math.min(options.baseDelayMs * Math.pow(2, attempt - 1), options.maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
