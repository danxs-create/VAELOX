import { BaseService } from './BaseService';
import { TypedEventEmitter } from '../../utils/typed-event-emitter';
import { BaseEvent } from '../../types';

interface SystemEvents {
  [key: string]: BaseEvent<unknown>;
}

export class EventService extends BaseService {
  private _emitter = new TypedEventEmitter<SystemEvents>();

  constructor() {
    super('EventService');
  }

  public on<K extends string>(event: K, listener: (e: BaseEvent<unknown>) => void): void {
    this._emitter.on(event, listener);
  }

  public emit<K extends string>(event: K, data: BaseEvent<unknown>): void {
    this._emitter.emit(event, data);
  }
}
