import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  Box,
  Shield,
  Sword,
  Scroll,
} from "lucide-react";
import type { AssetData } from "@questmasters/dnd-rules";
import { AddAssetModal, type NewAssetData } from "./AddAssetModal";
import { AssetFormPanel } from "./AssetFormPanel";
import { useDraftPersistence } from "../../../hooks/useDraftPersistence";

export interface PackFormData {
  name: string;
  description: string;
  version: string;
  type: string;
}

export interface PackAsset {
  type: string;
  data: AssetData;
  name?: string;
}

interface PackFormProps {
  initialValues?: Partial<PackFormData>;
  initialAssets?: PackAsset[];
  onSubmit: (data: PackFormData, assets: PackAsset[]) => Promise<void>;
  isLoading: boolean;
  submitLabel?: string;
  draftKey?: string;
}

interface DraftState {
  formData: PackFormData;
  assets: PackAsset[];
}

const EMPTY_ASSETS: PackAsset[] = [];

export function PackForm({
  initialValues,
  initialAssets = EMPTY_ASSETS,
  onSubmit,
  isLoading,
  submitLabel = "Save Pack",
  draftKey,
}: PackFormProps) {
  const storageKey = draftKey ? `qm-draft:${draftKey}` : "";

  const [formData, setFormData] = useState<PackFormData>(() => {
    const base: PackFormData = {
      name: "",
      description: "",
      version: "1.0.0",
      type: "homebrew",
      ...initialValues,
    };
    // Try to restore from draft on initial mount
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const draft: DraftState = JSON.parse(raw).data;
          if (draft?.formData) return { ...base, ...draft.formData };
        }
      } catch {
        /* ignore */
      }
    }
    return base;
  });

  const [assets, setAssets] = useState<PackAsset[]>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const draft: DraftState = JSON.parse(raw).data;
          if (draft?.assets?.length > 0) return draft.assets;
        }
      } catch {
        /* ignore */
      }
    }
    return initialAssets;
  });

  const [draftRestored, setDraftRestored] = useState(() => {
    if (!storageKey) return false;
    return localStorage.getItem(storageKey) !== null;
  });

  // Draft persistence — auto-save every 1s after changes
  const draftState = useMemo<DraftState>(
    () => ({ formData, assets }),
    [formData, assets],
  );
  const { clearDraft } = useDraftPersistence(
    storageKey,
    draftState,
    !!storageKey,
  );

  const handleDismissDraft = () => {
    clearDraft();
    setDraftRestored(false);
    setFormData({
      name: "",
      description: "",
      version: "1.0.0",
      type: "homebrew",
      ...initialValues,
    });
    setAssets(initialAssets);
  };

  // Warn before closing tab/window with unsaved changes
  const hasChanges = formData.name.trim() !== "" || assets.length > 0;
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // Sync initialValues if they change (e.g. data loaded async)
  const initialValuesKey = initialValues ? JSON.stringify(initialValues) : "";
  useEffect(() => {
    if (initialValues && !draftRestored) {
      setFormData((prev) => ({ ...prev, ...initialValues }));
    }
  }, [initialValuesKey]);

  const initialAssetsKey =
    initialAssets.length > 0
      ? JSON.stringify(initialAssets.map((a) => a.data?.index ?? a.name))
      : "";
  useEffect(() => {
    if (initialAssets.length > 0 && !draftRestored) {
      setAssets(initialAssets);
    }
  }, [initialAssetsKey]);

  // Asset Filtration
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filteredAssets = assets.filter((asset) => {
    const assetName = asset.name || asset.data?.name || "";
    const matchesSearch = assetName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const assetsByType = filteredAssets.reduce(
    (acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = [];
      }
      acc[asset.type].push(asset);
      return acc;
    },
    {} as Record<string, PackAsset[]>,
  );

  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [panelState, setPanelState] = useState<{
    type: string;
    typeLabel: string;
  } | null>(null);

  const handleOpenPanel = (type: string, typeLabel: string) => {
    setPanelState({ type, typeLabel });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData, assets);
    clearDraft();
    setDraftRestored(false);
  };

  const handleAddAsset = (newAsset: NewAssetData) => {
    setAssets((prev) => [
      ...prev,
      {
        type: newAsset.type,
        name: newAsset.name,
        data: newAsset.data,
      },
    ]);
    setShowAddAssetModal(false);
    setPanelState(null);
  };

  // Sub-assets are created inline from reference pickers (e.g. traits inside a race)
  const handleAddSubAsset = (newAsset: NewAssetData) => {
    setAssets((prev) => [
      ...prev,
      {
        type: newAsset.type,
        name: newAsset.name,
        data: newAsset.data,
      },
    ]);
  };

  const removeAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const assetTypes = Object.keys(assetsByType).sort();

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Draft Restored Banner */}
      {draftRestored && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
          <span className="text-primary">
            Unsaved draft restored. Your previous work has been recovered.
          </span>
          <button
            type="button"
            onClick={handleDismissDraft}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-4 shrink-0"
          >
            Discard draft
          </button>
        </div>
      )}

      {/* Metadata Section */}
      <div className="card p-6 space-y-6">
        <h3 className="font-semibold text-lg border-b border-border pb-2">
          Pack Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ... Metadata inputs maintained ... */}
          <div className="space-y-2">
            <label htmlFor="pack-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="pack-name"
              name="name"
              required
              aria-label="Name"
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="My Epic Campaign"
            />
          </div>

          <div className="col-span-full space-y-2">
            <label htmlFor="pack-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="pack-description"
              name="description"
              aria-label="Description"
              className="w-full min-h-[100px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="A collection of magical items and backgrounds..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="pack-version" className="text-sm font-medium">
              Version
            </label>
            <input
              id="pack-version"
              name="version"
              aria-label="Version"
              className="w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* Assets Section */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-semibold text-lg">Assets</h3>
          <button
            type="button"
            onClick={() => setShowAddAssetModal(true)}
            className="btn btn-outline btn-sm gap-2"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>

        {/* Sticky Filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b border-border -mx-6 px-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              id="asset-search"
              name="assetSearch"
              placeholder="Search assets..."
              className="flex-1 h-9 rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* Filter Type removed as now we group by type automatically! 
                Or keep it to filter WHICH groups are shown? 
                Let's keep it to filter specifically if user wants to see ONLY spells.
            */}
            <select
              id="asset-type-filter"
              name="assetTypeFilter"
              aria-label="Filter by Type"
              className="h-9 rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Array.from(new Set(assets.map((a) => a.type))).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 min-h-[300px]">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              {assets.length === 0
                ? 'No assets added yet. Click "Add Asset" to start.'
                : "No matching assets found."}
            </div>
          ) : (
            <div className="space-y-4">
              {assetTypes.map((type) => (
                <CollapsibleAssetCategory
                  key={type}
                  type={type}
                  assets={assetsByType[type]}
                  onRemove={(asset) => {
                    // We need to find the index in main assets array
                    const idx = assets.indexOf(asset);
                    if (idx !== -1) removeAsset(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg shadow-lg shadow-primary/20 gap-2 min-w-[200px]"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-5 h-5" /> {submitLabel}
            </>
          )}
        </button>
      </div>

      {showAddAssetModal && (
        <AddAssetModal
          onAdd={handleAddAsset}
          onClose={() => setShowAddAssetModal(false)}
          onOpenPanel={handleOpenPanel}
          packAssets={assets}
          onCreateSubAsset={handleAddSubAsset}
        />
      )}

      {panelState && (
        <AssetFormPanel
          type={panelState.type}
          typeLabel={panelState.typeLabel}
          packAssets={assets}
          onAdd={handleAddAsset}
          onAddSubAsset={handleAddSubAsset}
          onClose={() => setPanelState(null)}
        />
      )}
    </form>
  );
}

function CollapsibleAssetCategory({
  type,
  assets,
  onRemove,
}: {
  type: string;
  assets: PackAsset[];
  onRemove: (asset: PackAsset) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border/60 rounded-lg bg-card/20 overflow-hidden transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary p-2 bg-primary/10 rounded-md">
            {getIconForType(type)}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold capitalize">
              {type.replace(/-/g, " ")}s
            </h3>
            <p className="text-xs text-muted-foreground">
              {assets.length} items
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200 divide-y divide-border/50">
          {assets.map((asset, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="font-medium truncate">
                  {asset.name || asset.data?.name || "Unnamed Asset"}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {asset.data?.index}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${asset.name || asset.data?.name || "Asset"}`}
                onClick={() => onRemove(asset)}
                className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getIconForType(type: string) {
  switch (type) {
    case "magic-item":
    case "equipment":
    case "weapon":
      return <Sword className="w-5 h-5" />;
    case "spell":
      return <Scroll className="w-5 h-5" />;
    case "class":
    case "subclass":
      return <Shield className="w-5 h-5" />;
    default:
      return <Box className="w-5 h-5" />;
  }
}
