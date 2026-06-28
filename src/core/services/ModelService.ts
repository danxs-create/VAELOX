import { BaseService } from './BaseService';
import { IModelProvider } from '../providers/IModelProvider';

export class ModelService extends BaseService {
  private _providers: Map<string, IModelProvider> = new Map();

  constructor() {
    super('ModelService');
  }

  public registerProvider(provider: IModelProvider): void {
    this._providers.set(provider.id, provider);
  }

  public getProvider(id: string): IModelProvider | undefined {
    return this._providers.get(id);
  }
}
