import { ServiceToken } from '../../utils/service-token';

export enum ServiceLifetime {
  SINGLETON,
  TRANSIENT,
}

export interface IServiceContainer {
  register<T>(token: ServiceToken<T>, provider: () => T, lifetime?: ServiceLifetime): void;
  resolve<T>(token: ServiceToken<T>): T;
  singleton<T>(token: ServiceToken<T>, provider: () => T): void;
  transient<T>(token: ServiceToken<T>, provider: () => T): void;
  has<T>(token: ServiceToken<T>): boolean;
}
