import { describe, expect, it } from 'bun:test';
import { Asset } from './asset.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { AssetData } from '../value-objects/asset-data.vo';

describe('Asset Entity', () => {
  const packId = UUID.generate().toString();
  const validProps = {
    packId,
    type: 'class',
    index: 'fighter',
    name: 'Fighter',
    data: { description: 'A brave warrior' },
    compatibleWith: [],
  };

  it('should create a new Asset', () => {
    const asset = Asset.create(validProps);
    expect(asset.id).toBeDefined();
    expect(asset.packId.toString()).toBe(packId);
    expect(asset.type.toString()).toBe('class');
    expect(asset.index).toBe('fighter');
    expect(asset.data.get('description')).toBe('A brave warrior');
  });

  it('should reconstruct an Asset', () => {
    const id = UUID.generate().toString();
    const now = new Date();
    const asset = Asset.reconstruct({
      ...validProps,
      id,
      compatibleWith: [],
      createdAt: now,
      updatedAt: now,
    });

    expect(asset.id.toString()).toBe(id);
    expect(asset.createdAt).toEqual(now);
  });

  it('should update asset metadata', () => {
    const asset = Asset.create(validProps);
    const newData = AssetData.create({ description: 'Updated' });
    const updatedAsset = asset.update({ name: 'Warrior', data: newData });

    expect(updatedAsset.name).toBe('Warrior');
    expect(updatedAsset.data.get('description')).toBe('Updated');
  });
});
