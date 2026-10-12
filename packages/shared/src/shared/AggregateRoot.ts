import { Entity } from './Entity';
import { IDomainEvent } from './DomainEvent';

/**
 * Base AggregateRoot class managing domain events.
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: IDomainEvent[] = [];

  get domainEvents(): readonly IDomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: IDomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}

