import { describe, expect, it } from 'bun:test';
import { UUID } from './uuid.vo';

describe('UUID Value Object', () => {
  it('should generate a valid UUID', () => {
    const uuid = UUID.generate();
    expect(UUID.isValid(uuid.toString())).toBe(true);
  });

  it('should create a UUID from a valid string', () => {
    const validString = '550e8400-e29b-41d4-a716-446655440000';
    const uuid = UUID.fromString(validString);
    expect(uuid.toString()).toBe(validString);
  });

  it('should throw an error for an invalid UUID string', () => {
    const invalidString = 'invalid-uuid';
    expect(() => UUID.fromString(invalidString)).toThrow(
      'Invalid UUID: invalid-uuid',
    );
  });

  it('should correctly compare two UUIDs', () => {
    const string = '550e8400-e29b-41d4-a716-446655440000';
    const uuid1 = UUID.fromString(string);
    const uuid2 = UUID.fromString(string);
    const uuid3 = UUID.generate();

    expect(uuid1.equals(uuid2)).toBe(true);
    expect(uuid1.equals(uuid3)).toBe(false);
  });

  it('should validate valid UUIDs correctly', () => {
    expect(UUID.isValid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(UUID.isValid('invalid-uuid')).toBe(false);
  });
});
