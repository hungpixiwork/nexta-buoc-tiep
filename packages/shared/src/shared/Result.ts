/**
 * Result pattern for type-safe domain operation outcomes without exceptions.
 */
export class Result<T, E = string> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: E | null;
  private readonly _value: T | null;

  private constructor(isSuccess: boolean, error?: E | null, value?: T | null) {
    if (isSuccess && error) {
      throw new Error("InvalidOperation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && error === undefined) {
      throw new Error("InvalidOperation: A failing result must contain an error");
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error !== undefined ? error : null;
    this._value = value !== undefined ? value : null;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cant retrieve the value from a failed result. Error: ${JSON.stringify(this.error)}`);
    }
    return this._value as T;
  }

  public getError(): E {
    if (!this.isFailure) {
      throw new Error("Cant retrieve the error from a successful result.");
    }
    return this.error as E;
  }

  public map<U>(fn: (val: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this.error as E);
    }
    return Result.ok<U, E>(fn(this.getValue()));
  }

  public flatMap<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this.error as E);
    }
    return fn(this.getValue());
  }

  public static ok<U, E = string>(value?: U): Result<U, E> {
    return new Result<U, E>(true, null, value);
  }

  public static fail<U, E = string>(error: E): Result<U, E> {
    return new Result<U, E>(false, error);
  }

  public static combine<E = string>(results: Result<unknown, E>[]): Result<void, E> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void, E>(result.getError());
      }
    }
    return Result.ok<void, E>();
  }
}
