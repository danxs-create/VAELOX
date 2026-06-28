import { ModelProvider, ProviderConfig, ProviderResponse, ChatMessage } from '../../types';

export abstract class BaseProvider implements ModelProvider {
  constructor(
    public readonly id: string,
    public readonly name: string,
    protected config: ProviderConfig,
  ) {}

  public abstract generateContent(
    messages: ChatMessage[],
    config?: Partial<ProviderConfig>
  ): Promise<ProviderResponse>;
}
