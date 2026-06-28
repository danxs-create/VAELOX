import { BaseService } from './BaseService';
import { IStorageProvider } from '../providers/IStorageProvider';

export class StorageService extends BaseService {
  constructor(private _provider: IStorageProvider) {
    super('StorageService');
  }

  public async read(path: string): Promise<string> {
    return this._provider.read(path);
  }

  public async write(path: string, content: string): Promise<void> {
    return this._provider.write(path, content);
  }
}
