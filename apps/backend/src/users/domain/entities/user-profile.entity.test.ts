import { describe, expect, it } from 'bun:test';
import { UserProfile } from './user-profile.entity';

describe('UserProfile Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  it('should create a new player profile by default', () => {
    const profile = UserProfile.create(userId);
    expect(profile.id).toBe(userId);
    expect(profile.role).toBe('player');
    expect(profile.isAdmin).toBe(false);
    expect(profile.username).toBeNull();
  });

  it('should reconstruct a profile', () => {
    const now = new Date();
    const profile = UserProfile.reconstruct({
      id: userId,
      username: 'testuser',
      avatarUrl: 'http://avatar.com/test.png',
      bio: 'Hello world',
      role: 'creator',
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(profile.id).toBe(userId);
    expect(profile.username).toBe('testuser');
    expect(profile.role).toBe('creator');
  });

  it('should update profile fields', () => {
    const profile = UserProfile.create(userId);
    const updated = profile.update({
      username: 'newname',
      bio: 'New bio',
    });

    expect(updated.username).toBe('newname');
    expect(updated.bio).toBe('New bio');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(profile.updatedAt.getTime());
  });

  it('should change role and admin status', () => {
    const profile = UserProfile.create(userId);
    const admin = profile.changeRole('admin');
    
    expect(admin.role).toBe('admin');
    expect(admin.isAdmin).toBe(true);
    
    const creator = admin.changeRole('creator');
    expect(creator.role).toBe('creator');
    expect(creator.isAdmin).toBe(false);
  });
});
