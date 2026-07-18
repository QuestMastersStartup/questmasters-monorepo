import type { AbilityName, AbilityScores } from '@questmasters/dnd-rules';
import { calculateModifier, calculateProficiencyBonus } from '@questmasters/dnd-rules';
import type { CharacterSnapshot } from '../../domain/entities/dm-session.entity';

const SKILL_TO_ABILITY: Record<string, AbilityName> = {
  atletismo: 'strength',
  acrobacia: 'dexterity',
  acrobacias: 'dexterity',
  'juego de manos': 'dexterity',
  sigilo: 'dexterity',
  arcanos: 'intelligence',
  historia: 'intelligence',
  investigación: 'intelligence',
  investigacion: 'intelligence',
  naturaleza: 'intelligence',
  religión: 'intelligence',
  religion: 'intelligence',
  'trato con animales': 'wisdom',
  perspicacia: 'wisdom',
  medicina: 'wisdom',
  percepción: 'wisdom',
  percepcion: 'wisdom',
  supervivencia: 'wisdom',
  engaño: 'charisma',
  engano: 'charisma',
  intimidación: 'charisma',
  intimidacion: 'charisma',
  interpretación: 'charisma',
  interpretacion: 'charisma',
  persuasión: 'charisma',
  persuasion: 'charisma',
  // EN fallback
  athletics: 'strength',
  acrobatics: 'dexterity',
  stealth: 'dexterity',
  'sleight of hand': 'dexterity',
  arcana: 'intelligence',
  history: 'intelligence',
  investigation: 'intelligence',
  nature: 'intelligence',
  'animal handling': 'wisdom',
  insight: 'wisdom',
  medicine: 'wisdom',
  perception: 'wisdom',
  survival: 'wisdom',
  deception: 'charisma',
  intimidation: 'charisma',
  performance: 'charisma',
};

const ABILITY_NAME_ES: Record<string, AbilityName> = {
  fuerza: 'strength',
  destreza: 'dexterity',
  constitución: 'constitution',
  inteligencia: 'intelligence',
  sabiduría: 'wisdom',
  carisma: 'charisma',
};

// Attack rolls: always proficient, ability varies by type
const ATTACK_ABILITY: Record<string, AbilityName> = {
  'ataque con arma': 'dexterity',
  'ataque a distancia': 'dexterity',
  'ataque cuerpo a cuerpo': 'strength',
  'ataque con arma de cuerpo a cuerpo': 'strength',
  'ataque con arma a distancia': 'dexterity',
  'ataque': 'dexterity',
};

const SKILL_EN_TO_ES: Record<string, string> = {
  athletics: 'atletismo',
  acrobatics: 'acrobacia',
  'sleight of hand': 'juego de manos',
  stealth: 'sigilo',
  arcana: 'arcanos',
  history: 'historia',
  investigation: 'investigación',
  nature: 'naturaleza',
  religion: 'religión',
  'animal handling': 'trato con animales',
  insight: 'perspicacia',
  medicine: 'medicina',
  perception: 'percepción',
  survival: 'supervivencia',
  deception: 'engaño',
  intimidation: 'intimidación',
  performance: 'interpretación',
  persuasion: 'persuasión',
};

export interface SkillCheckRequest {
  skillName: string;
  ability: AbilityName;
  dc: number;
  alwaysProficient?: boolean;
  isSavingThrow?: boolean;
}

function stripMarkdown(s: string): string {
  return s
    .normalize("NFC") // Gemma a veces emite acentos en forma NFD (o + acento combinante)
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F]/g, " ") // NBSP y otros espacios unicode -> espacio normal
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // caracteres de ancho cero
    .replace(/\*{1,2}/g, "")
    .replace(/_{1,2}/g, "")
    .replace(/`/g, "");
}

function resolveSkill(raw: string): { skillName: string; ability: AbilityName } | null {
  const normalized = stripMarkdown(raw).trim().toLowerCase();
  const candidates = normalized.includes(' o ')
    ? normalized.split(' o ').map((s) => s.trim())
    : [normalized];
  for (const candidate of candidates) {
    const attackAbility = ATTACK_ABILITY[candidate];
    if (attackAbility) return { skillName: candidate.charAt(0).toUpperCase() + candidate.slice(1), ability: attackAbility };
    const ability = SKILL_TO_ABILITY[candidate] ?? ABILITY_NAME_ES[candidate];
    if (ability) return { skillName: candidate.charAt(0).toUpperCase() + candidate.slice(1), ability };
  }
  return null;
}

function parseSavingThrow(dmText: string): SkillCheckRequest | null {
  const match = dmText.match(/(?:tirada de )?[Ss]alvaci[oó]n de (\w+)\s*\(CD\s*(\d+)\)/i);
  if (!match) return null;
  const abilityName = match[1].toLowerCase();
  const ability = ABILITY_NAME_ES[abilityName];
  if (!ability) return null;
  const dc = parseInt(match[2], 10);
  const displayName = `Salvación de ${abilityName.charAt(0).toUpperCase() + abilityName.slice(1)}`;
  return { skillName: displayName, ability, dc, isSavingThrow: true };
}

export function parseSkillCheck(dmText: string): SkillCheckRequest | null {
  const text = stripMarkdown(dmText);

  const savingThrow = parseSavingThrow(text);
  if (savingThrow) return savingThrow;

  const matchCD = text.match(/tirada de ([^(]+)\(CD\s*(\d+)\)/i);
  if (matchCD) {
    const dc = parseInt(matchCD[2], 10);
    const resolved = resolveSkill(matchCD[1]);
    if (resolved) {
      const attackAbility = ATTACK_ABILITY[matchCD[1].trim().toLowerCase()];
      return { ...resolved, dc, alwaysProficient: !!attackAbility };
    }
  }

  const matchAbility = text.match(/tirada de ([^(]+)\((?:Sabiduría|Fuerza|Destreza|Constitución|Inteligencia|Carisma)\)/i);
  if (matchAbility) {
    const resolved = resolveSkill(matchAbility[1]);
    if (resolved) return { ...resolved, dc: 12 };
  }

  return null;
}

function matchSkill(skillNameEs: string, proficiencies: string[]): boolean {
  const normalized = skillNameEs.toLowerCase();
  for (const prof of proficiencies) {
    const profLower = prof.toLowerCase();
    if (profLower === normalized) return true;
    const esName = SKILL_EN_TO_ES[profLower];
    if (esName === normalized) return true;
    const fromIndex = profLower.replace('skill-', '').replace(/-/g, ' ');
    const esFromIndex = SKILL_EN_TO_ES[fromIndex];
    if (esFromIndex === normalized) return true;
  }
  return false;
}

export function autoRollSkillCheck(
  check: SkillCheckRequest,
  character: CharacterSnapshot,
): string {
  const stats = character.stats!;
  const d20 = Math.floor(Math.random() * 20) + 1;
  const modifier = calculateModifier(stats[check.ability]);

  if (check.isSavingThrow) {
    const total = d20 + modifier;
    const modSign = modifier >= 0 ? '+' : '';
    const pass = total >= check.dc;
    return `[Tirada de ${check.skillName}: d20(${d20}) ${modSign}${modifier} = ${total} vs CD ${check.dc} — ${pass ? 'Éxito' : 'Fallo'}]`;
  }

  const proficiencies = character.skillProficiencies ?? [];
  const expertise = character.expertiseSkills ?? [];
  const profBase = calculateProficiencyBonus(character.level);

  let adjustedD20 = d20;
  const skillEs = check.skillName.toLowerCase();
  const isProficient = matchSkill(skillEs, proficiencies);
  const isExpertise = matchSkill(skillEs, expertise);

  let profBonus = 0;
  if (isExpertise) {
    profBonus = profBase * 2;
  } else if (isProficient || check.alwaysProficient) {
    profBonus = profBase;
  } else if (character.jackOfAllTrades) {
    profBonus = Math.floor(profBase / 2);
  }

  const isReliable = character.reliableTalent && isProficient && adjustedD20 < 10;
  if (isReliable) adjustedD20 = 10;

  const total = adjustedD20 + modifier + profBonus;
  const modSign = modifier >= 0 ? '+' : '';
  const parts = [`d20(${adjustedD20})`, `${modSign}${modifier}`];
  if (isExpertise) {
    parts.push(`+${profBonus} expertise`);
  } else if (isProficient) {
    parts.push(`+${profBonus} prof`);
  } else if (profBonus > 0) {
    parts.push(`+${profBonus} JoAT`);
  }
  if (isReliable) parts.push('(Reliable)');
  const pass = total >= check.dc;
  return `[Tirada de ${check.skillName}: ${parts.join(' ')} = ${total} vs CD ${check.dc} — ${pass ? 'Éxito' : 'Fallo'}]`;
}
