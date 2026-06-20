import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Loader2, UserRound, Plus, Trash2, Info } from "lucide-react";
import {
  createSession,
  setPendingInitialStream,
  type ArchitectureType,
  type CharacterSnapshot,
} from "../../../lib/dmSessionApi";
import { fetchMyCharacters, type MyCharacter } from "../../../services/characters.api";

interface SessionInitModalProps {
  onClose: () => void;
}

const inputClass =
  "w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors";

function charToSnapshot(char: MyCharacter): CharacterSnapshot {
  const choices = (char.choices ?? {}) as Record<string, unknown>;
  return {
    name: char.name,
    race: char.raceName ?? (choices.libreRace as string) ?? "",
    class: char.className ?? (choices.libreClass as string) ?? "",
    background: char.backgroundName ?? (choices.libreBackground as string) ?? "",
    level: char.level,
    backstory: char.backstory ?? "",
    alignment: (choices.alignment as string) ?? "",
    personalityTraits: (choices.personalityTraits as string) ?? "",
  };
}

export const SessionInitModal: React.FC<SessionInitModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [architectureType, setArchitectureType] = useState<ArchitectureType>("monolithic");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allChars, setAllChars] = useState<MyCharacter[]>([]);
  const [loadingChars, setLoadingChars] = useState(true);
  const [selected, setSelected] = useState<MyCharacter | null>(null);

  useEffect(() => {
    fetchMyCharacters()
      .then(setAllChars)
      .catch(() => setAllChars([]))
      .finally(() => setLoadingChars(false));
  }, []);

  const is5e = (c: MyCharacter) => {
    const sys = (c.choices as Record<string, unknown> | null)?.system as string | undefined;
    return sys === "dnd-5e-2014" || sys === "dnd-5e-2024";
  };

  const compatibleChars = allChars.filter(is5e);
  const incompatibleCount = allChars.length - compatibleChars.length;
  const availableChars = compatibleChars.filter((c) => c.id !== selected?.id);

  const addChar = (char: MyCharacter) => {
    setSelected(char);
  };

  const removeChar = () => {
    setSelected(null);
  };

  const canSubmit =
    title.trim() !== "" &&
    campaignPrompt.trim() !== "" &&
    selected !== null &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selected) return;

    setSubmitting(true);
    setError(null);

    try {
      const characters: CharacterSnapshot[] = [charToSnapshot(selected)];

      const { session, stream } = await createSession({
        title: title.trim(),
        campaignPrompt: campaignPrompt.trim(),
        characters,
        architectureType,
      });

      setPendingInitialStream(session.id, stream);
      navigate(`/dm-sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la sesión");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-400" />
            Nueva Sesión de DM IA
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            title="Cerrar"
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Título de la sesión
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="La Cripta del Rey Olvidado"
              maxLength={150}
              className={inputClass}
            />
          </div>

          {/* Prompt de campaña */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Prompt de campaña
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Temática, mundo, objetivos y tono de la aventura.
            </p>
            <textarea
              value={campaignPrompt}
              onChange={(e) => setCampaignPrompt(e.target.value)}
              placeholder="Una campaña de fantasía oscura ambientada en un reino asolado por una plaga arcana..."
              rows={6}
              maxLength={20000}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Picker de personaje */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              Personaje jugador
            </label>

            {/* Personaje seleccionado */}
            {selected && (
              <div className="flex items-center justify-between gap-2 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {selected.portraitUrl ? (
                      <img
                        src={selected.portraitUrl}
                        alt={selected.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserRound size={14} className="text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selected.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {[selected.raceName, selected.className, `Nv. ${selected.level}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeChar()}
                  title="Quitar personaje"
                  className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Lista de personajes disponibles */}
            {!selected && (
              <>
                {loadingChars ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                    <Loader2 size={14} className="animate-spin" /> Cargando personajes...
                  </div>
                ) : compatibleChars.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 text-center">
                    <UserRound size={28} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      {allChars.length === 0
                        ? "No tienes personajes creados todavía."
                        : "No tienes personajes compatibles con D&D 5e."}
                    </p>
                    <a
                      href="/characters/create"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
                      onClick={onClose}
                    >
                      <Plus size={12} /> Crear un personaje de 5e
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableChars.map((char) => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => addChar(char)}
                        className="flex items-center gap-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-indigo-500/40 rounded-xl p-3 text-left transition-all group"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0 overflow-hidden flex items-center justify-center">
                          {char.portraitUrl ? (
                            <img
                              src={char.portraitUrl}
                              alt={char.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserRound size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                            {char.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {[char.raceName, char.className].filter(Boolean).join(" · ") || "Sin clase/raza"}
                          </p>
                        </div>
                        <Plus size={14} className="text-slate-500 group-hover:text-indigo-400 shrink-0 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {incompatibleCount > 0 && compatibleChars.length > 0 && (
                  <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                    <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/80">
                      {incompatibleCount} personaje{incompatibleCount !== 1 ? "s" : ""} oculto{incompatibleCount !== 1 ? "s" : ""} por no ser de D&D 5e. El DM IA solo soporta personajes de 5e por ahora.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Arquitectura */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tipo de arquitectura
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "monolithic" as const, label: "Monolítico", detail: "Modelo único con memoria integrada", disabled: false },
                  { value: "mas" as const, label: "MAS", detail: "Orquestación multi-agente (WIP)", disabled: true },
                ]
              ).map((option) => (
                <label
                  key={option.value}
                  className={`rounded-xl border p-4 transition-colors ${
                    option.disabled
                      ? "opacity-40 cursor-not-allowed border-slate-700 bg-slate-800/40"
                      : architectureType === option.value
                        ? "cursor-pointer border-indigo-500 bg-indigo-500/10"
                        : "cursor-pointer border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="architectureType"
                    value={option.value}
                    checked={architectureType === option.value}
                    onChange={() => setArchitectureType(option.value)}
                    disabled={option.disabled}
                    className="sr-only"
                  />
                  <span className="block text-white font-bold">{option.label}</span>
                  <span className="block text-xs text-slate-400 mt-1">{option.detail}</span>
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            {selected
              ? `${selected.name} seleccionado`
              : "Selecciona un personaje"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando sesión...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Comenzar Sesión
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
