import { IModelProvider } from '../providers/IModelProvider';

export interface ProviderState {
  provider: IModelProvider;
  enabled: boolean;
  priority: number;
  isHealthy: boolean;
}

export class ProviderManager {
  private states: Map<string, ProviderState> = new Map();

  public register(provider: IModelProvider, priority: number = 0): void {
    this.states.set(provider.id, {
      provider,
      enabled: true,
      priority,
      isHealthy: true,
    });
  }

  public enable(id: string): void {
    const state = this.states.get(id);
    if (state) state.enabled = true;
  }

  public disable(id: string): void {
    const state = this.states.get(id);
    if (state) state.enabled = false;
  }

  public setHealth(id: string, isHealthy: boolean): void {
    const state = this.states.get(id);
    if (state) state.isHealthy = isHealthy;
  }

  public getActiveProviders(): IModelProvider[] {
    return Array.from(this.states.values())
      .filter(state => state.enabled && state.isHealthy)
      .sort((a, b) => b.priority - a.priority)
      .map(state => state.provider);
  }

  public getFallbackProvider(): IModelProvider | undefined {
    const active = this.getActiveProviders();
    return active.length > 0 ? active[active.length - 1] : undefined;
  }
}
