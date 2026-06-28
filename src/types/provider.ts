import { TokenUsage } from './token';
import { CostEstimation } from './cost';
import { ChatMessage } from './chat';

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderResponse {
  content: string;
  tokenUsage?: TokenUsage;
  cost?: CostEstimation;
}

export interface ModelProvider {
  id: string;
  name: string;
  generateContent(messages: ChatMessage[], config?: Partial<ProviderConfig>): Promise<ProviderResponse>;
}
