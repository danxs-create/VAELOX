export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
}

export class CostCalculator {
  public calculate(inputTokens: number, outputTokens: number, pricing: ModelPricing): number {
    const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1k;
    return inputCost + outputCost;
  }
}

export class UsageTracker {
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private totalCost = 0;

  public recordUsage(inputTokens: number, outputTokens: number, cost: number): void {
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalCost += cost;
  }

  public getUsage() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalCost: this.totalCost,
    };
  }
}
