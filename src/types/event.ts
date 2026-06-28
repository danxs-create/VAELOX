import { EventName } from '../core/constants';

export interface BaseEvent<T = unknown> {
  id: string;
  name: EventName | string;
  timestamp: number;
  payload: T;
  source: string;
}
