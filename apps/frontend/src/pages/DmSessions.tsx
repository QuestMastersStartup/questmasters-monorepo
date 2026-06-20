import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Sparkles, MessageSquare, Calendar, Trash2 } from "lucide-react";
import { getSessions, deleteSession, type DmSessionSummary } from "../lib/dmSessionApi";
import { SessionInitModal } from "../components/features/dm-session/SessionInitModal";

// ─── Badges ───────────────────────────────────────────────────────────

export function ArchitectureBadge({ type }: { type: DmSessionSummary["architectureType"] }) {
  return type === "mas" ? (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
      MAS
    </span>
  ) : (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 uppercase tracking-wide">
      Monolítico
    </span>
  );
}

const STATUS_STYLES: Record<DmSessionSummary["status"], { label: string; className: string }> = {
  initializing: {
    label: "Inicializando",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  active: {
    label: "Activa",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  paused: {
    label: "Pausada",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  },
  ended: {
    label: "Terminada",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export function StatusBadge({ status }: { status: DmSessionSummary["status"] }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide ${style.className}`}
    >
      {style.label}
    </span>
  );
}

// ─── Card de sesión ───────────────────────────────────────────────────

function SessionCard({
  session,
  onDelete,
}: {
  session: DmSessionSummary;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="relative group rounded-2xl border border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 hover:border-purple-500/30 transition-all duration-300">
      <Link to={`/dm-sessions/${session.id}`} className="block p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-white font-black text-lg leading-tight truncate">
            {session.title}
          </h3>
          <Sparkles size={18} className="text-purple-400 shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <ArchitectureBadge type={session.architectureType} />
          <StatusBadge status={session.status} />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MessageSquare size={12} className="text-indigo-400" />
            <span className="font-bold">{session.turnCount}</span> turnos
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} className="text-slate-500" />
            {new Date(session.createdAt).toLocaleDateString("es", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-800/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
        title="Eliminar sesión"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────

export const DmSessions: React.FC = () => {
  const [sessions, setSessions] = useState<DmSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    const session = sessions.find((s) => s.id === id);
    if (!confirm(`¿Eliminar la sesión "${session?.title ?? id}"?`)) return;
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">Cargando sesiones...</div>
    );
  }

  return (
    <>
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-400" size={28} />
              Sesiones de DM IA
            </h1>
            <p className="text-slate-400">
              Juega aventuras dirigidas por un Dungeon Master de IA.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-purple-500/20 font-semibold text-sm shrink-0"
          >
            <Plus size={16} />
            Nueva Sesión
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Estado vacío */}
        {sessions.length === 0 && !error && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Sparkles className="text-purple-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aún no tienes sesiones
            </h3>
            <p className="text-slate-400 mb-6">
              Describe tu campaña y tus personajes — el DM de IA narra la aventura.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-purple-500/20 font-medium"
            >
              <Plus size={18} />
              Nueva Sesión
            </button>
          </div>
        )}

        {/* Grid de sesiones */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && <SessionInitModal onClose={() => setModalOpen(false)} />}
    </>
  );
};
