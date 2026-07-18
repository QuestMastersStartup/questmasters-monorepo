import { describe, expect, it } from 'bun:test';
import { parseSkillCheck, autoRollSkillCheck } from './dice-roll';
import type { CharacterSnapshot } from '../../domain/entities/dm-session.entity';

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

  it('caso límite: reconoce una salvación con mayúscula y sin cláusula final (punto justo tras la CD)', () => {
    const check = parseSkillCheck('Haz una tirada de Salvación de Destreza (CD 17).');
    expect(check).toEqual({
      skillName: 'Salvación de Destreza',
      ability: 'dexterity',
      dc: 17,
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

describe('autoRollSkillCheck', () => {
  const character: CharacterSnapshot = {
    name: 'Test',
    race: 'Humano',
    class: 'Pícaro',
    background: 'Forastero',
    level: 5,
    backstory: '',
    alignment: 'Neutral',
    personalityTraits: '',
    stats: { strength: 10, dexterity: 16, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    skillProficiencies: [],
    expertiseSkills: [],
    jackOfAllTrades: false,
    reliableTalent: false,
  };

  it('caso estadístico: 200 tiradas de d20 no muestran sesgo hacia ningún valor (chi-cuadrado)', () => {
    // Sin mock de Math.random: usa el RNG real para detectar un seed fijo,
    // un valor cacheado, o cualquier otra fuente de sesgo real (ej. reutilizada
    // entre turnos del auto-jugador).
    const N = 200;
    const counts = new Array(21).fill(0); // índices 1..20
    const check = { skillName: 'Salvación de Destreza', ability: 'dexterity' as const, dc: 10, isSavingThrow: true };

    for (let i = 0; i < N; i++) {
      const formatted = autoRollSkillCheck(check, character);
      const match = /d20\((\d+)\)/.exec(formatted);
      if (!match) throw new Error(`no se pudo parsear el resultado: ${formatted}`);
      counts[parseInt(match[1], 10)] += 1;
    }

    const expected = N / 20;
    let chiSquare = 0;
    for (let value = 1; value <= 20; value++) {
      chiSquare += (counts[value] - expected) ** 2 / expected;
    }

    // Ver el test equivalente en apps/frontend/src/lib/diceRoll.test.ts para la
    // justificación del umbral (chi2 crítico df=19 a alpha=0.001 ~43.8).
    expect(chiSquare).toBeLessThan(45);
    expect(Math.max(...counts)).toBeLessThan(N * 0.25);
  });
});
