export class CancellationToken {
  private _isCancelled = false;
  private _listeners: (() => void)[] = [];

  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  public get isCancellationRequested(): boolean {
    return this._isCancelled;
  }

  public cancel(): void {
    if (this._isCancelled) return;
    this._isCancelled = true;
    this._listeners.forEach((listener) => listener());
    this._listeners = [];
  }

  public onCancellationRequested(listener: () => void): void {
    if (this._isCancelled) {
      listener();
      return;
    }
    this._listeners.push(listener);
  }

  public throwIfCancelled(): void {
    if (this._isCancelled) {
      throw new Error('Operation cancelled');
    }
  }
}
