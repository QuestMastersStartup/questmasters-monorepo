import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPack, updatePack, type PackWithAssets } from "../services/api";
import {
  PackForm,
  type PackFormData,
  type PackAsset,
} from "../components/features/packs/PackForm";
import { ArrowLeft } from "lucide-react";

export function EditPack() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pack, setPack] = useState<PackWithAssets | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPack(slug)
        .then(setPack)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  const handleSubmit = async (data: PackFormData) => {
    if (!slug) return;
    setSaving(true);

    try {
      await updatePack(slug, {
        name: data.name,
        description: data.description,
        version: data.version,
      });
      navigate(`/library/${slug}`);
    } catch (err: unknown) {
      console.error("Failed to update pack", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="text-center py-20 text-destructive">
        Error: {error || "Pack not found"}
      </div>
    );
  }

  const initialValues: PackFormData = {
    name: pack.name,
    description: pack.description,
    version: pack.version,
    type: pack.type,
  };

  const initialAssets: PackAsset[] = pack.assets.map((asset) => ({
    type: asset.type,
    data: asset.data,
    name: asset.name || (asset.data as unknown as Record<string, unknown>)?.name as string,
  }));

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="btn btn-ghost p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-3xl font-cinzel font-bold gold-gradient">
            Edit Pack
          </h2>
          <p className="text-muted-foreground mt-1">
            Update your content pack.
          </p>
        </div>
      </div>

      <PackForm
        initialValues={initialValues}
        initialAssets={initialAssets}
        onSubmit={handleSubmit}
        isLoading={saving}
        submitLabel="Update Pack"
        draftKey={`edit-pack:${slug}`}
      />
    </div>
  );
}
