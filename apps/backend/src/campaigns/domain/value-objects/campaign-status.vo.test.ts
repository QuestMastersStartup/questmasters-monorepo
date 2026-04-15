import { describe, expect, it } from 'bun:test';
import { CampaignStatus } from './campaign-status.vo';

describe('CampaignStatus', () => {
  describe('create', () => {
    it('should create active status', () => {
      const status = CampaignStatus.create('active');
      expect(status.toString()).toBe('active');
    });

    it('should create paused status', () => {
      const status = CampaignStatus.create('paused');
      expect(status.toString()).toBe('paused');
    });

    it('should create completed status', () => {
      const status = CampaignStatus.create('completed');
      expect(status.toString()).toBe('completed');
    });

    it('should throw for invalid status', () => {
      expect(() => CampaignStatus.create('invalid')).toThrow('Invalid CampaignStatus: invalid');
    });
  });

  describe('factory methods', () => {
    it('should create active via static method', () => {
      expect(CampaignStatus.active().toString()).toBe('active');
    });

    it('should create paused via static method', () => {
      expect(CampaignStatus.paused().toString()).toBe('paused');
    });

    it('should create completed via static method', () => {
      expect(CampaignStatus.completed().toString()).toBe('completed');
    });
  });

  describe('canTransitionTo', () => {
    it('active can transition to paused', () => {
      expect(CampaignStatus.active().canTransitionTo(CampaignStatus.paused())).toBe(true);
    });

    it('active can transition to completed', () => {
      expect(CampaignStatus.active().canTransitionTo(CampaignStatus.completed())).toBe(true);
    });

    it('paused can transition to active', () => {
      expect(CampaignStatus.paused().canTransitionTo(CampaignStatus.active())).toBe(true);
    });

    it('paused can transition to completed', () => {
      expect(CampaignStatus.paused().canTransitionTo(CampaignStatus.completed())).toBe(true);
    });

    it('completed cannot transition to active', () => {
      expect(CampaignStatus.completed().canTransitionTo(CampaignStatus.active())).toBe(false);
    });

    it('completed cannot transition to paused', () => {
      expect(CampaignStatus.completed().canTransitionTo(CampaignStatus.paused())).toBe(false);
    });
  });

  describe('equals', () => {
    it('should be equal to same status', () => {
      expect(CampaignStatus.active().equals(CampaignStatus.active())).toBe(true);
    });

    it('should not be equal to different status', () => {
      expect(CampaignStatus.active().equals(CampaignStatus.paused())).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return true for valid values', () => {
      expect(CampaignStatus.isValid('active')).toBe(true);
      expect(CampaignStatus.isValid('paused')).toBe(true);
      expect(CampaignStatus.isValid('completed')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(CampaignStatus.isValid('draft')).toBe(false);
      expect(CampaignStatus.isValid('')).toBe(false);
    });
  });
});
