import { WorkspaceConfig, WorkspaceManager } from '../../types/workspace';

export class WorkspaceManagerImpl implements WorkspaceManager {
  private _config: WorkspaceConfig;

  constructor() {
    this._config = {
      id: 'vaelox-workspace',
      name: 'Vaelox Root',
      rootPath: '.',
      settings: {},
    };
  }

  public async getConfig(): Promise<WorkspaceConfig> {
    // Try to load from localStorage if in client environment
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('vaelox-workspace-config');
        if (saved) {
          this._config = JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load workspace config:', e);
      }
    }
    return this._config;
  }

  public async updateConfig(config: Partial<WorkspaceConfig>): Promise<void> {
    this._config = {
      ...this._config,
      ...config,
      settings: {
        ...this._config.settings,
        ...(config.settings || {}),
      },
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaelox-workspace-config', JSON.stringify(this._config));
      } catch (e) {
        console.error('Failed to save workspace config:', e);
      }
    }
  }

  public resolvePath(relativePath: string): string {
    // Basic clean resolve path for client display purposes
    return relativePath.startsWith('/') ? relativePath : `./${relativePath}`;
  }
}
