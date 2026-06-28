export interface StreamChunk {
  text: string;
  isFinished: boolean;
}

export interface StreamCallbacks {
  onStart?(): void;
  onChunk?(chunk: StreamChunk): void;
  onFinish?(): void;
  onError?(error: Error): void;
  onCancel?(): void;
}

export interface IStreamingResponse {
  cancel(): void;
  on(callbacks: StreamCallbacks): void;
}
