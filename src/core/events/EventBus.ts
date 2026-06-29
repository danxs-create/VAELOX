import { BaseEvent } from '../../types/event';
import { TypedEventEmitter } from '../../utils/typed-event-emitter';

export interface VaeloxEvents {
  [key: string]: BaseEvent<unknown>;
}

export class EventBus {
  private _emitter = new TypedEventEmitter<VaeloxEvents>();

  public publish<T>(eventName: string, event: BaseEvent<T>): void {
    this._emitter.emit(eventName, event as BaseEvent<unknown>);
  }

  public subscribe<T>(eventName: string, listener: (event: BaseEvent<T>) => void): void {
    this._emitter.on(eventName, listener as (e: BaseEvent<unknown>) => void);
  }

  public unsubscribe<T>(eventName: string, listener: (event: BaseEvent<T>) => void): void {
    this._emitter.off(eventName, listener as (e: BaseEvent<unknown>) => void);
  }

  public once<T>(eventName: string, listener: (event: BaseEvent<T>) => void): void {
    const wrapper = (event: BaseEvent<unknown>) => {
      this.unsubscribe(eventName, wrapper as (e: BaseEvent<unknown>) => void);
      listener(event as BaseEvent<T>);
    };
    this.subscribe(eventName, wrapper);
  }

  public clear(): void {
    this._emitter = new TypedEventEmitter<VaeloxEvents>();
  }
}
