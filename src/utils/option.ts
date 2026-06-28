export type Option<T> = Some<T> | None<T>;

export class Some<T> {
  public readonly isSome = true;
  public readonly isNone = false;
  constructor(public readonly value: T) {}
}

export class None<T> {
  public readonly isSome = false;
  public readonly isNone = true;
}

export const some = <T>(value: T): Option<T> => new Some(value);
export const none = <T>(): Option<T> => new None();
