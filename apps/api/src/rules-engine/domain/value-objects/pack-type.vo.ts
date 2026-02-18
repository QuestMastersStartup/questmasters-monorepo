export enum PackTypeValue {
  SRD = 'srd',
  OFFICIAL = 'official',
  HOMEBREW = 'homebrew',
}

export class PackType {
  private constructor(private readonly value: PackTypeValue) {}

  static create(value: string): PackType {
    if (!PackType.isValid(value)) {
      throw new Error(`Invalid PackType: ${value}`);
    }
    return new PackType(value as PackTypeValue);
  }

  static srd(): PackType {
    return new PackType(PackTypeValue.SRD);
  }

  static official(): PackType {
    return new PackType(PackTypeValue.OFFICIAL);
  }

  static homebrew(): PackType {
    return new PackType(PackTypeValue.HOMEBREW);
  }

  static isValid(value: string): boolean {
    return Object.values(PackTypeValue).includes(value as PackTypeValue);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PackType): boolean {
    return this.value === other.value;
  }

  isSrd(): boolean {
    return this.value === PackTypeValue.SRD;
  }

  isOfficial(): boolean {
    return this.value === PackTypeValue.OFFICIAL;
  }

  isHomebrew(): boolean {
    return this.value === PackTypeValue.HOMEBREW;
  }
}
