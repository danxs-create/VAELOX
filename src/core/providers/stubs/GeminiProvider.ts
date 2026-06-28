import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class GeminiProvider implements IModelProvider {
  public id = 'gemini';
  public name = 'Google Gemini';
  public metadata: ModelMetadata = {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    contextWindow: 1000000,
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.LONG_CONTEXT],
    pricing: { inputPer1k: 0.01, outputPer1k: 0.02 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from Gemini',
    };
  }
}
