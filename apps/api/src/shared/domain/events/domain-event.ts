import { UUID } from '../value-objects/uuid.vo';

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: UUID;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = UUID.generate();
  }

  abstract get eventName(): string;
}
