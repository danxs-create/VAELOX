import { BaseService } from './BaseService';
import { ConfigSystem } from '../config/ConfigSystem';
import { ConfigLevel, ConfigData } from '../config/types';

export class ConfigService extends BaseService {
  private _configSystem: ConfigSystem;

  constructor() {
    super('ConfigService');
    this._configSystem = new ConfigSystem();
  }

  public setConfig(level: ConfigLevel, config: ConfigData): void {
    this._configSystem.setConfig(level, config);
  }

  public get<T>(key: string, defaultValue?: T): T | undefined {
    return this._configSystem.get<T>(key, defaultValue);
  }
}
