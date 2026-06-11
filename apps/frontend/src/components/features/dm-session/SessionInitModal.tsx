import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import {
  createSession,
  setPendingInitialStream,
  type ArchitectureType,
  type CharacterSnapshot,
} from "../../../lib/dmSessionApi";

interface SessionInitModalProps {
  onClose: () => void;
}

const EMPTY_CHARACTER: CharacterSnapshot = {
  name: "",
  race: "",
  class: "",
  background: "",
  description: "",
};

const inputClass =
  "w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors";

export const SessionInitModal: React.FC<SessionInitModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [characters, setCharacters] = useState<CharacterSnapshot[]>([
    { ...EMPTY_CHARACTER },
  ]);
  const [architectureType, setArchitectureType] = useState<ArchitectureType>("mas");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCharacter = (
    index: number,
    field: keyof CharacterSnapshot,
    value: string,
  ) => {
    setCharacters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const addCharacter = () =>
    setCharacters((prev) => [...prev, { ...EMPTY_CHARACTER }]);

  const removeCharacter = (index: number) =>
    setCharacters((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );

  const canSubmit =
    title.trim() !== "" &&
    campaignPrompt.trim() !== "" &&
    characters.every((c) => c.name.trim() !== "" && c.description.trim() !== "") &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const { session, stream } = await createSession({
        title: title.trim(),
        campaignPrompt: campaignPrompt.trim(),
        characters,
        architectureType,
      });

      // La página de la sesión recoge este stream y muestra el primer turno en vivo
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

          {/* Personajes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-300">
                Personajes jugadores
              </label>
              <button
                type="button"
                onClick={addCharacter}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={14} />
                Agregar personaje
              </button>
            </div>

            <div className="space-y-4">
              {characters.map((character, index) => (
                <div
                  key={index}
                  className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Personaje {index + 1}
                    </span>
                    {characters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCharacter(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Eliminar personaje"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={character.name}
                      onChange={(e) => updateCharacter(index, "name", e.target.value)}
                      placeholder="Nombre *"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={character.race}
                      onChange={(e) => updateCharacter(index, "race", e.target.value)}
                      placeholder="Raza"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={character.class}
                      onChange={(e) => updateCharacter(index, "class", e.target.value)}
                      placeholder="Clase"
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={character.background}
                      onChange={(e) =>
                        updateCharacter(index, "background", e.target.value)
                      }
                      placeholder="Trasfondo"
                      className={inputClass}
                    />
                  </div>

                  <textarea
                    value={character.description}
                    onChange={(e) =>
                      updateCharacter(index, "description", e.target.value)
                    }
                    placeholder="Historia, personalidad, motivaciones... *"
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Arquitectura */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Tipo de arquitectura
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "mas" as const,
                    label: "MAS",
                    detail: "Orquestación multi-agente",
                  },
                  {
                    value: "monolithic" as const,
                    label: "Monolítico",
                    detail: "Modelo único con memoria integrada",
                  },
                ]
              ).map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                    architectureType === option.value
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="architectureType"
                    value={option.value}
                    checked={architectureType === option.value}
                    onChange={() => setArchitectureType(option.value)}
                    className="sr-only"
                  />
                  <span className="block text-white font-bold">{option.label}</span>
                  <span className="block text-xs text-slate-400 mt-1">
                    {option.detail}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-end gap-3">
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
  );
};
