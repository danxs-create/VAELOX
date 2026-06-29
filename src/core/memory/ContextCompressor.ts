import { randomUUID } from 'crypto';
import { IContextCompressor, ContextBudget } from '../../types/memory';
import { EventBus } from '../events/EventBus';

export class ContextCompressor implements IContextCompressor {
  constructor(private eventBus: EventBus) {}

  public estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public async compress(context: string, budget: ContextBudget): Promise<string> {
    const originalTokens = this.estimateTokens(context);
    if (originalTokens <= budget.maxTokens - budget.reservedTokens) {
      return context; 
    }

    const allowedChars = (budget.maxTokens - budget.reservedTokens) * 4;
    const compressed = context.substring(0, allowedChars) + '...';
    
    this.eventBus.publish('memory.compressed', {
       id: randomUUID(),
       name: 'memory.compressed',
       timestamp: Date.now(),
       source: 'ContextCompressor',
       payload: {
         originalTokens,
         compressedTokens: this.estimateTokens(compressed)
       }
    });

    return compressed;
  }
}
