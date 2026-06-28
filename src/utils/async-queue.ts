export class AsyncQueue<T> {
  private items: T[] = [];
  private resolvers: ((value: T) => void)[] = [];

  public enqueue(item: T): void {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      if (resolve) resolve(item);
    } else {
      this.items.push(item);
    }
  }

  public dequeue(): Promise<T> {
    if (this.items.length > 0) {
      return Promise.resolve(this.items.shift() as T);
    }
    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  public get size(): number {
    return this.items.length;
  }
}
