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

  it('caso límite: reconoce una salvación con mayúscula y cláusula final tras la CD', () => {
    const check = parseSkillCheck(
      'Haz una tirada de Salvación de Destreza (CD 13) para esquivar el primer impacto lateral.',
    );
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 13,
      isSavingThrow: true,
    });
  });

  it('caso límite: reconoce una salvación aunque el acento venga en forma NFD (o + acento combinante)', () => {
    // Gemma a veces emite unicode descompuesto: 'o' (U+006F) + acento agudo combinante (U+0301),
    // en vez de la forma precompuesta 'ó' (U+00F3). Visualmente idéntico, bytes distintos.
    const nfdText = 'Haz una tirada de Salvaci\u006F\u0301n de Destreza (CD 13).';
    const check = parseSkillCheck(nfdText);
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 13,
      isSavingThrow: true,
    });
  });

  it('caso límite: reconoce una salvación con espacio de ancho fijo (NBSP) entre palabras', () => {
    const nbspText = 'Haz una tirada de salvaci\u00F3n\u00A0de\u00A0Destreza (CD 13).';
    const check = parseSkillCheck(nbspText);
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 13,
      isSavingThrow: true,
    });
  });

  it('caso inválido: texto sin ninguna tirada devuelve null', () => {
    expect(parseSkillCheck('Caminas por el pasillo en silencio.')).toBeNull();
  });
});
