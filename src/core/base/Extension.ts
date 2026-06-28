import { Extension, ExtensionManifest } from '../../types';

export abstract class BaseExtension implements Extension {
  constructor(public readonly manifest: ExtensionManifest) {}

  public abstract activate(): Promise<void>;
  public abstract deactivate(): Promise<void>;
}
