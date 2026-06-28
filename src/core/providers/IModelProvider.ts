import { ProviderConfig, ProviderResponse } from '../../types/provider';
import { ChatMessage } from '../../types/chat';
import { ModelMetadata } from '../models/capabilities';

export interface IModelProvider {
  id: string;
  name: string;
  metadata?: ModelMetadata;
  generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse>;
}
