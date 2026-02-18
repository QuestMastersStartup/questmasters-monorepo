import { UUID } from '../value-objects/uuid.vo';

export abstract class BaseEntity {
  constructor(
    public readonly id: UUID,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
