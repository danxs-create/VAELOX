export interface IWorkspaceProvider {
  getWorkspaceRoot(): string;
  listFiles(pattern?: string): Promise<string[]>;
  resolvePath(relativePath: string): string;
}
