export class TokenEstimator {
  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export class TokenCounter {
  private estimator = new TokenEstimator();
  public count(text: string): number {
    return this.estimator.estimateTokens(text);
  }
}

export class ContextWindowManager {
  constructor(private maxTokens: number) {}

  public isWithinLimits(tokens: number): boolean {
    return tokens <= this.maxTokens;
  }
}
