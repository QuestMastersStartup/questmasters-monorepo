export enum PackStatusValue {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  UNDER_REVIEW = 'under_review',
}

const VALID_TRANSITIONS: Record<PackStatusValue, PackStatusValue[]> = {
  [PackStatusValue.DRAFT]: [PackStatusValue.UNDER_REVIEW],
  [PackStatusValue.UNDER_REVIEW]: [PackStatusValue.PUBLISHED, PackStatusValue.DRAFT],
  [PackStatusValue.PUBLISHED]: [PackStatusValue.DRAFT],
};

export class PackStatus {
  private constructor(private readonly value: PackStatusValue) {}

  static create(value: string): PackStatus {
    if (!PackStatus.isValid(value)) {
      throw new Error(`Invalid pack status: ${value}`);
    }
    return new PackStatus(value as PackStatusValue);
  }

  static draft(): PackStatus {
    return new PackStatus(PackStatusValue.DRAFT);
  }

  static isValid(value: string): boolean {
    return Object.values(PackStatusValue).includes(value as PackStatusValue);
  }

  canTransitionTo(target: PackStatus): boolean {
    const allowed = VALID_TRANSITIONS[this.value];
    return allowed.includes(target.value);
  }

  isDraft(): boolean {
    return this.value === PackStatusValue.DRAFT;
  }

  isPublished(): boolean {
    return this.value === PackStatusValue.PUBLISHED;
  }

  isUnderReview(): boolean {
    return this.value === PackStatusValue.UNDER_REVIEW;
  }

  toString(): string {
    return this.value;
  }

  equals(other: PackStatus): boolean {
    return this.value === other.value;
  }
}
