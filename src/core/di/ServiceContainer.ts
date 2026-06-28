import { IServiceContainer, ServiceLifetime } from './types';
import { ServiceToken } from '../../utils/service-token';

export class ServiceContainer implements IServiceContainer {
  private _providers = new Map<symbol, { provider: () => unknown; lifetime: ServiceLifetime }>();
  private _instances = new Map<symbol, unknown>();

  private _tokenMap = new Map<ServiceToken<unknown>, symbol>();

  private getTokenSymbol(token: ServiceToken<unknown>): symbol {
    let sym = this._tokenMap.get(token);
    if (!sym) {
      sym = Symbol(token.name);
      this._tokenMap.set(token, sym);
    }
    return sym;
  }

  public register<T>(token: ServiceToken<T>, provider: () => T, lifetime: ServiceLifetime = ServiceLifetime.SINGLETON): void {
    const sym = this.getTokenSymbol(token);
    this._providers.set(sym, { provider, lifetime });
  }

  public singleton<T>(token: ServiceToken<T>, provider: () => T): void {
    this.register(token, provider, ServiceLifetime.SINGLETON);
  }

  public transient<T>(token: ServiceToken<T>, provider: () => T): void {
    this.register(token, provider, ServiceLifetime.TRANSIENT);
  }

  public resolve<T>(token: ServiceToken<T>): T {
    const sym = this.getTokenSymbol(token);
    const registration = this._providers.get(sym);
    if (!registration) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    if (registration.lifetime === ServiceLifetime.SINGLETON) {
      let instance = this._instances.get(sym);
      if (!instance) {
        instance = registration.provider();
        this._instances.set(sym, instance);
      }
      return instance as T;
    }

    return registration.provider() as T;
  }

  public has<T>(token: ServiceToken<T>): boolean {
    return this._providers.has(this.getTokenSymbol(token));
  }
}
