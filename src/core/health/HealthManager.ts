import { HealthStatus, ILifecycle } from '../lifecycle/types';

export class HealthManager {
  private _services: Map<string, ILifecycle> = new Map();

  public registerService(name: string, service: ILifecycle): void {
    this._services.set(name, service);
  }

  public async checkAll(): Promise<HealthStatus[]> {
    const checks = Array.from(this._services.entries()).map(async ([name, service]) => {
      try {
        return await service.healthCheck();
      } catch (error) {
        return {
          service: name,
          healthy: false,
          uptime: 0,
          lastCheck: Date.now(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
      }
    });

    return Promise.all(checks);
  }
}
