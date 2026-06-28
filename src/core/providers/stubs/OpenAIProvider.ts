import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class OpenAIProvider implements IModelProvider {
  public id = 'openai';
  public name = 'OpenAI';
  public metadata: ModelMetadata = {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextWindow: 128000,
    capabilities: [ModelCapability.CHAT, ModelCapability.VISION, ModelCapability.TOOL_CALLING],
    pricing: { inputPer1k: 0.01, outputPer1k: 0.03 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from OpenAI',
    };
  }
}
