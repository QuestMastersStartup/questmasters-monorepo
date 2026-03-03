import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPack } from "../services/api";
import { ArrowLeft } from "lucide-react";
import {
  PackForm,
  type PackFormData,
  type PackAsset,
} from "../components/features/packs/PackForm";

export function CreatePack() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PackFormData, assets: PackAsset[]) => {
    setLoading(true);

    // Auto-generate slug and dummy creatorId
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const creatorId = "123e4567-e89b-12d3-a456-426614174000"; // Placeholder UUID

    try {
      await createPack({ ...data, slug, creatorId, assets });
      navigate("/library");
    } catch (err: unknown) {
      console.error("Failed to create pack", err);
      alert(`Error: ${err instanceof Error ? err.message : String(err)}`); // Simple feedback
    } finally {
      setLoading(false);
    }
  };

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
            Create New Pack
          </h2>
          <p className="text-muted-foreground mt-1">
            Define your homebrew content pack.
          </p>
        </div>
      </div>

      <PackForm onSubmit={handleSubmit} isLoading={loading} draftKey="create-pack" />
    </div>
  );
}
