import { describe, it, expect } from "vitest";
import { resolveChoice } from "./resolver";
import { Choice, OptionSet } from "../types/core.types";

describe("resolveChoice", () => {
  // Mock Data: "Choose 2 Skills from [Acrobatics, Athletics, Perception]"
  const skillOptions: OptionSet = {
    option_set_type: "options_array",
    options: [
      {
        option_type: "reference",
        item: {
          index: "skill-acrobatics",
          name: "Acrobatics",
          url: "/api/sk/acr",
        },
      },
      {
        option_type: "reference",
        item: {
          index: "skill-athletics",
          name: "Athletics",
          url: "/api/sk/ath",
        },
      },
      {
        option_type: "reference",
        item: {
          index: "skill-perception",
          name: "Perception",
          url: "/api/sk/per",
        },
      },
    ],
  };

  const skillChoice: Choice = {
    choose: 2,
    type: "proficiency",
    from: skillOptions,
  };

  it("should resolve valid selections correctly", () => {
    const selections = ["skill-acrobatics", "skill-perception"];
    const result = resolveChoice(skillChoice, selections);

    expect(result.features).toHaveLength(2);
    expect(result.features[0].name).toBe("Acrobatics");
    expect(result.features[1].name).toBe("Perception");
    expect(result.warnings).toHaveLength(0);
  });

  it("should truncate excessive selections", () => {
    const selections = [
      "skill-acrobatics",
      "skill-athletics",
      "skill-perception",
    ]; // 3 selected, only 2 allowed
    const result = resolveChoice(skillChoice, selections);

    expect(result.features).toHaveLength(2); // Should cap at 2
    expect(result.warnings).toContain(
      "Selected 3 items, but allowed 2. Taking first 2.",
    );
  });

  it("should warn on invalid IDs", () => {
    const selections = ["skill-flying"]; // Invalid
    const result = resolveChoice(skillChoice, selections);

    expect(result.features).toHaveLength(0);
    expect(result.warnings).toContain(
      "Invalid selection: skill-flying is not a valid option.",
    );
  });

  it("should warn (not fail) when fewer selections than allowed are made", () => {
    const selections = ["skill-acrobatics"]; // only 1 of 2 allowed
    const result = resolveChoice(skillChoice, selections);

    expect(result.features).toHaveLength(1);
    expect(result.warnings).toContain("Selected only 1/2 items.");
  });

  it("should resolve a counted_reference option via its 'of' item", () => {
    const torchesOptions: OptionSet = {
      option_set_type: "options_array",
      options: [
        {
          option_type: "counted_reference",
          count: 5,
          of: { index: "torch", name: "Torch", url: "/api/eq/torch" },
        },
      ],
    };
    const torchesChoice: Choice = {
      choose: 1,
      type: "equipment",
      from: torchesOptions,
    };

    const result = resolveChoice(torchesChoice, ["torch"]);

    expect(result.features).toHaveLength(1);
    expect(result.features[0].name).toBe("Torch");
    expect(result.warnings).toHaveLength(0);
  });

  it("should resolve nothing for an option_set_type it can't enumerate (e.g. equipment_category)", () => {
    const categoryOptions: OptionSet = {
      option_set_type: "equipment_category",
      equipment_category: {
        index: "simple-weapons",
        name: "Simple Weapons",
        url: "/api/ec/simple-weapons",
      },
    };
    const categoryChoice: Choice = {
      choose: 1,
      type: "equipment",
      from: categoryOptions,
    };

    const result = resolveChoice(categoryChoice, ["dagger"]);

    // getAllOptions() can't enumerate this set type, so every selection is "invalid"
    expect(result.features).toHaveLength(0);
    expect(result.warnings).toContain(
      "Invalid selection: dagger is not a valid option.",
    );
  });
});
