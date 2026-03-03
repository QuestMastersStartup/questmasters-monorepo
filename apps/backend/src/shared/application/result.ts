export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error as E;
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value as T);
    }
    return Result.fail(this._error as E);
  }

  getOrElse(defaultValue: T): T {
    return this._isSuccess ? (this._value as T) : defaultValue;
  }
}
