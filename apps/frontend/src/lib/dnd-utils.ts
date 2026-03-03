export function nameToIndex(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const CR_TO_XP: Record<string, number> = {
  "0": 10,
  "0.125": 25,
  "0.25": 50,
  "0.5": 100,
  "1": 200,
  "2": 450,
  "3": 700,
  "4": 1100,
  "5": 1800,
  "6": 2300,
  "7": 2900,
  "8": 3900,
  "9": 5000,
  "10": 5900,
  "11": 7200,
  "12": 8400,
  "13": 10000,
  "14": 11500,
  "15": 13000,
  "16": 15000,
  "17": 18000,
  "18": 20000,
  "19": 22000,
  "20": 25000,
  "21": 33000,
  "22": 41000,
  "23": 50000,
  "24": 62000,
  "25": 75000,
  "26": 90000,
  "27": 105000,
  "28": 120000,
  "29": 135000,
  "30": 155000,
};

export function crToXp(cr: number): number {
  return CR_TO_XP[String(cr)] ?? 0;
}

export const ABILITY_SCORES = [
  { index: "str", name: "STR", full: "Strength" },
  { index: "dex", name: "DEX", full: "Dexterity" },
  { index: "con", name: "CON", full: "Constitution" },
  { index: "int", name: "INT", full: "Intelligence" },
  { index: "wis", name: "WIS", full: "Wisdom" },
  { index: "cha", name: "CHA", full: "Charisma" },
] as const;

export const SIZES = [
  "Tiny",
  "Small",
  "Medium",
  "Large",
  "Huge",
  "Gargantuan",
] as const;

export const MAGIC_SCHOOLS = [
  { index: "abjuration", name: "Abjuration" },
  { index: "conjuration", name: "Conjuration" },
  { index: "divination", name: "Divination" },
  { index: "enchantment", name: "Enchantment" },
  { index: "evocation", name: "Evocation" },
  { index: "illusion", name: "Illusion" },
  { index: "necromancy", name: "Necromancy" },
  { index: "transmutation", name: "Transmutation" },
] as const;

export const RARITIES = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
  "Artifact",
] as const;

export const EQUIPMENT_CATEGORIES = [
  { index: "weapon", name: "Weapon" },
  { index: "armor", name: "Armor" },
  { index: "adventuring-gear", name: "Adventuring Gear" },
  { index: "tools", name: "Tools" },
  { index: "mounts-and-vehicles", name: "Mounts and Vehicles" },
  { index: "wondrous-item", name: "Wondrous Item" },
  { index: "rod", name: "Rod" },
  { index: "staff", name: "Staff" },
  { index: "wand", name: "Wand" },
  { index: "ring", name: "Ring" },
  { index: "potion", name: "Potion" },
  { index: "scroll", name: "Scroll" },
] as const;

export const DAMAGE_TYPES = [
  "Acid", "Bludgeoning", "Cold", "Fire", "Force",
  "Lightning", "Necrotic", "Piercing", "Poison",
  "Psychic", "Radiant", "Slashing", "Thunder",
] as const;

export const CHALLENGE_RATINGS = [
  0, 0.125, 0.25, 0.5,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
] as const;

export function formatCR(cr: number): string {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}
