import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { AssetData } from "@questmasters/dnd-rules";
import type { PackAsset } from "./PackForm";
import type { NewAssetData } from "./AddAssetModal";
import { getAssetForm } from "./asset-forms";
import { nameToIndex } from "../../../lib/dnd-utils";

interface AssetFormPanelProps {
  type: string;
  typeLabel: string;
  packAssets: PackAsset[];
  onAdd: (asset: NewAssetData) => void;
  onAddSubAsset: (asset: NewAssetData) => void;
  onClose: () => void;
}

export function AssetFormPanel({
  type,
  typeLabel,
  packAssets,
  onAdd,
  onAddSubAsset,
  onClose,
}: AssetFormPanelProps) {
  const FormComponent = getAssetForm(type);

  const handleSubmit = (data: AssetData) => {
    const name = data.name || "Unnamed";
    const index = data.index || nameToIndex(name);
    onAdd({
      type,
      name,
      data: { ...data, index },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl h-full bg-card border-l border-border shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h3 className="text-lg font-cinzel font-bold">
              New {typeLabel}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details for your homebrew {typeLabel.toLowerCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <FormComponent
            onSubmit={handleSubmit}
            packAssets={packAssets}
            onCreateSubAsset={onAddSubAsset}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
