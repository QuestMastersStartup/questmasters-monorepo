import { describe, expect, it } from 'bun:test';
import { SystemType, SystemTypeValue } from './system-type.vo';

describe('SystemType Value Object', () => {
  it('should create from string', () => {
    const type = SystemType.create('dnd-5e-2024');
    expect(type.toString()).toBe(SystemTypeValue.DND_5E_2024);
  });

  it('should throw for invalid type', () => {
    expect(() => SystemType.create('pathfinder')).toThrow('Invalid SystemType: pathfinder');
  });

  it('should use factory methods', () => {
    expect(SystemType.dnd35().toString()).toBe(SystemTypeValue.DND_3_5);
    expect(SystemType.dnd5e2014().toString()).toBe(SystemTypeValue.DND_5E_2014);
    expect(SystemType.dnd5e2024().toString()).toBe(SystemTypeValue.DND_5E_2024);
  });

  it('should check equality', () => {
    const type1 = SystemType.dnd5e2024();
    const type2 = SystemType.dnd5e2024();
    const type3 = SystemType.create('universal');

    expect(type1.equals(type2)).toBe(true);
    expect(type1.equals(type3)).toBe(false);
  });
});
