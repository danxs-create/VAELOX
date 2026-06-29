import { ContextBuilder } from './ContextBuilder';
import { ContextCompressor } from './ContextCompressor';

export class PromptAssembler {
  constructor(
    private builder: ContextBuilder,
    private compressor: ContextCompressor
  ) {}

  public async assemble(
    systemPrompt: string,
    instruction: string,
    currentRequest: string,
    maxTokens: number = 4000
  ): Promise<string> {
    const rawContextParts = await this.builder.buildContext(currentRequest);
    const rawContext = rawContextParts.join('\n\n');

    const reservedTokens = 
       this.compressor.estimateTokens(systemPrompt) + 
       this.compressor.estimateTokens(instruction) + 
       this.compressor.estimateTokens(currentRequest) + 100;

    const compressedContext = await this.compressor.compress(rawContext, {
      maxTokens,
      reservedTokens
    });

    return [
      systemPrompt,
      compressedContext,
      currentRequest,
      instruction
    ].filter(Boolean).join('\n\n---\n\n');
  }
}
