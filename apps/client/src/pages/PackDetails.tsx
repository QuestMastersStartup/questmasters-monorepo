import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchPack,
  fetchAssetsByType,
  deletePack,
  type PackWithAssets,
  type Asset,
} from "../services/api";
import {
  ArrowLeft,
  Box,
  Shield,
  Sword,
  Scroll,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react";

interface AssetTypeSummary {
  type: string;
  count: number;
}

export function PackDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [pack, setPack] = useState<PackWithAssets | null>(null);
  const [assetSummary, setAssetSummary] = useState<AssetTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!slug) return;
    setDeleting(true);
    try {
      await deletePack(slug);
      navigate("/library");
    } catch (err: any) {
      setError(err.message);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPack(slug)
        .then((data) => {
          setPack(data);
          // Build summary from initial load (types + counts only)
          const typeCounts: Record<string, number> = {};
          for (const asset of data.assets) {
            typeCounts[asset.type] = (typeCounts[asset.type] || 0) + 1;
          }
          setAssetSummary(
            Object.entries(typeCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([type, count]) => ({ type, count })),
          );
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 w-1/3 bg-card/50 rounded" />
        <div className="h-64 bg-card/50 rounded" />
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          Error Loading Pack
        </h2>
        <p className="text-muted-foreground">{error || "Pack not found"}</p>
        <Link to="/library" className="btn btn-outline gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/library"
            className="btn btn-ghost p-0 hover:bg-transparent text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
          <div className="flex items-center gap-2">
            <Link to={`/library/${slug}/edit`} className="btn btn-outline gap-2">
              Edit Pack
            </Link>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="btn btn-outline gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-8 border border-border">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-64 h-64 rotate-12" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="badge bg-background/80 backdrop-blur border-primary/30 text-primary uppercase tracking-wider">
                    {pack.system === "universal"
                      ? "System Agnostic"
                      : pack.system}
                  </span>
                  <span className="badge bg-secondary/50 text-secondary-foreground border-secondary">
                    v{pack.version}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-cinzel font-bold gold-gradient mb-2">
                  {pack.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <User className="w-4 h-4" />
                  <span>Created by Author</span>
                </div>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {pack.description}
            </p>
          </div>
        </div>
      </div>

      {/* Assets Content */}
      <div className="space-y-4">
        <h2 className="text-2xl font-cinzel font-bold border-b border-border pb-4 mb-6">
          Pack Contents
        </h2>

        {assetSummary.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-lg border border-border/50 border-dashed">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>This pack contains no assets.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assetSummary.map(({ type, count }) => (
              <LazyCollapsibleCategory
                key={type}
                slug={slug!}
                type={type}
                count={count}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 space-y-4 animate-fade-in shadow-2xl">
            <h3 className="text-xl font-cinzel font-bold text-destructive">
              Delete Pack
            </h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{pack.name}</strong>? This action cannot be undone and all associated assets will be removed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Pack
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LazyCollapsibleCategory({
  slug,
  type,
  count,
}: {
  slug: string;
  type: string;
  count: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    // Lazy load assets on first open
    if (next && assets === null && !loading) {
      setLoading(true);
      fetchAssetsByType(slug, type)
        .then(setAssets)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="border border-border/60 rounded-lg bg-card/20 overflow-hidden transition-all duration-200">
      <button
        onClick={handleToggle}
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
            <p className="text-xs text-muted-foreground">{count} items</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading assets...</span>
            </div>
          )}
          {error && (
            <div className="p-4 text-sm text-destructive">
              Failed to load assets: {error}
            </div>
          )}
          {assets && (
            <div className="p-4 grid grid-cols-1 gap-3">
              {assets.map((asset) => {
                const data = (asset.data || {}) as Record<string, unknown>;
                const description = data.description as string | undefined;
                const desc = data.desc as string[] | undefined;
                return (
                  <div
                    key={asset.id}
                    className="group flex flex-col md:flex-row gap-4 p-4 rounded-md bg-background/50 border border-border/40 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {asset.name || asset.index}
                        </h4>
                        <span className="text-xs font-mono text-muted-foreground/50 border border-border px-1.5 rounded">
                          {asset.index}
                        </span>
                      </div>

                      {description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      )}
                      {!description && desc && Array.isArray(desc) && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {desc.join(" ")}
                        </p>
                      )}
                      {!description && (!desc || !Array.isArray(desc)) && (
                        <p className="text-xs italic text-muted-foreground/40">
                          No description available.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
