export enum SystemTypeValue {
  DND_3_5 = 'dnd-3.5',
  DND_5E_2014 = 'dnd-5e-2014',
  DND_5E_2024 = 'dnd-5e-2024',
  UNIVERSAL = 'universal',
}

export class SystemType {
  private constructor(private readonly value: SystemTypeValue) {}

  static create(value: string): SystemType {
    if (!SystemType.isValid(value)) {
      throw new Error(`Invalid SystemType: ${value}`);
    }
    return new SystemType(value as SystemTypeValue);
  }

  static dnd35(): SystemType {
    return new SystemType(SystemTypeValue.DND_3_5);
  }

  static dnd5e2014(): SystemType {
    return new SystemType(SystemTypeValue.DND_5E_2014);
  }

  static dnd5e2024(): SystemType {
    return new SystemType(SystemTypeValue.DND_5E_2024);
  }

  static isValid(value: string): boolean {
    return Object.values(SystemTypeValue).includes(value as SystemTypeValue);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SystemType): boolean {
    return this.value === other.value;
  }
}
