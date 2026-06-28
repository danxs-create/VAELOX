import { ILifecycle, HealthStatus } from '../lifecycle/types';

export abstract class BaseService implements ILifecycle {
  protected _isInitialized = false;
  protected _isRunning = false;
  protected _startTime = 0;

  constructor(public readonly name: string) {}

  public async initialize(): Promise<void> {
    this._isInitialized = true;
  }

  public async start(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error(`Service ${this.name} must be initialized before starting.`);
    }
    this._isRunning = true;
    this._startTime = Date.now();
  }

  public async stop(): Promise<void> {
    this._isRunning = false;
  }

  public async dispose(): Promise<void> {
    await this.stop();
    this._isInitialized = false;
  }

  public async healthCheck(): Promise<HealthStatus> {
    return {
      service: this.name,
      healthy: this._isRunning,
      uptime: this._isRunning ? Date.now() - this._startTime : 0,
      lastCheck: Date.now(),
    };
  }
}
