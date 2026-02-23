import { describe, expect, it } from 'bun:test';
import { ContentPack } from './content-pack.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

describe('ContentPack Entity', () => {
  const validProps = {
    slug: 'test-pack',
    name: 'Test Pack',
    description: 'A description',
    version: '1.0.0',
    type: 'srd',
    system: 'dnd-5e-2024',
    creatorId: UUID.generate().toString(),
    dependencies: [],
  };

  it('should create a new ContentPack', () => {
    const pack = ContentPack.create(validProps);
    expect(pack.id).toBeDefined();
    expect(pack.slug.toString()).toBe('test-pack');
    expect(pack.name).toBe('Test Pack');
    expect(pack.isActive).toBe(true);
    expect(pack.isSuspended).toBe(false);
  });

  it('should reconstruct a ContentPack', () => {
    const id = UUID.generate().toString();
    const now = new Date();
    const pack = ContentPack.reconstruct({
      ...validProps,
      id,
      description: 'Desc',
      version: '1.1.0',
      isActive: false,
      isSuspended: true,
      suspensionReason: 'Reason',
      dependencies: [],
      createdAt: now,
      updatedAt: now,
    });

    expect(pack.id.toString()).toBe(id);
    expect(pack.isActive).toBe(false);
    expect(pack.isSuspended).toBe(true);
    expect(pack.suspensionReason).toBe('Reason');
  });

  it('should suspend a pack', () => {
    const pack = ContentPack.create(validProps);
    const suspendedPack = pack.suspend('Bad content');
    expect(suspendedPack.isSuspended).toBe(true);
    expect(suspendedPack.suspensionReason).toBe('Bad content');
  });

  it('should unsuspend a pack', () => {
    const pack = ContentPack.create(validProps).suspend('Reason');
    const unsuspendedPack = pack.unsuspend();
    expect(unsuspendedPack.isSuspended).toBe(false);
    expect(unsuspendedPack.suspensionReason).toBeNull();
  });

  it('should deactivate a pack', () => {
    const pack = ContentPack.create(validProps);
    const deactivatedPack = pack.deactivate();
    expect(deactivatedPack.isActive).toBe(false);
  });

  it('should update pack metadata', () => {
    const pack = ContentPack.create(validProps);
    const updatedPack = pack.update({ name: 'New Name', version: '2.0.0' });
    expect(updatedPack.name).toBe('New Name');
    expect(updatedPack.version).toBe('2.0.0');
    expect(updatedPack.description).toBe(validProps.description);
  });
});
