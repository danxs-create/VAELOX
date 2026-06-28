export interface HealthStatus {
  service: string;
  healthy: boolean;
  uptime: number;
  lastCheck: number;
  details?: Record<string, unknown>;
}

export interface ILifecycle {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  dispose(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
}
