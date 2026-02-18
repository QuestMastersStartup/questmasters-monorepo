export enum AssetTypeValue {
  CLASS = 'class',
  SUBCLASS = 'subclass',
  RACE = 'race',
  SUBRACE = 'subrace',
  SPECIES = 'species',
  SPELL = 'spell',
  MONSTER = 'monster',
  EQUIPMENT = 'equipment',
  MAGIC_ITEM = 'magic-item',
  FEAT = 'feat',
  FEATURE = 'feature',
  BACKGROUND = 'background',
  TRAIT = 'trait',
  CONDITION = 'condition',
  DAMAGE_TYPE = 'damage-type',
  ABILITY_SCORE = 'ability-score',
  SKILL = 'skill',
  PROFICIENCY = 'proficiency',
  LANGUAGE = 'language',
  ALIGNMENT = 'alignment',
  MAGIC_SCHOOL = 'magic-school',
  WEAPON_PROPERTY = 'weapon-property',
  EQUIPMENT_CATEGORY = 'equipment-category',
  RULE = 'rule',
  RULE_SECTION = 'rule-section',
  LEVEL = 'level',
  WEAPON_MASTERY = 'weapon-mastery',
}

export class AssetType {
  private constructor(private readonly value: AssetTypeValue) {}

  static create(value: string): AssetType {
    if (!AssetType.isValid(value)) {
      throw new Error(`Invalid AssetType: ${value}`);
    }
    return new AssetType(value as AssetTypeValue);
  }

  static isValid(value: string): boolean {
    return Object.values(AssetTypeValue).includes(value as AssetTypeValue);
  }

  static values(): AssetTypeValue[] {
    return Object.values(AssetTypeValue);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetType): boolean {
    return this.value === other.value;
  }
}
