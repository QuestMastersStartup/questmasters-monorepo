import { describe, expect, it } from 'bun:test';
import { AssetType, AssetTypeValue } from './asset-type.vo';

describe('AssetType Value Object', () => {
  it('should create an AssetType from a valid value', () => {
    const type = AssetType.create('class');
    expect(type.toString()).toBe('class');
  });

  it('should throw an error for an invalid value', () => {
    expect(() => AssetType.create('invalid-type')).toThrow(
      'Invalid AssetType: invalid-type',
    );
  });

  it('should validate values correctly', () => {
    expect(AssetType.isValid('class')).toBe(true);
    expect(AssetType.isValid('monster')).toBe(true);
    expect(AssetType.isValid('invalid-type')).toBe(false);
  });

  it('should return all valid values', () => {
    const values = AssetType.values();
    expect(values).toContain(AssetTypeValue.CLASS);
    expect(values).toContain(AssetTypeValue.MONSTER);
    expect(values.length).toBeGreaterThan(10);
  });

  it('should correctly compare two asset types', () => {
    const type1 = AssetType.create('class');
    const type2 = AssetType.create('class');
    const type3 = AssetType.create('race');

    expect(type1.equals(type2)).toBe(true);
    expect(type1.equals(type3)).toBe(false);
  });
});
