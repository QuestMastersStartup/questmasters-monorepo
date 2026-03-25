import { describe, expect, it } from 'bun:test';
import { PackStatus, PackStatusValue } from './pack-status.vo';

describe('PackStatus Value Object', () => {
  it('should create a draft status', () => {
    const status = PackStatus.draft();
    expect(status.toString()).toBe(PackStatusValue.DRAFT);
    expect(status.isDraft()).toBe(true);
  });

  it('should create from valid string', () => {
    const status = PackStatus.create('published');
    expect(status.toString()).toBe(PackStatusValue.PUBLISHED);
    expect(status.isPublished()).toBe(true);
  });

  it('should throw for invalid status', () => {
    expect(() => PackStatus.create('invalid')).toThrow('Invalid pack status: invalid');
  });

  it('should validate transitions', () => {
    const draft = PackStatus.draft();
    const underReview = PackStatus.create('under_review');
    const published = PackStatus.create('published');

    expect(draft.canTransitionTo(underReview)).toBe(true);
    expect(draft.canTransitionTo(published)).toBe(false);
    
    expect(underReview.canTransitionTo(published)).toBe(true);
    expect(underReview.canTransitionTo(draft)).toBe(true);

    expect(published.canTransitionTo(draft)).toBe(true);
    expect(published.canTransitionTo(underReview)).toBe(false);
  });

  it('should check equality', () => {
    const status1 = PackStatus.create('draft');
    const status2 = PackStatus.create('draft');
    const status3 = PackStatus.create('published');

    expect(status1.equals(status2)).toBe(true);
    expect(status1.equals(status3)).toBe(false);
  });
});
