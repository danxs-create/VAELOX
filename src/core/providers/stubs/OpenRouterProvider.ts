import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class OpenRouterProvider implements IModelProvider {
  public id = 'openrouter';
  public name = 'OpenRouter';
  public metadata: ModelMetadata = {
    id: 'auto',
    name: 'OpenRouter Auto',
    provider: 'OpenRouter',
    contextWindow: 8192,
    capabilities: [ModelCapability.CHAT],
    pricing: { inputPer1k: 0.001, outputPer1k: 0.001 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from OpenRouter',
    };
  }
}
