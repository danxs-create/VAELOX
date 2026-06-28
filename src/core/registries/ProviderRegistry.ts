import { ModelProvider } from '../../types';

export class ProviderRegistry {
  private providers: Map<string, ModelProvider> = new Map();

  public register(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  public get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  public getAll(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  public remove(id: string): boolean {
    return this.providers.delete(id);
  }
}
