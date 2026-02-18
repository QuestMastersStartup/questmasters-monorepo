import { useState } from "react";
import { Plus, X, Search, ChevronDown } from "lucide-react";
import { FormField, INPUT_CLASS } from "./FormField";
import { nameToIndex } from "../../../../lib/dnd-utils";
import type { PackAsset } from "../PackForm";
import type { ReferenceItem } from "@questmasters/dnd-rules";

interface ReferencePickerProps {
  label: string;
  /** Filter packAssets by this type (e.g. "proficiency", "trait") */
  filterType: string;
  packAssets: PackAsset[];
  value: ReferenceItem[];
  onChange: (refs: ReferenceItem[]) => void;
  onCreateInline?: (name: string, type: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

export function ReferencePicker({
  label,
  filterType,
  packAssets,
  value,
  onChange,
  onCreateInline,
  required,
  hint,
  error,
  className,
}: ReferencePickerProps) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const available = packAssets
    .filter((a) => a.type === filterType)
    .filter((a) => {
      const assetName = a.name || a.data?.name || "";
      return assetName.toLowerCase().includes(search.toLowerCase());
    })
    .filter((a) => {
      const idx = a.data?.index || nameToIndex(a.name || "");
      return !value.some((v) => v.index === idx);
    });

  const addRef = (asset: PackAsset) => {
    const name = asset.name || asset.data?.name || "";
    const index = asset.data?.index || nameToIndex(name);
    onChange([
      ...value,
      { index, name, url: `/api/${filterType}s/${index}` },
    ]);
    setSearch("");
    setShowDropdown(false);
  };

  const removeRef = (index: string) => {
    onChange(value.filter((v) => v.index !== index));
  };

  const handleInlineCreate = () => {
    if (!newName.trim()) return;
    const index = nameToIndex(newName);
    // Create the sub-asset in the pack
    onCreateInline?.(newName.trim(), filterType);
    // Add the reference
    onChange([
      ...value,
      { index, name: newName.trim(), url: `/api/${filterType}s/${index}` },
    ]);
    setNewName("");
    setShowInlineCreate(false);
  };

  return (
    <FormField
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      {/* Selected refs as pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((ref) => (
            <span
              key={ref.index}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
            >
              {ref.name}
              <button
                type="button"
                onClick={() => removeRef(ref.index)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + dropdown */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              className={`${INPUT_CLASS} !pl-8`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={`Search existing ${filterType}s...`}
            />
            {showDropdown && (
              <button
                type="button"
                className="absolute right-2 top-2.5 text-muted-foreground"
                onClick={() => setShowDropdown(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>
          {onCreateInline && (
            <button
              type="button"
              onClick={() => setShowInlineCreate(!showInlineCreate)}
              className="btn btn-outline btn-sm shrink-0 gap-1"
            >
              <Plus className="w-3 h-3" /> New
            </button>
          )}
        </div>

        {showDropdown && available.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
            {available.map((asset) => {
              const assetName = asset.name || asset.data?.name || "Unnamed";
              return (
                <button
                  key={asset.data?.index || assetName}
                  type="button"
                  onClick={() => addRef(asset)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  {assetName}
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {asset.data?.index}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {showDropdown && available.length === 0 && search && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
            No matching {filterType}s found.
            {onCreateInline && " Click \"New\" to create one."}
          </div>
        )}
      </div>

      {/* Inline create */}
      {showInlineCreate && (
        <div className="flex gap-2 mt-2 p-3 rounded-md bg-muted/30 border border-border/60">
          <input
            autoFocus
            className={`${INPUT_CLASS} flex-1`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${filterType} name...`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInlineCreate();
              }
            }}
          />
          <button
            type="button"
            onClick={handleInlineCreate}
            disabled={!newName.trim()}
            className="btn btn-primary btn-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInlineCreate(false);
              setNewName("");
            }}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </FormField>
  );
}
