import {
  Choice,
  ReferenceItem,
  OptionSet,
  Option,
  EquipmentCategoryOption,
} from "../types/core.types";

export interface ResolutionResult {
  features: ReferenceItem[];
  warnings: string[];
}

export type SelectionMap = Record<string, string[]>; // choice_index -> [selected_item_index_1, ...]

/**
 * Resolves a complex Choice object into a flat list of granted items based on user selections.
 *
 * @param choice The Choice object from the rules (e.g. "Choose 2 skills")
 * @param selectionIds The IDs selected by the user (e.g. ["skill-athletics", "skill-perception"])
 * @returns A flat list of ReferenceItems that should be added to the character sheet
 */
export function resolveChoice(
  choice: Choice,
  selectionIds: string[],
): ResolutionResult {
  const result: ResolutionResult = {
    features: [],
    warnings: [],
  };

  // 1. Validate count
  if (selectionIds.length > choice.choose) {
    result.warnings.push(
      `Selected ${selectionIds.length} items, but allowed ${choice.choose}. Taking first ${choice.choose}.`,
    );
    // Truncate to allowed count
    selectionIds = selectionIds.slice(0, choice.choose);
  } else if (selectionIds.length < choice.choose) {
    result.warnings.push(
      `Selected only ${selectionIds.length}/${choice.choose} items.`,
    );
  }

  // 2. Resolve items
  const options = getAllOptions(choice.from);

  for (const selectedId of selectionIds) {
    const matchedOption = options.find(
      (opt) => getOptionId(opt) === selectedId,
    );

    if (!matchedOption) {
      result.warnings.push(
        `Invalid selection: ${selectedId} is not a valid option.`,
      );
      continue;
    }

    if (matchedOption.option_type === "reference" && matchedOption.item) {
      result.features.push(matchedOption.item);
    } else if (
      matchedOption.option_type === "counted_reference" &&
      matchedOption.of
    ) {
      // For counted references (e.g. "5 torches"), we might want to return it 5 times or return the object with a count.
      // For now, simpler approach: return the item.
      result.features.push(matchedOption.of);
    }
    // TODO: Handle nested choices? (matchedOption.choice)
    // Usually these are recursive, but for v1 we focus on flat references.
  }

  return result;
}

// Helpers

function getAllOptions(optionSet: OptionSet): Option[] {
  if (optionSet.option_set_type === "options_array") {
    return optionSet.options;
  }
  // Handle other set types like 'equipment_category' logic if needed
  // For equipment categories, 'options' are technically infinite (all items in category), which implies we can't pre-list them easily here without external DB access.
  // Ideally, the 'Resolver' would need a 'Provider' interface to look up items.
  // For this pure logic library, we might restricted functionality or need dependency injection.
  return [];
}

function getOptionId(option: Option): string | undefined {
  if (option.item) return option.item.index;
  if (option.of) return option.of.index;
  return undefined;
}
