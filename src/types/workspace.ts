export interface WorkspaceConfig {
  id: string;
  name: string;
  rootPath: string;
  settings: Record<string, unknown>;
}

export interface WorkspaceManager {
  getConfig(): Promise<WorkspaceConfig>;
  updateConfig(config: Partial<WorkspaceConfig>): Promise<void>;
  resolvePath(relativePath: string): string;
}
