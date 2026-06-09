import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Heart, Sword, Crown, Skull, Users, Plus } from "lucide-react";
import { CharacterCreationWizard } from "../components/features/characters/CharacterCreationWizard";
import { fetchMyCharacters, type MyCharacter } from "../services/characters.api";

// ─── Mini card para la vista "Mis Personajes" ────────────────────────────────

interface MyCharacterCardProps {
  character: MyCharacter;
}

function MyCharacterCard({ character }: MyCharacterCardProps) {
  const isDead = character.status === "dead";
  const isRetired = character.status === "retired";
  const isInactive = isDead || isRetired;

  return (
    <Link
      to={`/characters/${character.id}`}
      className={`relative group rounded-2xl border overflow-hidden transition-all duration-300 block ${
        isDead
          ? "border-red-500/30 bg-slate-900/60"
          : isRetired
          ? "border-amber-500/30 bg-slate-900/60"
          : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 hover:border-indigo-500/30"
      }`}
    >
      {/* Overlay inactive */}
      {isInactive && (
        <div
          className={`absolute inset-0 z-10 pointer-events-none ${
            isDead ? "bg-red-950/30" : "bg-amber-950/20"
          }`}
        />
      )}

      <div className="flex p-4 gap-4">
        {/* Portrait */}
        <div
          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 ${
            isDead
              ? "border-red-500/40 grayscale"
              : isRetired
              ? "border-amber-500/40 sepia"
              : "border-slate-700"
          }`}
        >
          {character.portraitUrl ? (
            <img
              src={character.portraitUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <Shield className="text-slate-600" size={24} />
            </div>
          )}

          {isInactive && (
            <div
              className={`absolute -bottom-0.5 inset-x-0 text-center py-0.5 text-[8px] font-black uppercase tracking-widest ${
                isDead ? "bg-red-600 text-white" : "bg-amber-600 text-white"
              }`}
            >
              {isDead ? "Muerto" : "Retirado"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black text-lg truncate leading-tight">
            {character.name}
          </h4>

          {/* Race & class badges */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {character.raceName && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {character.raceName}
              </span>
            )}
            {character.className && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {character.className}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Sword size={12} className="text-indigo-400" />
              <span className="font-bold">Nv. {character.level}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Heart size={12} className="text-red-400" />
              <span className="font-bold">{character.hitPoints} HP</span>
            </div>
          </div>

          {/* Campaña */}
          {character.campaignName ? (
            <Link
              to={`/campaigns/${character.campaignId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 mt-2 text-[11px] text-slate-500 hover:text-indigo-400 transition-colors truncate"
            >
              <Crown size={10} className="shrink-0" />
              <span className="truncate">{character.campaignName}</span>
            </Link>
          ) : (
            <p className="flex items-center gap-1 mt-2 text-[11px] text-slate-600 italic">
              <Users size={10} className="shrink-0" />
              Sin campaña
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<MyCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    fetchMyCharacters()
      .then(setCharacters)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Cargando tus personajes...
      </div>
    );
  }

  const active = characters.filter((c) => c.status === "active");
  const inactive = characters.filter((c) => c.status !== "active");

  return (
    <>
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Personajes</h1>
          <p className="text-slate-400">
            Todos tus héroes, sin importar la campaña.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 font-semibold text-sm shrink-0"
        >
          <Plus size={16} />
          Crear Personaje
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
          Error: {error}
        </div>
      )}

      {/* Estado vacío */}
      {characters.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <Shield className="text-slate-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Aún no tienes personajes
          </h3>
          <p className="text-slate-400 mb-6">
            Crea tu primer héroe — puedes unirlo a una campaña después.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 font-medium"
            >
              <Plus size={18} />
              Crear Personaje
            </button>
            <Link
              to="/campaigns"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-5 py-2.5 rounded-lg transition-colors font-medium"
            >
              <Crown size={18} />
              Ver Campañas
            </Link>
          </div>
        </div>
      )}

      {/* Personajes activos */}
      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Activos ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map((c) => (
              <MyCharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}

      {/* Historial: muertos y retirados */}
      {inactive.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Skull size={14} className="text-slate-500" />
            Historial ({inactive.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-70">
            {inactive.map((c) => (
              <MyCharacterCard key={c.id} character={c} />
            ))}
          </div>
        </section>
      )}
    </div>

    {wizardOpen && (
      <CharacterCreationWizard onClose={() => setWizardOpen(false)} />
    )}
    </>
  );
};
