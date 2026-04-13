export enum CharacterStatusValue {
  ACTIVE = 'active',
  DEAD = 'dead',
  RETIRED = 'retired',
}

export class CharacterStatus {
  private constructor(private readonly value: CharacterStatusValue) {}

  static create(value: string): CharacterStatus {
    if (!CharacterStatus.isValid(value)) {
      throw new Error(`Invalid CharacterStatus: ${value}`);
    }
    return new CharacterStatus(value as CharacterStatusValue);
  }

  static active(): CharacterStatus {
    return new CharacterStatus(CharacterStatusValue.ACTIVE);
  }

  static dead(): CharacterStatus {
    return new CharacterStatus(CharacterStatusValue.DEAD);
  }

  static retired(): CharacterStatus {
    return new CharacterStatus(CharacterStatusValue.RETIRED);
  }

  static isValid(value: string): boolean {
    return Object.values(CharacterStatusValue).includes(value as CharacterStatusValue);
  }

  canTransitionTo(newStatus: CharacterStatus): boolean {
    // Current state transition rules:
    // Only 'active' can transition to others. 'dead' and 'retired' are terminal.
    if (this.value !== CharacterStatusValue.ACTIVE) {
      return false;
    }
    // active -> dead, active -> retired
    return true; 
  }

  isTerminal(): boolean {
    return this.value === CharacterStatusValue.DEAD || this.value === CharacterStatusValue.RETIRED;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CharacterStatus): boolean {
    return this.value === other.value;
  }
}
