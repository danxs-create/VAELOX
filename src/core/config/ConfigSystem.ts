import { ConfigData, ConfigLevel } from './types';

export class ConfigSystem {
  private _configs: Map<ConfigLevel, ConfigData> = new Map([
    [ConfigLevel.DEFAULT, {}],
    [ConfigLevel.ENVIRONMENT, {}],
    [ConfigLevel.USER, {}],
    [ConfigLevel.RUNTIME, {}],
  ]);

  public setConfig(level: ConfigLevel, config: ConfigData): void {
    this._configs.set(level, config);
  }

  public getMergedConfig(): ConfigData {
    return {
      ...this._configs.get(ConfigLevel.DEFAULT),
      ...this._configs.get(ConfigLevel.ENVIRONMENT),
      ...this._configs.get(ConfigLevel.USER),
      ...this._configs.get(ConfigLevel.RUNTIME),
    };
  }

  public get<T>(key: string, defaultValue?: T): T | undefined {
    const merged = this.getMergedConfig();
    const value = merged[key] as T | undefined;
    return value !== undefined ? value : defaultValue;
  }
}
