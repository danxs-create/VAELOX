export class AsyncMutex {
  private _locked = false;
  private _queue: (() => void)[] = [];

  public get isLocked(): boolean {
    return this._locked;
  }

  public async lock(): Promise<() => void> {
    return new Promise((resolve) => {
      const acquire = () => {
        this._locked = true;
        resolve(() => this.unlock());
      };

      if (!this._locked) {
        acquire();
      } else {
        this._queue.push(acquire);
      }
    });
  }

  private unlock(): void {
    if (this._queue.length > 0) {
      const next = this._queue.shift();
      next?.();
    } else {
      this._locked = false;
    }
  }
}
