import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Shield, Heart, Sword, Crown, Loader2, Edit2, Skull, Clock,
  Users, BookOpen, Star, Zap, Link2, Globe, Award, FileText, Trash2,
  AlertTriangle, X, ScrollText,
} from "lucide-react";
import { fetchCharacter, deleteCharacter, type Character } from "../services/characters.api";
import { calculateProficiencyBonus } from "@questmasters/dnd-rules";
import { fetchCampaign } from "../services/campaigns.api";
import { useAuth } from "../contexts/AuthContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAT_LABELS: Record<string, string> = {
  strength: "FUE", dexterity: "DES", constitution: "CON",
  intelligence: "INT", wisdom: "SAB", charisma: "CAR",
};

const ALIGNMENT_LABELS: Record<string, string> = {
  "lawful-good": "Leal Bueno",      "neutral-good": "Neutral Bueno",
  "chaotic-good": "Caótico Bueno",  "lawful-neutral": "Leal Neutral",
  "true-neutral": "Neutral Verdadero", "chaotic-neutral": "Caótico Neutral",
  "lawful-evil": "Leal Malvado",    "neutral-evil": "Neutral Malvado",
  "chaotic-evil": "Caótico Malvado",
};

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "dead")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold">
        <Skull size={11} /> Muerto
      </span>
    );
  if (status === "retired")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-bold">
        <Clock size={11} /> Retirado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-bold">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
      Activo
    </span>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1 mb-1">
      {icon}
      {children}
    </span>
  );
}

/** Muestra texto con valor o un placeholder inmersivo en itálica */
function FieldText({ value, placeholder }: { value: string | null | undefined; placeholder: string }) {
  if (value) {
    return <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>;
  }
  return <p className="text-sm text-slate-600 italic leading-relaxed">{placeholder}</p>;
}

/** Igual pero para valores en línea (alineamiento, edad, etc.) */
function FieldValue({ value, placeholder }: { value: string | null | undefined; placeholder: string }) {
  if (value) return <span className="text-sm text-slate-200">{value}</span>;
  return <span className="text-sm text-slate-600 italic">{placeholder}</span>;
}

interface ConfirmDeleteModalProps {
  characterName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}
function ConfirmDeleteModal({ characterName, onConfirm, onCancel, deleting }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar"
      />
      <div className="relative bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl shadow-red-900/20 w-full max-w-sm p-6">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-500/10 rounded-xl">
            <AlertTriangle className="text-red-400" size={22} />
          </div>
          <div>
            <h3 className="text-white font-black text-base">Eliminar personaje</h3>
            <p className="text-slate-500 text-xs mt-0.5">Esta acción no se puede deshacer</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          ¿Estás seguro de que quieres eliminar a{" "}
          <span className="font-black text-white">"{characterName}"</span>?
          El personaje dejará de aparecer en tu lista.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors text-sm font-bold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={15} /> Eliminar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const CharacterDetail: React.FC = () => {
  const { charId } = useParams<{ charId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [character,     setCharacter]     = useState<Character | null>(null);
  const [campaignName,  setCampaignName]  = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const isOwner = !!userProfile && !!character && userProfile.id === character.userId;

  useEffect(() => {
    if (!charId) return;
    const load = async () => {
      try {
        const char = await fetchCharacter(charId);
        setCharacter(char);

        if (char.campaignId) {
          try {
            const camp = await fetchCampaign(char.campaignId);
            setCampaignName(camp.name);
          } catch { /* campaña no accesible */ }
        }
      } catch (err: any) {
        setError(err.message || "Personaje no encontrado");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [charId]);

  const handleDelete = async () => {
    if (!charId) return;
    setDeleting(true);
    try {
      await deleteCharacter(charId);
      navigate("/characters");
    } catch (err: any) {
      setError(err.message || "Error al eliminar personaje");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Cargando personaje...</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl text-white mb-4">Personaje no encontrado</h1>
        <Link to="/characters" className="text-indigo-400 hover:text-indigo-300">
          Volver a Mis Personajes
        </Link>
      </div>
    );
  }

  const ch = character.choices ?? {};
  const statKeys = Object.keys(STAT_LABELS) as (keyof typeof character.stats)[];

  const displayRace       = character.raceName       ?? (ch.libreRace as string);
  const displayClass      = character.className      ?? (ch.libreClass as string);
  const displayBackground = character.backgroundName ?? (ch.libreBackground as string) ?? (ch.customBackgroundName as string);
  const libreSubrace      = ch.libreSubrace  as string | undefined;

  const bgFeature     = ch.bgFeature     as string | undefined;
  const bgPersonality = ch.bgPersonality as string | undefined;
  const bgIdeals      = ch.bgIdeals      as string | undefined;
  const bgBonds       = ch.bgBonds       as string | undefined;
  const bgFlaws       = ch.bgFlaws       as string | undefined;

  const alignment  = ch.alignment  as string | undefined;
  const appearance = ch.appearance as string | undefined;
  const age        = ch.age        as number | undefined;
  const languages  = ch.languages  as string | undefined;
  const notes      = ch.notes      as string | undefined;
  const xp         = ch.xp        as number | undefined;

  const systemBadgeColor: Record<string, string> = {
    "dnd-3.5":     "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "dnd-5e-2014": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "dnd-5e-2024": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };

  return (
    <>
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Link
        to="/characters"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Mis Personajes
      </Link>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl shadow-indigo-900/5 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 p-6 md:p-8">
          <div className={`w-32 h-32 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-4 shrink-0 ${
            character.status === "dead"    ? "border-red-500/40 grayscale" :
            character.status === "retired" ? "border-amber-500/40 sepia"   :
                                             "border-indigo-500/30"
          }`}>
            {character.portraitUrl ? (
              <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                <Shield className="text-slate-600" size={40} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-white leading-tight truncate">{character.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {displayRace && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {displayRace}{libreSubrace ? ` · ${libreSubrace}` : ""}
                    </span>
                  )}
                  {displayClass && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {displayClass}
                    </span>
                  )}
                  {displayBackground && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {displayBackground}
                    </span>
                  )}
                  {ch.system && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${
                      systemBadgeColor[ch.system as string] ?? "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {ch.system as string}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={character.status} />
                {isOwner && (
                  <>
                    <Link
                      to={`/characters/${charId}/edit`}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl transition-colors text-sm font-semibold"
                    >
                      <Edit2 size={14} /> Editar
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="inline-flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-xl transition-colors text-sm font-semibold border border-red-500/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-5 mt-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Sword size={15} className="text-indigo-400" />
                <span className="text-sm">Nivel <span className="font-black text-white">{character.level}</span></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Heart size={15} className="text-red-400" />
                <span className="text-sm"><span className="font-black text-white">{character.hitPoints}</span> PG máx.</span>
              </div>
              {xp !== undefined && (
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs font-bold text-amber-400">✦</span>
                  <span className="text-sm"><span className="font-black text-white">{xp.toLocaleString()}</span> XP</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-black text-violet-400">PB</span>
                <span className="text-sm">+<span className="font-black text-white">{calculateProficiencyBonus(character.level)}</span> competencia</span>
              </div>
              {campaignName ? (
                <Link to={`/campaigns/${character.campaignId}`} className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors">
                  <Crown size={13} className="text-amber-400" />
                  <span className="text-sm truncate">{campaignName}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Users size={13} />
                  <span className="text-sm italic">Sin campaña</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Atributos ────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm mb-6">
        <SectionTitle>Atributos</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {statKeys.map((key) => {
            const score = character.stats[key] as number;
            const mod   = modifier(score);
            return (
              <div key={key} className="flex flex-col items-center bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{STAT_LABELS[key]}</span>
                <span className="text-2xl font-black text-white">{score}</span>
                <span className={`text-sm font-bold ${parseInt(mod) >= 0 ? "text-indigo-400" : "text-red-400"}`}>{mod}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Historia ─────────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm mb-6">
        <SectionTitle icon={<BookOpen size={14} />}>Historia</SectionTitle>
        <FieldText
          value={character.backstory}
          placeholder="Las páginas que narran el origen de este héroe aún están en blanco. Quizás fue así como el destino lo quiso."
        />
      </div>

      {/* ─── Trasfondo narrativo ──────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm mb-6">
        <SectionTitle icon={<ScrollText size={14} />}>Trasfondo</SectionTitle>
        <div className="space-y-5">
          <div>
            <FieldLabel icon={<Star size={11} />}>Rasgo</FieldLabel>
            <FieldText
              value={bgFeature}
              placeholder="Los dones que otorga su trasfondo permanecen envueltos en bruma. O quizás aún no los ha descubierto."
            />
          </div>
          <div>
            <FieldLabel icon={<Heart size={11} />}>Rasgos de personalidad</FieldLabel>
            <FieldText
              value={bgPersonality}
              placeholder="Su alma es un libro cerrado. Quienes lo conocen aún intentan descifrar sus páginas."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel icon={<Zap size={11} />}>Ideales</FieldLabel>
              <FieldText
                value={bgIdeals}
                placeholder="Solo el destino —y él— conoce los principios que guían cada uno de sus pasos."
              />
            </div>
            <div>
              <FieldLabel icon={<Link2 size={11} />}>Vínculos</FieldLabel>
              <FieldText
                value={bgBonds}
                placeholder="Los lazos que lo atan al mundo permanecen ocultos, como hilos invisibles en la oscuridad."
              />
            </div>
          </div>
          <div>
            <FieldLabel icon={<Skull size={11} />}>Defectos</FieldLabel>
            <FieldText
              value={bgFlaws}
              placeholder="Sus debilidades, si las tiene, son un secreto que guarda con más celo que cualquier tesoro."
            />
          </div>
        </div>
      </div>

      {/* ─── Información adicional ────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm mb-6">
        <SectionTitle icon={<FileText size={14} />}>Información adicional</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          <div>
            <FieldLabel icon={<Award size={11} />}>Alineamiento</FieldLabel>
            <FieldValue
              value={alignment ? (ALIGNMENT_LABELS[alignment] ?? alignment) : null}
              placeholder="Las estrellas aún no se han pronunciado."
            />
          </div>
          <div>
            <FieldLabel>Edad</FieldLabel>
            <FieldValue
              value={age !== undefined ? `${age} años` : null}
              placeholder="El tiempo lo trató de forma inusual."
            />
          </div>
          <div>
            <FieldLabel icon={<Globe size={11} />}>Idiomas</FieldLabel>
            <FieldValue
              value={languages ?? null}
              placeholder="Se comunica de formas que pocos comprenden."
            />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <FieldLabel>Apariencia</FieldLabel>
            <FieldText
              value={appearance}
              placeholder="Su apariencia varía según quien lo recuerde. Algunos lo describen imponente; otros, apenas perceptible."
            />
          </div>
          <div>
            <FieldLabel>Notas</FieldLabel>
            <FieldText
              value={notes}
              placeholder="El pergamino del cronista aguarda ser escrito. Nada digno de mención… por ahora."
            />
          </div>
        </div>
      </div>
    </div>

    {showDeleteModal && (
      <ConfirmDeleteModal
        characterName={character.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        deleting={deleting}
      />
    )}
    </>
  );
};
