import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Shield, Sword, ScrollText, Binary,
  Save, Sparkles, Upload, AlertCircle, Loader2, Wand2
} from "lucide-react";
import {
  createCharacter,
  fetchAvailableAssets,
  uploadCharacterPortrait,
  type Asset,
} from "../services/characters.api";
import { fetchCampaign, type Campaign } from "../services/campaigns.api";
import { StatCounter } from "../components/features/characters/StatCounter";
import { AssetCard } from "../components/features/characters/AssetCard";
import {
  DEFAULT_ABILITY_SCORES,
  validatePointBuy,
  calculateHitPoints,
  POINT_BUY_MIN_SCORE,
  POINT_BUY_MAX_SCORE,
  ABILITY_SCORE_MIN,
  ABILITY_SCORE_MAX,
} from "@questmasters/dnd-rules";
import { resizeImageToWebP } from "../lib/resize-image";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_MAX = 80;
const BACKSTORY_MAX = 2000;
const LIBRE_FIELD_MAX = 80;

type CreationMode = "vanilla" | "personalizado" | "libre";
type StatMethod = "point-buy" | "free";

const STAT_LABELS: Record<string, string> = {
  strength: "FUE",
  dexterity: "DES",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "SAB",
  charisma: "CAR",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CharInputProps {
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

function CharInput({ value, onChange, max, placeholder, className = "", label, required }: CharInputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        maxLength={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${className}`}
      />
      <p className={`text-right text-[10px] font-mono ${value.length >= max ? "text-red-400" : "text-slate-600"}`}>
        {value.length}/{max}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CreateCharacter: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read wizard params from URL
  const system = searchParams.get("system") ?? "dnd-5e-2014";
  const mode = (searchParams.get("mode") ?? "vanilla") as CreationMode;
  const packIdsParam = searchParams.get("packIds");
  const packIds = packIdsParam ? packIdsParam.split(",").filter(Boolean) : undefined;

  const isLibre = mode === "libre";

  // ── UI State ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Data State ────────────────────────────────────────────────────────────
  const [, setCampaign] = useState<Campaign | null>(null);
  const [assets, setAssets] = useState<{ races: Asset[]; classes: Asset[]; backgrounds: Asset[] }>({
    races: [],
    classes: [],
    backgrounds: [],
  });

  // ── Form State ────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [portraitUrl, setPortraitUrl] = useState("");
  const [backstory, setBackstory] = useState("");
  const [statMethod, setStatMethod] = useState<StatMethod>(
    campaignId ? "point-buy" : isLibre ? "free" : "point-buy"
  );
  const [stats, setStats] = useState({ ...DEFAULT_ABILITY_SCORES });

  // Vanilla / Personalizado — asset IDs
  const [raceAssetId, setRaceAssetId] = useState("");
  const [classAssetId, setClassAssetId] = useState("");
  const [backgroundAssetId, setBackgroundAssetId] = useState("");

  // Libre — free text
  const [libreRace, setLibreRace] = useState("");
  const [libreClass, setLibreClass] = useState("");
  const [libreBackground, setLibreBackground] = useState("");

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (campaignId) {
          const camp = await fetchCampaign(campaignId);
          setCampaign(camp);
        }

        if (!isLibre) {
          const data = await fetchAvailableAssets({
            campaignId,
            system: campaignId ? undefined : system,
            packIds: campaignId ? undefined : packIds,
          });
          setAssets(data);
        }
      } catch (err: any) {
        setError(err.message ?? "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [campaignId, system, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed ──────────────────────────────────────────────────────────────
  const pbValidation = validatePointBuy(stats);
  const selectedClass = assets.classes.find(c => c.id === classAssetId);
  const hitDie = selectedClass?.data?.hit_die ?? 10;
  const hpResult = calculateHitPoints(hitDie, stats.constitution, 1);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatChange = (stat: keyof typeof DEFAULT_ABILITY_SCORES, val: number) => {
    if (statMethod === "point-buy") {
      if (val < POINT_BUY_MIN_SCORE || val > POINT_BUY_MAX_SCORE) return;
    } else {
      if (val < ABILITY_SCORE_MIN || val > ABILITY_SCORE_MAX) return;
    }
    setStats(prev => ({ ...prev, [stat]: val }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImageToWebP(file, 400);
      const url = await uploadCharacterPortrait(blob);
      setPortraitUrl(url);
    } catch (err: any) {
      setError(err.message ?? "Error al subir retrato");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre del personaje es obligatorio");
      return;
    }

    if (!isLibre && (!raceAssetId || !classAssetId)) {
      setError("Debes seleccionar Raza y Clase");
      return;
    }

    if (isLibre && (!libreRace.trim() || !libreClass.trim())) {
      setError("Debes indicar Raza y Clase");
      return;
    }

    if (statMethod === "point-buy" && !pbValidation.valid) {
      setError("Presupuesto de Point Buy excedido o inválido");
      return;
    }

    setSubmitting(true);
    try {
      const choices: Record<string, any> = {};
      if (isLibre) {
        choices.libreRace = libreRace.trim();
        choices.libreClass = libreClass.trim();
        if (libreBackground.trim()) choices.libreBackground = libreBackground.trim();
      }
      choices.system = system;
      choices.mode = mode;

      await createCharacter({
        campaignId,
        name: name.trim(),
        raceAssetId: isLibre ? undefined : raceAssetId || undefined,
        classAssetId: isLibre ? undefined : classAssetId || undefined,
        backgroundAssetId: isLibre ? undefined : backgroundAssetId || undefined,
        stats,
        portraitUrl: portraitUrl || undefined,
        backstory: backstory.trim() || undefined,
        choices,
        method: isLibre ? "libre" : statMethod === "point-buy" ? "point-buy" : "free",
      });

      navigate(campaignId ? `/campaigns/${campaignId}` : "/characters");
    } catch (err: any) {
      setError(err.message ?? "Error al crear personaje");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Preparando forja de héroes...</p>
      </div>
    );
  }

  const backPath = campaignId ? `/campaigns/${campaignId}` : "/characters";

  // ── Render: Mode badge ────────────────────────────────────────────────────
  const modeBadge = {
    vanilla: { label: "Vanilla · SRD", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    personalizado: { label: "Personalizado", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    libre: { label: "Libre", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  }[mode];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      {/* Navigation */}
      <Link
        to={backPath}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Volver a {campaignId ? "la campaña" : "mis personajes"}
      </Link>

      {/* Title row */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-black text-white">Forjar Personaje</h1>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${modeBadge.color}`}>
          {modeBadge.label}
        </span>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 uppercase tracking-widest">
          {system}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="flex-1 space-y-8">

          {/* Identity */}
          <section className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl shadow-indigo-900/5">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Portrait */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group shrink-0 ${
                  portraitUrl
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-slate-700 hover:border-indigo-500/40 bg-slate-900/30"
                }`}
              >
                {portraitUrl ? (
                  <>
                    <img src={portraitUrl} className="w-full h-full object-cover" alt="Héroe" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold flex items-center gap-1">
                        <Upload size={14} /> Cambiar
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full mb-2 transition-colors ${uploading ? "bg-slate-800" : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"}`}>
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <User size={24} />}
                    </div>
                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Retrato</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              {/* Name + HP/Method */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-tighter text-indigo-400">Identidad del Héroe</h2>
                  <input
                    type="text"
                    required
                    maxLength={NAME_MAX}
                    placeholder="Nombre del personaje..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-indigo-500 text-3xl font-black text-white focus:outline-none py-2 transition-colors placeholder:text-slate-700 truncate"
                  />
                  <p className={`text-right text-[10px] font-mono ${name.length >= NAME_MAX ? "text-red-400" : "text-slate-600"}`}>
                    {name.length}/{NAME_MAX}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {!isLibre && (
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">HP Iniciales</p>
                      <div className="bg-slate-900/60 px-4 py-2 rounded-xl border border-red-500/20 flex items-center gap-2">
                        <span className="text-xl font-black text-red-400">{hpResult.maxHp}</span>
                      </div>
                    </div>
                  )}
                  {!campaignId && !isLibre && (
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Método de Stats</p>
                      <select
                        value={statMethod}
                        onChange={e => {
                          setStatMethod(e.target.value as StatMethod);
                          setStats({ ...DEFAULT_ABILITY_SCORES });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value="point-buy">Point Buy (PHB)</option>
                        <option value="free">Libre (1-30)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Binary className="text-indigo-500" size={24} />
                Atributos Básicos
              </h3>
              {!isLibre && statMethod === "point-buy" && (
                <div className={`px-4 py-1.5 rounded-full border-2 flex items-center gap-2 transition-all ${
                  pbValidation.remaining >= 0
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                }`}>
                  <Sparkles size={16} />
                  <span className="text-sm font-black">Puntos restantes: {pbValidation.remaining}</span>
                </div>
              )}
              {isLibre && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <Wand2 size={14} /> Modo libre (1-30)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(Object.keys(DEFAULT_ABILITY_SCORES) as (keyof typeof DEFAULT_ABILITY_SCORES)[]).map(key => (
                <StatCounter
                  key={key}
                  label={STAT_LABELS[key] ?? key.toUpperCase()}
                  value={stats[key]}
                  onChange={val => handleStatChange(key, val)}
                  method={isLibre ? "free" : statMethod}
                  disabledPlus={
                    !isLibre &&
                    statMethod === "point-buy" &&
                    (stats[key] >= POINT_BUY_MAX_SCORE || pbValidation.remaining <= 0)
                  }
                  disabledMinus={
                    stats[key] <= ((!isLibre && statMethod === "point-buy") ? POINT_BUY_MIN_SCORE : ABILITY_SCORE_MIN)
                  }
                />
              ))}
            </div>
          </section>

          {/* Backstory + Background */}
          <section className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 space-y-5">
            <h3 className="text-white font-bold flex items-center gap-3">
              <ScrollText className="text-emerald-500" size={20} />
              Trasfondo e Historia
            </h3>

            {/* Background selector (vanilla/personalizado) */}
            {!isLibre && assets.backgrounds.length > 0 && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">
                  Seleccionar Background
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assets.backgrounds.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      isSelected={backgroundAssetId === asset.id}
                      onSelect={() => setBackgroundAssetId(backgroundAssetId === asset.id ? "" : asset.id)}
                      type="background"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Libre background text */}
            {isLibre && (
              <CharInput
                label="Background / Trasfondo"
                value={libreBackground}
                onChange={setLibreBackground}
                max={LIBRE_FIELD_MAX}
                placeholder="Ej: Noble arruinado, Cazador de bestias..."
                className="bg-slate-950/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
              />
            )}

            {/* Backstory textarea */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Historia del Personaje
              </label>
              <textarea
                value={backstory}
                maxLength={BACKSTORY_MAX}
                onChange={e => setBackstory(e.target.value)}
                placeholder="Escribe el origen de tu héroe..."
                className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
              <p className={`text-right text-[10px] font-mono ${backstory.length >= BACKSTORY_MAX ? "text-red-400" : "text-slate-600"}`}>
                {backstory.length}/{BACKSTORY_MAX}
              </p>
            </div>
          </section>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="lg:w-[400px] space-y-8">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Race */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Shield className="text-amber-500" size={22} />
              Raza <span className="text-red-400 text-sm">*</span>
            </h3>

            {isLibre ? (
              <CharInput
                value={libreRace}
                onChange={setLibreRace}
                max={LIBRE_FIELD_MAX}
                placeholder="Ej: Elfo de Luna, Humano variante, Dragonborn..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-all"
              />
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {assets.races.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">Sin razas disponibles para este sistema.</p>
                ) : assets.races.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={raceAssetId === asset.id}
                    onSelect={() => setRaceAssetId(asset.id)}
                    type="race"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Class */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Sword className="text-indigo-500" size={22} />
              Clase <span className="text-red-400 text-sm">*</span>
            </h3>

            {isLibre ? (
              <CharInput
                value={libreClass}
                onChange={setLibreClass}
                max={LIBRE_FIELD_MAX}
                placeholder="Ej: Guerrero, Mago de la Torre, Hechicero Dracónico..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition-all"
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {assets.classes.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">Sin clases disponibles para este sistema.</p>
                ) : assets.classes.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={classAssetId === asset.id}
                    onSelect={() => setClassAssetId(asset.id)}
                    type="class"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="w-full py-6 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group flex items-center justify-center gap-3"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                Forjar Héroe
                <Save className="group-hover:translate-y-[-2px] transition-transform" size={22} />
              </>
            )}
          </button>

          <p className="text-center text-[10px] font-black uppercase tracking-tighter text-slate-600">
            QuestMasters · {system} · {mode}
          </p>
        </div>
      </div>
    </div>
  );
};
