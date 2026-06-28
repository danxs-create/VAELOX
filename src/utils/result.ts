export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E = Error> {
  public readonly isSuccess = true;
  public readonly isFailure = false;
  constructor(public readonly value: T) {}
}

export class Failure<T, E = Error> {
  public readonly isSuccess = false;
  public readonly isFailure = true;
  constructor(public readonly error: E) {}
}

export const success = <T, E = Error>(value: T): Result<T, E> => new Success(value);
export const failure = <T, E = Error>(error: E): Result<T, E> => new Failure(error);
