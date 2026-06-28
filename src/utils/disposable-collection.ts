import { IDisposable, Disposable } from './disposable';

export class DisposableCollection extends Disposable {
  public add(disposable: IDisposable): void {
    if (this.isDisposed) {
      disposable.dispose();
      return;
    }
    this.register(disposable);
  }
}
