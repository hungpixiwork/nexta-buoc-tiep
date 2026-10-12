/**
 * Base Entity class for domain model entities with identity equality.
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id ? id : crypto.randomUUID();
    this.props = props;
  }

  public get id(): string {
    return this._id;
  }

  /**
   * Compares entities based on identity (ID) and class type.
   */
  public equals(object?: Entity<unknown>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    if (this.constructor !== object.constructor) {
      return false;
    }

    return this._id === object._id;
  }
}

