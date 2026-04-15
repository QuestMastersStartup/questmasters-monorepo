import { describe, expect, it } from 'bun:test';
import { CharacterStatus } from './character-status.vo';

describe('CharacterStatus', () => {
  describe('create', () => {
    it('should create active status', () => {
      expect(CharacterStatus.create('active').toString()).toBe('active');
    });

    it('should create dead status', () => {
      expect(CharacterStatus.create('dead').toString()).toBe('dead');
    });

    it('should create retired status', () => {
      expect(CharacterStatus.create('retired').toString()).toBe('retired');
    });

    it('should throw for invalid status', () => {
      expect(() => CharacterStatus.create('ghost')).toThrow('Invalid CharacterStatus: ghost');
    });
  });

  describe('factory methods', () => {
    it('should create active via static method', () => {
      expect(CharacterStatus.active().toString()).toBe('active');
    });

    it('should create dead via static method', () => {
      expect(CharacterStatus.dead().toString()).toBe('dead');
    });

    it('should create retired via static method', () => {
      expect(CharacterStatus.retired().toString()).toBe('retired');
    });
  });

  describe('canTransitionTo', () => {
    it('active can transition to dead', () => {
      expect(CharacterStatus.active().canTransitionTo(CharacterStatus.dead())).toBe(true);
    });

    it('active can transition to retired', () => {
      expect(CharacterStatus.active().canTransitionTo(CharacterStatus.retired())).toBe(true);
    });

    it('dead cannot transition to active', () => {
      expect(CharacterStatus.dead().canTransitionTo(CharacterStatus.active())).toBe(false);
    });

    it('dead cannot transition to retired', () => {
      expect(CharacterStatus.dead().canTransitionTo(CharacterStatus.retired())).toBe(false);
    });

    it('retired cannot transition to active', () => {
      expect(CharacterStatus.retired().canTransitionTo(CharacterStatus.active())).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('dead is terminal', () => {
      expect(CharacterStatus.dead().isTerminal()).toBe(true);
    });

    it('retired is terminal', () => {
      expect(CharacterStatus.retired().isTerminal()).toBe(true);
    });

    it('active is not terminal', () => {
      expect(CharacterStatus.active().isTerminal()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should be equal to same status', () => {
      expect(CharacterStatus.active().equals(CharacterStatus.active())).toBe(true);
    });

    it('should not be equal to different status', () => {
      expect(CharacterStatus.active().equals(CharacterStatus.dead())).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(CharacterStatus.isValid('active')).toBe(true);
      expect(CharacterStatus.isValid('dead')).toBe(true);
      expect(CharacterStatus.isValid('retired')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(CharacterStatus.isValid('alive')).toBe(false);
      expect(CharacterStatus.isValid('')).toBe(false);
    });
  });
});
