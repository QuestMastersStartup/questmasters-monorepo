import { describe, expect, it } from 'bun:test';
import { PackType } from './pack-type.vo';

describe('PackType Value Object', () => {
  it('should create a PackType from valid values', () => {
    expect(PackType.create('srd').toString()).toBe('srd');
    expect(PackType.create('official').toString()).toBe('official');
    expect(PackType.create('homebrew').toString()).toBe('homebrew');
  });

  it('should have static creators for each type', () => {
    expect(PackType.srd().isSrd()).toBe(true);
    expect(PackType.official().isOfficial()).toBe(true);
    expect(PackType.homebrew().isHomebrew()).toBe(true);
  });

  it('should throw an error for an invalid value', () => {
    expect(() => PackType.create('invalid-type')).toThrow(
      'Invalid PackType: invalid-type',
    );
  });

  it('should validate values correctly', () => {
    expect(PackType.isValid('srd')).toBe(true);
    expect(PackType.isValid('invalid-type')).toBe(false);
  });

  it('should correctly compare two pack types', () => {
    const type1 = PackType.srd();
    const type2 = PackType.srd();
    const type3 = PackType.homebrew();

    expect(type1.equals(type2)).toBe(true);
    expect(type1.equals(type3)).toBe(false);
  });
});
