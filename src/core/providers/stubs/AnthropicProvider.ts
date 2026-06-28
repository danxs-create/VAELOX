import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class AnthropicProvider implements IModelProvider {
  public id = 'anthropic';
  public name = 'Anthropic';
  public metadata: ModelMetadata = {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION],
    pricing: { inputPer1k: 0.003, outputPer1k: 0.015 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from Anthropic',
    };
  }
}
