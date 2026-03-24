import { useEffect, useState } from "react";
import { fetchPacks, type Pack } from "../services/api";
import { PackCard } from "../components/features/packs/PackCard";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { GuestBanner } from "../components/layout/GuestBanner";
import { AuthActionGuard } from "../components/layout/AuthActionGuard";

export function Library() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const { isGuest } = useAuth();

  useEffect(() => {
    fetchPacks()
      .then(setPacks)
      .catch((err) => console.error("Failed to load packs:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <GuestBanner />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-cinzel font-bold gold-gradient">
            {isGuest ? "Explore Packs" : "Your Library"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isGuest 
              ? "Discover content from the QuestMasters community." 
              : "Manage your collection of content packs."}
          </p>
        </div>
        
        <AuthActionGuard fallbackMessage="Registrate para crear tus propios packs">
          <Link
            to="/library/create"
            className="btn btn-primary btn-lg shadow-lg shadow-primary/20 gap-2 font-cinzel font-bold"
          >
            <Plus className="w-5 h-5" />
            Create New Pack
          </Link>
        </AuthActionGuard>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card h-64 bg-card/50 animate-pulse border-border/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.length > 0 ? (
            packs.map((pack) => <PackCard key={pack.id} pack={pack} />)
          ) : (
            <div className="col-span-full card p-12 border-dashed border-2 flex flex-col items-center justify-center text-center text-muted-foreground min-h-[300px]">
              <p>No packs found in your library.</p>
              <p className="text-sm">
                Visit the Marketplace to discover content.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
