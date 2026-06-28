export interface EventMap {
  [key: string]: unknown;
}

export class TypedEventEmitter<Events extends EventMap> {
  private listeners: { [K in keyof Events]?: ((event: Events[K]) => void)[] } = {};

  public on<K extends keyof Events>(event: K, listener: (e: Events[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
  }

  public off<K extends keyof Events>(event: K, listener: (e: Events[K]) => void): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      this.listeners[event] = eventListeners.filter((l) => l !== listener);
    }
  }

  public emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      for (const listener of eventListeners) {
        listener(data);
      }
    }
  }
}
