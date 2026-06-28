export interface IDisposable {
  dispose(): void;
}

export class Disposable implements IDisposable {
  private _isDisposed = false;
  private _disposables: IDisposable[] = [];

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  public dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    for (const d of this._disposables) {
      d.dispose();
    }
    this._disposables = [];
  }

  protected register<T extends IDisposable>(t: T): T {
    this._disposables.push(t);
    return t;
  }
}
