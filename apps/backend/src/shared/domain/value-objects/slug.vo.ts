export class Slug {
  private constructor(private readonly value: string) {
    if (!Slug.isValid(value)) {
      throw new Error(`Invalid Slug: ${value}`);
    }
  }

  static create(value: string): Slug {
    const normalized = Slug.normalize(value);
    return new Slug(normalized);
  }

  static fromString(value: string): Slug {
    return new Slug(value);
  }

  static normalize(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static isValid(value: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(value) && value.length >= 2 && value.length <= 255;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
