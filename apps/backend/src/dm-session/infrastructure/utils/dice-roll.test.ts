import { describe, expect, it } from 'bun:test';
import { parseSkillCheck } from './dice-roll';

describe('parseSkillCheck', () => {
  it('caso válido: reconoce una tirada de habilidad con CD explícita', () => {
    const check = parseSkillCheck('Haz una tirada de Acrobacias (CD 15) para saltar el abismo.');
    expect(check).toEqual({
      skillName: 'Acrobacias',
      ability: 'dexterity',
      dc: 15,
      alwaysProficient: false,
    });
  });

  it('caso válido: reconoce una salvación con CD explícita', () => {
    const check = parseSkillCheck('Haz una tirada de salvación de Destreza (CD 14).');
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 14,
      isSavingThrow: true,
    });
  });

  it('caso límite: reconoce una salvación aunque el DM la envuelva en markdown', () => {
    const check = parseSkillCheck(
      'Haz una **tirada de salvación de Destreza** (CD 14) para esquivar la trampa.',
    );
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 14,
      isSavingThrow: true,
    });
  });

  it('caso inválido: texto sin ninguna tirada devuelve null', () => {
    expect(parseSkillCheck('Caminas por el pasillo en silencio.')).toBeNull();
  });
});
