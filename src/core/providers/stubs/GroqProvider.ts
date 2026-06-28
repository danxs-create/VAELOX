import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class GroqProvider implements IModelProvider {
  public id = 'groq';
  public name = 'Groq';
  public metadata: ModelMetadata = {
    id: 'llama-3',
    name: 'Llama 3 70B',
    provider: 'Groq',
    contextWindow: 8192,
    capabilities: [ModelCapability.CHAT],
    pricing: { inputPer1k: 0.0001, outputPer1k: 0.0001 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from Groq',
    };
  }
}
