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
}

function resolveSkill(raw: string): { skillName: string; ability: AbilityName } | null {
  const normalized = raw.trim().toLowerCase();
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

export function parseSkillCheck(dmText: string): SkillCheckRequest | null {
  const matchCD = dmText.match(/tirada de ([^(]+)\(CD\s*(\d+)\)/i);
  if (matchCD) {
    const dc = parseInt(matchCD[2], 10);
    const resolved = resolveSkill(matchCD[1]);
    if (resolved) {
      const attackAbility = ATTACK_ABILITY[matchCD[1].trim().toLowerCase()];
      return { ...resolved, dc, alwaysProficient: !!attackAbility };
    }
  }

  const matchAbility = dmText.match(/tirada de ([^(]+)\((?:Sabiduría|Fuerza|Destreza|Constitución|Inteligencia|Carisma)\)/i);
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
  const proficiencies = character.skillProficiencies ?? [];
  const expertise = character.expertiseSkills ?? [];
  const profBase = calculateProficiencyBonus(character.level);

  let d20 = Math.floor(Math.random() * 20) + 1;
  const modifier = calculateModifier(stats[check.ability]);
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

  const isReliable = character.reliableTalent && isProficient && d20 < 10;
  if (isReliable) d20 = 10;

  const total = d20 + modifier + profBonus;
  const modSign = modifier >= 0 ? '+' : '';
  const parts = [`d20(${d20})`, `${modSign}${modifier}`];
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
