import { Extension } from '../../types';

export class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();

  public register(extension: Extension): void {
    this.extensions.set(extension.manifest.id, extension);
  }

  public get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  public getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  public remove(id: string): boolean {
    return this.extensions.delete(id);
  }
}
