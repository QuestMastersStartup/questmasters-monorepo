import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Shield,
  Sword,
  Scroll,
  Box,
  BookOpen,
  Users,
  Sparkles,
  Cog,
} from "lucide-react";
import type { AssetData } from "@questmasters/dnd-rules";
import { getFormLayout, getAssetForm } from "./asset-forms";
import type { PackAsset } from "./PackForm";
import { nameToIndex } from "../../../lib/dnd-utils";

export interface NewAssetData {
  type: string;
  name: string;
  data: AssetData;
}

const ASSET_TYPE_CATEGORIES = [
  {
    label: "Character",
    icon: Users,
    types: [
      { value: "class", label: "Class" },
      { value: "subclass", label: "Subclass" },
      { value: "race", label: "Race" },
      { value: "subrace", label: "Subrace" },
      { value: "species", label: "Species" },
      { value: "background", label: "Background" },
      { value: "feat", label: "Feat" },
      { value: "feature", label: "Feature" },
    ],
  },
  {
    label: "Content",
    icon: Sparkles,
    types: [
      { value: "spell", label: "Spell" },
      { value: "monster", label: "Monster" },
      { value: "equipment", label: "Equipment" },
      { value: "magic-item", label: "Magic Item" },
    ],
  },
  {
    label: "Mechanics",
    icon: Cog,
    types: [
      { value: "trait", label: "Trait" },
      { value: "condition", label: "Condition" },
      { value: "damage-type", label: "Damage Type" },
      { value: "ability-score", label: "Ability Score" },
      { value: "skill", label: "Skill" },
      { value: "proficiency", label: "Proficiency" },
      { value: "level", label: "Level" },
    ],
  },
  {
    label: "Systems",
    icon: BookOpen,
    types: [
      { value: "language", label: "Language" },
      { value: "alignment", label: "Alignment" },
      { value: "magic-school", label: "Magic School" },
      { value: "weapon-property", label: "Weapon Property" },
      { value: "weapon-mastery", label: "Weapon Mastery" },
      { value: "equipment-category", label: "Equipment Category" },
    ],
  },
  {
    label: "Rules",
    icon: Shield,
    types: [
      { value: "rule", label: "Rule" },
      { value: "rule-section", label: "Rule Section" },
    ],
  },
];

function getIconForType(type: string) {
  switch (type) {
    case "magic-item":
    case "equipment":
    case "weapon-property":
    case "weapon-mastery":
      return <Sword className="w-4 h-4" />;
    case "spell":
    case "magic-school":
      return <Scroll className="w-4 h-4" />;
    case "class":
    case "subclass":
      return <Shield className="w-4 h-4" />;
    default:
      return <Box className="w-4 h-4" />;
  }
}

interface AddAssetModalProps {
  onAdd: (asset: NewAssetData) => void;
  onClose: () => void;
  onOpenPanel?: (type: string, typeLabel: string) => void;
  packAssets?: PackAsset[];
  onCreateSubAsset?: (asset: NewAssetData) => void;
}

export function AddAssetModal({
  onAdd,
  onClose,
  onOpenPanel,
  packAssets = [],
  onCreateSubAsset,
}: AddAssetModalProps) {
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const selectedTypeLabel =
    ASSET_TYPE_CATEGORIES.flatMap((c) => c.types).find(
      (t) => t.value === selectedType,
    )?.label ?? selectedType;

  const handleSelectType = (type: string) => {
    const layout = getFormLayout(type);

    if (layout === "panel" && onOpenPanel) {
      const label =
        ASSET_TYPE_CATEGORIES.flatMap((c) => c.types).find(
          (t) => t.value === type,
        )?.label ?? type;
      onClose();
      onOpenPanel(type, label);
      return;
    }

    setSelectedType(type);
    setStep("details");
  };

  const layout = selectedType ? getFormLayout(selectedType) : "modal-basic";
  const isRichModal = layout === "modal-rich";

  const handleSubmit = () => {
    if (!selectedType || !name.trim()) return;

    const index = nameToIndex(name);

    onAdd({
      type: selectedType,
      name: name.trim(),
      data: {
        name: name.trim(),
        index,
        desc: description.trim() ? [description.trim()] : [],
      },
    });
  };

  const handleRichFormSubmit = (data: AssetData) => {
    const assetName = data.name || "Unnamed";
    const index = data.index || nameToIndex(assetName);
    onAdd({
      type: selectedType,
      name: assetName,
      data: { ...data, index },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-card border border-border rounded-xl w-full mx-4 shadow-2xl animate-fade-in overflow-hidden ${
          step === "details" && isRichModal ? "max-w-xl" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-cinzel font-bold">
            {step === "type" ? "Select Asset Type" : `New ${selectedTypeLabel}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "type" ? (
          /* Step 1: Type Selection */
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
            {ASSET_TYPE_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.label}>
                  <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                    <CategoryIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {category.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.types.map((assetType) => (
                      <button
                        key={assetType.value}
                        type="button"
                        onClick={() => handleSelectType(assetType.value)}
                        className="flex items-center gap-2 p-3 rounded-lg border border-border/60 bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="text-muted-foreground group-hover:text-primary transition-colors">
                          {getIconForType(assetType.value)}
                        </div>
                        <span className="text-sm font-medium">
                          {assetType.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : isRichModal ? (
          /* Step 2a: Rich Form (modal-rich types like feat, magic-item, background) */
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setStep("type");
                setSelectedType("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              &larr; Change type
            </button>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
              <div className="text-primary">{getIconForType(selectedType)}</div>
              <span className="text-sm font-medium text-primary capitalize">
                {selectedTypeLabel}
              </span>
            </div>

            {(() => {
              const FormComponent = getAssetForm(selectedType);
              return (
                <FormComponent
                  onSubmit={handleRichFormSubmit}
                  packAssets={packAssets}
                  onCreateSubAsset={onCreateSubAsset ?? (() => {})}
                />
              );
            })()}
          </div>
        ) : (
          /* Step 2b: Basic Form (simple types) */
          <div className="p-4 space-y-4" onKeyDown={handleKeyDown}>
            <button
              type="button"
              onClick={() => {
                setStep("type");
                setSelectedType("");
                setName("");
                setDescription("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Change type
            </button>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-primary">{getIconForType(selectedType)}</div>
              <span className="text-sm font-medium text-primary capitalize">
                {selectedTypeLabel}
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-asset-name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="new-asset-name"
                name="newName"
                autoFocus
                className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${getPlaceholderForType(selectedType)}`}
              />
              {name.trim() && (
                <p className="text-xs text-muted-foreground font-mono">
                  index: {nameToIndex(name)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-asset-description"
                className="text-sm font-medium"
              >
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                id="new-asset-description"
                name="newDescription"
                className="w-full min-h-[80px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this asset..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="btn btn-primary gap-2"
              >
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function getPlaceholderForType(type: string): string {
  switch (type) {
    case "class":
      return "Ranger";
    case "subclass":
      return "Beast Master";
    case "race":
      return "Dragonborn";
    case "subrace":
      return "Hill Dwarf";
    case "species":
      return "Awakened Shrub";
    case "spell":
      return "Fireball";
    case "monster":
      return "Ancient Red Dragon";
    case "equipment":
      return "Longsword";
    case "magic-item":
      return "Cloak of Invisibility";
    case "feat":
      return "Great Weapon Master";
    case "feature":
      return "Second Wind";
    case "background":
      return "Sage";
    case "trait":
      return "Darkvision";
    case "condition":
      return "Stunned";
    case "skill":
      return "Perception";
    case "proficiency":
      return "Light Armor";
    case "language":
      return "Elvish";
    case "alignment":
      return "Chaotic Good";
    case "magic-school":
      return "Evocation";
    case "weapon-property":
      return "Finesse";
    case "weapon-mastery":
      return "Graze";
    case "damage-type":
      return "Fire";
    case "ability-score":
      return "Dexterity";
    case "rule":
      return "Combat";
    case "rule-section":
      return "Opportunity Attacks";
    case "level":
      return "Wizard Level 5";
    case "equipment-category":
      return "Martial Weapons";
    default:
      return "My Custom Asset";
  }
}
