import type { AbilityName, AbilityScores } from "@questmasters/dnd-rules";
import { calculateModifier, calculateProficiencyBonus } from "@questmasters/dnd-rules";

const SKILL_TO_ABILITY: Record<string, AbilityName> = {
  atletismo: "strength",
  acrobacia: "dexterity",
  acrobacias: "dexterity",
  "juego de manos": "dexterity",
  sigilo: "dexterity",
  arcanos: "intelligence",
  historia: "intelligence",
  investigación: "intelligence",
  investigacion: "intelligence",
  naturaleza: "intelligence",
  religión: "intelligence",
  religion: "intelligence",
  "trato con animales": "wisdom",
  perspicacia: "wisdom",
  medicina: "wisdom",
  percepción: "wisdom",
  percepcion: "wisdom",
  supervivencia: "wisdom",
  engaño: "charisma",
  engano: "charisma",
  intimidación: "charisma",
  intimidacion: "charisma",
  interpretación: "charisma",
  interpretacion: "charisma",
  persuasión: "charisma",
  persuasion: "charisma",
  // EN fallback (por si Gemma responde en inglés)
  athletics: "strength",
  stealth: "dexterity",
  "sleight of hand": "dexterity",
  arcana: "intelligence",
  history: "intelligence",
  investigation: "intelligence",
  nature: "intelligence",
  "animal handling": "wisdom",
  insight: "wisdom",
  medicine: "wisdom",
  perception: "wisdom",
  survival: "wisdom",
  deception: "charisma",
  intimidation: "charisma",
  performance: "charisma",
};

const ABILITY_NAME_ES: Record<string, AbilityName> = {
  fuerza: "strength",
  destreza: "dexterity",
  constitución: "constitution",
  inteligencia: "intelligence",
  sabiduría: "wisdom",
  carisma: "charisma",
};

export const SKILL_EN_TO_ES: Record<string, string> = {
  athletics: "atletismo",
  acrobatics: "acrobacia",
  "sleight of hand": "juego de manos",
  stealth: "sigilo",
  arcana: "arcanos",
  history: "historia",
  investigation: "investigación",
  nature: "naturaleza",
  religion: "religión",
  "animal handling": "trato con animales",
  insight: "perspicacia",
  medicine: "medicina",
  perception: "percepción",
  survival: "supervivencia",
  deception: "engaño",
  intimidation: "intimidación",
  performance: "interpretación",
  persuasion: "persuasión",
};

export const ALL_SKILLS: { index: string; nameEN: string; nameES: string; ability: AbilityName }[] = [
  { index: "skill-athletics", nameEN: "Athletics", nameES: "Atletismo", ability: "strength" },
  { index: "skill-acrobatics", nameEN: "Acrobatics", nameES: "Acrobacia", ability: "dexterity" },
  { index: "skill-sleight-of-hand", nameEN: "Sleight of Hand", nameES: "Juego de manos", ability: "dexterity" },
  { index: "skill-stealth", nameEN: "Stealth", nameES: "Sigilo", ability: "dexterity" },
  { index: "skill-arcana", nameEN: "Arcana", nameES: "Arcanos", ability: "intelligence" },
  { index: "skill-history", nameEN: "History", nameES: "Historia", ability: "intelligence" },
  { index: "skill-investigation", nameEN: "Investigation", nameES: "Investigación", ability: "intelligence" },
  { index: "skill-nature", nameEN: "Nature", nameES: "Naturaleza", ability: "intelligence" },
  { index: "skill-religion", nameEN: "Religion", nameES: "Religión", ability: "intelligence" },
  { index: "skill-animal-handling", nameEN: "Animal Handling", nameES: "Trato con animales", ability: "wisdom" },
  { index: "skill-insight", nameEN: "Insight", nameES: "Perspicacia", ability: "wisdom" },
  { index: "skill-medicine", nameEN: "Medicine", nameES: "Medicina", ability: "wisdom" },
  { index: "skill-perception", nameEN: "Perception", nameES: "Percepción", ability: "wisdom" },
  { index: "skill-survival", nameEN: "Survival", nameES: "Supervivencia", ability: "wisdom" },
  { index: "skill-deception", nameEN: "Deception", nameES: "Engaño", ability: "charisma" },
  { index: "skill-intimidation", nameEN: "Intimidation", nameES: "Intimidación", ability: "charisma" },
  { index: "skill-performance", nameEN: "Performance", nameES: "Interpretación", ability: "charisma" },
  { index: "skill-persuasion", nameEN: "Persuasion", nameES: "Persuasión", ability: "charisma" },
];

export interface SkillCheckRequest {
  skillName: string;
  ability: AbilityName;
  dc: number;
}

export interface RollResult {
  d20: number;
  modifier: number;
  proficiencyBonus: number;
  total: number;
  isProficient: boolean;
  isExpertise: boolean;
  isReliable: boolean;
}

export function parseSkillCheck(dmText: string): SkillCheckRequest | null {
  const matchCD = dmText.match(/tirada de ([^(]+)\(CD\s*(\d+)\)/i);
  if (matchCD) {
    const rawSkill = matchCD[1].trim().toLowerCase();
    const dc = parseInt(matchCD[2], 10);
    const ability = SKILL_TO_ABILITY[rawSkill] ?? ABILITY_NAME_ES[rawSkill];
    if (ability) return { skillName: matchCD[1].trim(), ability, dc };
  }

  const matchAbility = dmText.match(/tirada de ([^(]+)\((?:Sabiduría|Fuerza|Destreza|Constitución|Inteligencia|Carisma)\)/i);
  if (matchAbility) {
    const rawSkill = matchAbility[1].trim().toLowerCase();
    const ability = SKILL_TO_ABILITY[rawSkill] ?? ABILITY_NAME_ES[rawSkill];
    if (ability) return { skillName: matchAbility[1].trim(), ability, dc: 12 };
  }

  return null;
}

export function matchSkill(
  skillNameEs: string,
  proficiencies: string[],
): boolean {
  const normalized = skillNameEs.toLowerCase();
  for (const prof of proficiencies) {
    const profLower = prof.toLowerCase();
    if (profLower === normalized) return true;
    const esName = SKILL_EN_TO_ES[profLower];
    if (esName === normalized) return true;
    const fromIndex = profLower.replace("skill-", "").replace(/-/g, " ");
    const esFromIndex = SKILL_EN_TO_ES[fromIndex];
    if (esFromIndex === normalized) return true;
  }
  return false;
}

export interface CharacterRollContext {
  stats: AbilityScores;
  level: number;
  skillProficiencies: string[];
  expertiseSkills: string[];
  jackOfAllTrades: boolean;
  reliableTalent: boolean;
}

export function rollSkillCheck(
  ability: AbilityName,
  ctx: CharacterRollContext,
  skillNameEs: string,
): RollResult {
  let d20 = Math.floor(Math.random() * 20) + 1;
  const modifier = calculateModifier(ctx.stats[ability]);
  const isProficient = matchSkill(skillNameEs, ctx.skillProficiencies);
  const isExpertise = matchSkill(skillNameEs, ctx.expertiseSkills);
  const profBase = calculateProficiencyBonus(ctx.level);

  let proficiencyBonus = 0;
  if (isExpertise) {
    proficiencyBonus = profBase * 2;
  } else if (isProficient) {
    proficiencyBonus = profBase;
  } else if (ctx.jackOfAllTrades) {
    proficiencyBonus = Math.floor(profBase / 2);
  }

  const isReliable = ctx.reliableTalent && isProficient && d20 < 10;
  if (isReliable) d20 = 10;

  return {
    d20,
    modifier,
    proficiencyBonus,
    total: d20 + modifier + proficiencyBonus,
    isProficient: isProficient || isExpertise,
    isExpertise,
    isReliable,
  };
}

export function formatRollResult(
  check: SkillCheckRequest,
  roll: RollResult,
): string {
  const modSign = roll.modifier >= 0 ? "+" : "";
  const parts = [`d20(${roll.d20})`, `${modSign}${roll.modifier}`];
  if (roll.isExpertise) {
    parts.push(`+${roll.proficiencyBonus} expertise`);
  } else if (roll.isProficient) {
    parts.push(`+${roll.proficiencyBonus} prof`);
  } else if (roll.proficiencyBonus > 0) {
    parts.push(`+${roll.proficiencyBonus} JoAT`);
  }
  if (roll.isReliable) parts.push("(Reliable)");
  const pass = roll.total >= check.dc;
  return `[Tirada de ${check.skillName}: ${parts.join(" ")} = ${roll.total} vs CD ${check.dc} — ${pass ? "Éxito" : "Fallo"}]`;
}
