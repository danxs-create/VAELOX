export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
}

export interface Extension {
  manifest: ExtensionManifest;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
}
