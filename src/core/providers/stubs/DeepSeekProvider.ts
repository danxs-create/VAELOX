import { ChatMessage, ProviderConfig, ProviderResponse } from '../../../types';
import { IModelProvider } from '../IModelProvider';
import { ModelCapability, ModelMetadata } from '../../models/capabilities';

export class DeepSeekProvider implements IModelProvider {
  public id = 'deepseek';
  public name = 'DeepSeek';
  public metadata: ModelMetadata = {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    contextWindow: 32000,
    capabilities: [ModelCapability.CHAT, ModelCapability.TOOL_CALLING],
    pricing: { inputPer1k: 0.0005, outputPer1k: 0.001 },
  };

  public async generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse> {
    return {
      content: 'Stub response from DeepSeek',
    };
  }
}
