import {
  Prerequisite,
  ValidationContext,
  ValidationResult,
} from "../types/prerequisites.types";

export function validatePrerequisites(
  prerequisites: Prerequisite[],
  context: ValidationContext,
): ValidationResult {
  const errors: string[] = [];

  for (const prereq of prerequisites) {
    let met = false;
    let errorMsg = "";

    switch (prereq.type) {
      case "ability_score":
        if (prereq.ability && prereq.min_score) {
          const charScore = context.character.stats[prereq.ability] || 0;
          met = charScore >= prereq.min_score;
          errorMsg = `Requires ${prereq.ability.toUpperCase()} ${prereq.min_score}`;
        }
        break;

      case "proficiency":
        if (prereq.target) {
          met = context.character.proficiencies.includes(prereq.target);
          errorMsg = `Requires proficiency in ${prereq.target}`;
        }
        break;

      case "level":
        if (prereq.min_level) {
          met = context.character.level >= prereq.min_level;
          errorMsg = `Requires Level ${prereq.min_level}`;
        }
        break;

      // Add other cases (race, etc.) here
      default:
        // Unknown prerequisites pass by default to avoid blocking valid custom content
        met = true;
        break;
    }

    if (!met) {
      if (prereq.description) {
        errorMsg = prereq.description; // Override with custom text if provided
      }
      errors.push(errorMsg);
    }
  }

  const success = errors.length === 0;

  // "Free Mode" Logic:
  // If strict=false (Free Mode), we return success=true even if there were errors,
  // but we flag it as "ignored" so the UI can show a warning icon if desired.
  if (!context.strict && !success) {
    return {
      success: true,
      ignored: true,
      errors: errors,
    };
  }

  return {
    success: success,
    ignored: false,
    errors: errors,
  };
}
