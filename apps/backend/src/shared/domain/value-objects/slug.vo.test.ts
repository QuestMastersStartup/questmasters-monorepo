import { describe, expect, it } from 'bun:test';
import { Slug } from './slug.vo';

describe('Slug Value Object', () => {
  it('should create a slug from a valid string', () => {
    const slug = Slug.fromString('valid-slug-123');
    expect(slug.toString()).toBe('valid-slug-123');
  });

  it('should normalize a string into a valid slug', () => {
    const slug = Slug.create('  My Awesome Pack!!  ');
    expect(slug.toString()).toBe('my-awesome-pack');
  });

  it('should throw an error for an invalid slug string', () => {
    expect(() => Slug.fromString('invalid slug')).toThrow();
    expect(() => Slug.fromString('s')).toThrow(); // length < 2
    expect(() => Slug.fromString('-start-with-hyphen')).toThrow();
  });

  it('should correctly compare two slugs', () => {
    const slug1 = Slug.fromString('same-slug');
    const slug2 = Slug.fromString('same-slug');
    const slug3 = Slug.fromString('different-slug');

    expect(slug1.equals(slug2)).toBe(true);
    expect(slug1.equals(slug3)).toBe(false);
  });

  it('should validate slugs correctly', () => {
    expect(Slug.isValid('valid-slug')).toBe(true);
    expect(Slug.isValid('invalid slug')).toBe(false);
    expect(Slug.isValid('a')).toBe(false);
  });
});
