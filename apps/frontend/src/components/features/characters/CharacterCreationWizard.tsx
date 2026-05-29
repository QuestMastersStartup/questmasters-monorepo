import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sword,
  BookOpen,
  Wand2,
  Package,
  Check,
  Loader2,
} from "lucide-react";
import { authFetch } from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type DndSystem = "dnd-3.5" | "dnd-5e-2014" | "dnd-5e-2024";
type CreationMode = "vanilla" | "personalizado" | "libre";

interface Pack {
  id: string;
  name: string;
  slug: string;
  systemType: string;
  description?: string;
}

interface Props {
  /** If set, character will be linked to this campaign */
  campaignId?: string;
  onClose: () => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const SYSTEMS: {
  id: DndSystem;
  label: string;
  badge: string;
  description: string;
}[] = [
  {
    id: "dnd-3.5",
    label: "D&D 3.5e",
    badge: "Clásico",
    description:
      "El sistema de referencia del documento (SRD 3.5). Más opciones de clases y razas.",
  },
  {
    id: "dnd-5e-2014",
    label: "D&D 5e · 2014",
    badge: "Más jugado",
    description:
      "El estándar actual. Reglas simplificadas, amplia comunidad y contenido.",
  },
  {
    id: "dnd-5e-2024",
    label: "D&D 5e · 2024",
    badge: "Nuevo",
    description:
      "La edición revisada. Nuevas reglas de fondo, orígenes y clases actualizadas.",
  },
];

const MODES: {
  id: CreationMode;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: "vanilla",
    icon: <BookOpen size={22} />,
    label: "Vanilla",
    description:
      "Solo el contenido oficial SRD del sistema elegido. Ideal para empezar o jugar una campaña estándar.",
    color:
      "text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
  },
  {
    id: "personalizado",
    icon: <Package size={22} />,
    label: "Personalizado",
    description:
      "Elige qué packs de contenido incluir. Razas, clases y opciones de los packs seleccionados.",
    color:
      "text-indigo-400 border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
  },
  {
    id: "libre",
    icon: <Wand2 size={22} />,
    label: "Libre",
    description:
      "Sin restricciones. Escribe directamente el nombre de raza, clase y atributos. Para sistemas no estándar o personajes muy personalizados.",
    color:
      "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const CharacterCreationWizard: React.FC<Props> = ({
  campaignId,
  onClose,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [system, setSystem] = useState<DndSystem | null>(null);
  const [, setMode] = useState<CreationMode | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPackIds, setSelectedPackIds] = useState<Set<string>>(
    new Set(),
  );
  const [loadingPacks, setLoadingPacks] = useState(false);

  // Fetch packs when entering step 3 (personalizado)
  useEffect(() => {
    if (step !== 3 || !system) return;
    setLoadingPacks(true);

    authFetch(`/api/packs?system=${system}&status=published`)
      .then((r) => r.json())
      .then((data: { items?: Pack[]; data?: Pack[] } | Pack[]) => {
        const list: Pack[] = Array.isArray(data)
          ? data
          : ((data as any).items ?? (data as any).data ?? []);
        setPacks(list);
      })
      .catch(() => setPacks([]))
      .finally(() => setLoadingPacks(false));
  }, [step, system]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSystemSelect = (s: DndSystem) => {
    setSystem(s);
    setStep(2);
  };

  const handleModeSelect = (m: CreationMode) => {
    setMode(m);
    if (m === "personalizado") {
      setStep(3);
    } else {
      startCreation(m, []);
    }
  };

  const togglePack = (id: string) => {
    setSelectedPackIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const startCreation = (m: CreationMode, packIds: string[]) => {
    const params = new URLSearchParams();
    if (system) params.set("system", system);
    params.set("mode", m);
    if (packIds.length > 0) params.set("packIds", packIds.join(","));

    const base = campaignId
      ? `/campaigns/${campaignId}/characters/create`
      : "/characters/create";

    navigate(`${base}?${params.toString()}`);
    onClose();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl shadow-indigo-900/20 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <Sword className="text-indigo-400" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-none">
                {step === 1 && "Sistema de Juego"}
                {step === 2 && "Modo de Creación"}
                {step === 3 && "Packs de Contenido"}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {step === 1 && "¿Con qué edición juegas?"}
                {step === 2 && `${system} · ¿cómo quieres crear tu personaje?`}
                {step === 3 && "Elige qué contenido incluir"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full flex-1 transition-all ${
                s <= step ? "bg-indigo-500" : "bg-slate-800"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          {/* Step 1: System */}
          {step === 1 &&
            SYSTEMS.map((sys) => (
              <button
                key={sys.id}
                onClick={() => handleSystemSelect(sys.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/70 hover:border-indigo-500/40 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-black truncate">
                      {sys.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 shrink-0">
                      {sys.badge}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {sys.description}
                  </p>
                </div>
                <ChevronRight
                  className="text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors"
                  size={18}
                />
              </button>
            ))}

          {/* Step 2: Mode */}
          {step === 2 &&
            MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeSelect(m.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group ${m.color}`}
              >
                <div className="mt-0.5 shrink-0">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white mb-1 truncate">
                    {m.label}
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">
                    {m.description}
                  </p>
                </div>
                <ChevronRight
                  className="mt-1 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                  size={18}
                />
              </button>
            ))}

          {/* Step 3: Pack selection */}
          {step === 3 && (
            <>
              {loadingPacks ? (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm">Cargando packs...</span>
                </div>
              ) : packs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="mx-auto mb-3 opacity-40" size={32} />
                  <p className="text-sm">
                    No hay packs disponibles para este sistema.
                  </p>
                  <p className="text-xs mt-1 opacity-70">
                    Puedes continuar sin seleccionar ninguno.
                  </p>
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
                  {packs.map((pack) => {
                    const selected = selectedPackIds.has(pack.id);
                    return (
                      <button
                        key={pack.id}
                        onClick={() => togglePack(pack.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${
                          selected
                            ? "border-indigo-500/60 bg-indigo-500/10"
                            : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                            selected
                              ? "bg-indigo-500 border-indigo-500"
                              : "border-slate-600"
                          }`}
                        >
                          {selected && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">
                            {pack.name}
                          </p>
                          {pack.description && (
                            <p className="text-slate-500 text-xs truncate">
                              {pack.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors text-sm font-bold"
                >
                  <ChevronLeft size={16} />
                  Volver
                </button>
                <button
                  onClick={() =>
                    startCreation("personalizado", [...selectedPackIds])
                  }
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-colors"
                >
                  Crear con{" "}
                  {selectedPackIds.size > 0
                    ? `${selectedPackIds.size} pack${selectedPackIds.size > 1 ? "s" : ""}`
                    : "sin packs adicionales"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back button for step 2 */}
        {step === 2 && (
          <div className="px-6 pb-5">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              <ChevronLeft size={16} />
              Cambiar sistema
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
