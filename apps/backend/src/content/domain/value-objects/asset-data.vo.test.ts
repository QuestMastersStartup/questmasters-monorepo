import { describe, expect, it } from 'bun:test';
import { AssetData } from './asset-data.vo';

describe('AssetData Value Object', () => {
  it('should create AssetData from an object', () => {
    const data = { name: 'Sword', damage: '1d8' };
    const assetData = AssetData.create(data);
    expect(assetData.toObject()).toEqual(data);
  });

  it('should create an empty AssetData', () => {
    const assetData = AssetData.empty();
    expect(assetData.toObject()).toEqual({});
  });

  it('should throw an error for invalid input', () => {
    expect(() => AssetData.create(null as any)).toThrow(
      'AssetData must be a valid object',
    );
    expect(() => AssetData.create('not-an-object' as any)).toThrow();
  });

  it('should get a value by key', () => {
    const assetData = AssetData.create({ key: 'value' });
    expect(assetData.get('key') as any).toBe('value');
    expect(assetData.get('missing')).toBeUndefined();
  });

  it('should check if a key exists', () => {
    const assetData = AssetData.create({ key: 'value' });
    expect(assetData.has('key')).toBe(true);
    expect(assetData.has('missing')).toBe(false);
  });

  it('should merge two AssetData objects', () => {
    const data1 = AssetData.create({ a: 1, b: 2 });
    const data2 = AssetData.create({ b: 3, c: 4 });
    const merged = data1.merge(data2);

    expect(merged.get('a') as any).toBe(1);
    expect(merged.get('b') as any).toBe(3);
    expect(merged.get('c') as any).toBe(4);
  });
});
