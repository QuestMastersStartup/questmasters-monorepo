import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, Upload, User, Loader2, Shield, Sword, Binary } from "lucide-react";
import {
  fetchCharacter,
  updateCharacter,
  uploadCharacterPortrait,
  type Character,
} from "../services/characters.api";
import { fetchCampaign } from "../services/campaigns.api";
import { StatCounter } from "../components/features/characters/StatCounter";
import {
  DEFAULT_ABILITY_SCORES,
  ABILITY_SCORE_MIN,
  ABILITY_SCORE_MAX,
} from "@questmasters/dnd-rules";
import { resizeImageToWebP } from "../lib/resize-image";
import { supabase } from "../lib/supabase";

export const EditCharacter: React.FC = () => {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDM, setIsDM] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [character, setCharacter] = useState<Character | null>(null);

  // Owner fields
  const [name, setName] = useState("");
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [backstory, setBackstory] = useState("");

  // DM fields
  const [stats, setStats] = useState({ ...DEFAULT_ABILITY_SCORES });
  const [level, setLevel] = useState(1);
  const [hitPoints, setHitPoints] = useState(0);
  const [status, setStatus] = useState("active");

  useEffect(() => {
    const loadCharacter = async () => {
      if (!charId) return;
      try {
        const charData = await fetchCharacter(charId);
        setCharacter(charData);
        // Populate owner fields
        setName(charData.name);
        setPortraitUrl(charData.portraitUrl);
        setBackstory(charData.backstory || "");
        // Populate DM fields
        setStats(charData.stats);
        setLevel(charData.level);
        setHitPoints(charData.hitPoints);
        setStatus(charData.status);

        // Resolve permissions
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;
        setIsOwner(currentUserId === charData.userId);

        if (campaignId) {
          const campaign = await fetchCampaign(campaignId);
          setIsDM(currentUserId === campaign.dmId);
        } else {
          // Free character: owner IS DM
          setIsDM(currentUserId === charData.userId);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar personaje");
      } finally {
        setLoading(false);
      }
    };
    loadCharacter();
  }, [charId, campaignId]);

  const handleStatChange = (stat: keyof typeof DEFAULT_ABILITY_SCORES, newValue: number) => {
    if (newValue < ABILITY_SCORE_MIN || newValue > ABILITY_SCORE_MAX) return;
    setStats((prev) => ({ ...prev, [stat]: newValue }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const resizedBlob = await resizeImageToWebP(file, 400);
      const url = await uploadCharacterPortrait(resizedBlob);
      setPortraitUrl(url);
    } catch (err: any) {
      setError(err.message || "Error al subir retrato");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charId) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, any> = {};

      // Owner fields always sent
      if (isOwner) {
        payload.name = name;
        payload.backstory = backstory || null;
        payload.portraitUrl = portraitUrl;
      }

      // DM fields
      if (isDM) {
        payload.stats = stats;
        payload.level = level;
        payload.hitPoints = hitPoints;
        payload.status = status;
      }

      await updateCharacter(charId, payload);

      if (campaignId) {
        navigate(`/campaigns/${campaignId}`);
      } else {
        navigate("/profile");
      }
    } catch (err: any) {
      setError(err.message || "Error al actualizar personaje");
    } finally {
      setSubmitting(false);
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

  if (!character) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl text-white mb-4">Personaje no encontrado</h1>
        <Link to={campaignId ? `/campaigns/${campaignId}` : "/campaigns"} className="text-indigo-400">
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <Link
        to={campaignId ? `/campaigns/${campaignId}` : "/campaigns"}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Volver
      </Link>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-10 backdrop-blur-sm shadow-xl shadow-indigo-900/5">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Editar Personaje
          </h1>
          <p className="text-slate-400 text-sm">
            Modifica los detalles de <span className="text-white font-bold">{character.name}</span>.
            {!isOwner && isDM && " Estás editando como Dungeon Master."}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* ─── Owner Fields ─────────────────────────────────── */}
          {isOwner && (
            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-tighter text-indigo-400 border-b border-slate-700 pb-2">
                Campos de Jugador
              </h3>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Portrait Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-32 h-32 rounded-2xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group shrink-0 ${
                    portraitUrl
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : "border-slate-700 hover:border-indigo-500/40 bg-slate-900/30"
                  }`}
                >
                  {portraitUrl ? (
                    <>
                      <img src={portraitUrl} className="w-full h-full object-cover" alt="Retrato" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-[10px] font-bold flex items-center gap-1">
                          <Upload size={14} /> Cambiar
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`p-3 rounded-full mb-2 ${uploading ? "bg-slate-800" : "bg-indigo-500/10 text-indigo-400"}`}>
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <User size={24} />}
                      </div>
                      <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Retrato</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div className="space-y-2 group">
                    <label htmlFor="edit-char-name" className="text-sm font-semibold text-slate-300 ml-1 block group-focus-within:text-indigo-400 transition-colors">
                      Nombre
                    </label>
                    <input
                      id="edit-char-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label htmlFor="edit-char-backstory" className="text-sm font-semibold text-slate-300 ml-1 block group-focus-within:text-indigo-400 transition-colors">
                      Historia
                    </label>
                    <textarea
                      id="edit-char-backstory"
                      value={backstory}
                      onChange={(e) => setBackstory(e.target.value)}
                      placeholder="La historia de tu personaje..."
                      className="w-full h-28 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Read-only Race/Class display */}
              <div className="flex gap-4">
                {character.raceName && (
                  <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/20 px-4 py-2 rounded-xl">
                    <Shield size={16} className="text-amber-400" />
                    <span className="text-sm font-bold text-amber-300">{character.raceName}</span>
                  </div>
                )}
                {character.className && (
                  <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/20 px-4 py-2 rounded-xl">
                    <Sword size={16} className="text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-300">{character.className}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ─── DM Fields ────────────────────────────────────── */}
          {isDM && (
            <section className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-tighter text-amber-400 border-b border-slate-700 pb-2">
                Campos de Dungeon Master
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nivel</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/70 transition-all text-center font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">HP</label>
                  <input
                    type="number"
                    min={1}
                    value={hitPoints}
                    onChange={(e) => setHitPoints(Number(e.target.value))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/70 transition-all text-center font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/70 transition-all cursor-pointer appearance-none font-bold"
                  >
                    <option value="active">Activo</option>
                    <option value="dead">Muerto</option>
                    <option value="retired">Retirado</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Binary size={18} className="text-indigo-400" />
                    Atributos
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(Object.keys(DEFAULT_ABILITY_SCORES) as (keyof typeof DEFAULT_ABILITY_SCORES)[]).map((key) => (
                    <StatCounter
                      key={key}
                      label={key === "strength" ? "FUE" : key === "dexterity" ? "DES" : key === "constitution" ? "CON" : key === "intelligence" ? "INT" : key === "wisdom" ? "SAB" : "CAR"}
                      value={stats[key]}
                      onChange={(val) => handleStatChange(key, val)}
                      method="free"
                      disabledPlus={stats[key] >= ABILITY_SCORE_MAX}
                      disabledMinus={stats[key] <= ABILITY_SCORE_MIN}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </span>
            ) : (
              <>
                Guardar Cambios <Save size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
