export enum ModelCapability {
  CHAT = 'CHAT',
  STREAMING = 'STREAMING',
  VISION = 'VISION',
  EMBEDDING = 'EMBEDDING',
  TOOL_CALLING = 'TOOL_CALLING',
  FUNCTION_CALLING = 'FUNCTION_CALLING',
  LONG_CONTEXT = 'LONG_CONTEXT',
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  pricing: {
    inputPer1k: number;
    outputPer1k: number;
  };
}
