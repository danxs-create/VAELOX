import { IModelProvider } from '../providers/IModelProvider';

export class ModelFactory {
  private providers: Map<string, IModelProvider> = new Map();

  public registerProvider(provider: IModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  public removeProvider(id: string): boolean {
    return this.providers.delete(id);
  }

  public getProvider(id: string): IModelProvider | undefined {
    return this.providers.get(id);
  }

  public listProviders(): IModelProvider[] {
    return Array.from(this.providers.values());
  }
}
