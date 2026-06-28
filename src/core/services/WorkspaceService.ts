import { BaseService } from './BaseService';
import { IWorkspaceProvider } from '../providers/IWorkspaceProvider';

export class WorkspaceService extends BaseService {
  constructor(private _provider: IWorkspaceProvider) {
    super('WorkspaceService');
  }

  public getWorkspaceRoot(): string {
    return this._provider.getWorkspaceRoot();
  }
}
