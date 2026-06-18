import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Shield, Sword, ScrollText, Binary,
  Save, Sparkles, Upload, AlertCircle, Loader2, Wand2,
  BookOpen, Star, Heart, Link2, Skull, Zap, Globe, FileText, Award,
  Dices,
} from "lucide-react";
import {
  createCharacter,
  fetchCharacter,
  updateCharacter,
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
  calculateModifier,
  calculateProficiencyBonus,
  getXpRangeForLevel,
  POINT_BUY_MIN_SCORE,
  POINT_BUY_MAX_SCORE,
  ABILITY_SCORE_MIN,
  ABILITY_SCORE_MAX,
} from "@questmasters/dnd-rules";
import { ImageCropModal } from "../components/features/shared/ImageCropModal";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_MAX        = 80;
const LIBRE_MAX       = 80;
const SHORT_MAX       = 200;
const MEDIUM_MAX      = 500;
const LONG_MAX        = 1000;
const NOTES_MAX       = 2000;
const HISTORY_MAX     = 2000;

type CreationMode = "vanilla" | "personalizado" | "libre";
type StatMethod   = "point-buy" | "free";

const STAT_LABELS: Record<string, string> = {
  strength:     "FUE",
  dexterity:    "DES",
  constitution: "CON",
  intelligence: "INT",
  wisdom:       "SAB",
  charisma:     "CAR",
};

const ALIGNMENTS = [
  { value: "lawful-good",    label: "Leal Bueno" },
  { value: "neutral-good",   label: "Neutral Bueno" },
  { value: "chaotic-good",   label: "Caótico Bueno" },
  { value: "lawful-neutral", label: "Leal Neutral" },
  { value: "true-neutral",   label: "Neutral Verdadero" },
  { value: "chaotic-neutral",label: "Caótico Neutral" },
  { value: "lawful-evil",    label: "Leal Malvado" },
  { value: "neutral-evil",   label: "Neutral Malvado" },
  { value: "chaotic-evil",   label: "Caótico Malvado" },
];

// ─── Reusable field components ────────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  counter?: { current: number; max: number };
}
function Field({ label, icon, hint, required, children, counter }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {hint && <p className="text-[11px] text-slate-600 leading-relaxed -mt-0.5">{hint}</p>}
      {children}
      {counter && (
        <p className={`text-right text-[10px] font-mono ${counter.current >= counter.max ? "text-red-400" : "text-slate-700"}`}>
          {counter.current}/{counter.max}
        </p>
      )}
    </div>
  );
}

const inputCls = "w-full bg-slate-950/50 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/60 transition-colors";
const textareaCls = `${inputCls} resize-none`;

// Section wrapper
function Section({ title, icon, optional, children }: {
  title: string; icon: React.ReactNode; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-900/40 border border-slate-700/40 rounded-3xl p-6 space-y-5">
      <h3 className="text-white font-bold flex items-center gap-3 text-sm">
        <span className="text-indigo-400">{icon}</span>
        {title}
        {optional && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 normal-case tracking-normal">
            opcional
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export const CreateCharacter: React.FC = () => {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const isEditMode        = !!charId;
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const skipBgAutoPopulateRef = useRef(false);

  const rawIds = searchParams.get("packIds");
  // In create mode these come from URL params; in edit mode overridden from character.choices
  const [system,  setSystem]  = useState(searchParams.get("system") ?? "dnd-5e-2014");
  const [mode,    setMode]    = useState<CreationMode>((searchParams.get("mode") ?? "vanilla") as CreationMode);
  const [packIds, setPackIds] = useState<string[] | undefined>(rawIds ? rawIds.split(",").filter(Boolean) : undefined);

  const isLibre = mode === "libre";

  // ── UI State ──────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [cropFile,   setCropFile]   = useState<File | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [,           setCampaign]   = useState<Campaign | null>(null);

  // ── Asset data ────────────────────────────────────────────────────────────
  const [assets, setAssets] = useState<{
    races: Asset[]; subraces: Asset[]; classes: Asset[]; subclasses: Asset[]; backgrounds: Asset[];
  }>({ races: [], subraces: [], classes: [], subclasses: [], backgrounds: [] });

  // ── Identity ──────────────────────────────────────────────────────────────
  const [name,       setName]       = useState("");
  const [portraitUrl,setPortraitUrl]= useState("");
  const [statMethod, setStatMethod] = useState<StatMethod>(
    campaignId ? "point-buy" : (searchParams.get("mode") === "libre" ? "free" : "point-buy")
  );
  const [level,   setLevel]   = useState(1);
  const [status,  setStatus]  = useState<'active' | 'dead' | 'retired'>('active');
  const [stats, setStats] = useState({ ...DEFAULT_ABILITY_SCORES });

  // ── HP ────────────────────────────────────────────────────────────────────
  // null = not set by user → backend uses max HP
  const [customHp, setCustomHp] = useState<number | null>(null);

  // ── Origin — asset IDs (vanilla/personalizado) ───────────────────────────
  const [raceAssetId,       setRaceAssetId]       = useState("");
  const [subraceAssetId,    setSubraceAssetId]     = useState("");
  const [classAssetId,      setClassAssetId]       = useState("");
  const [subclassAssetId,   setSubclassAssetId]    = useState("");
  const [backgroundAssetId, setBackgroundAssetId]  = useState("");

  // ── Origin — libre text ───────────────────────────────────────────────────
  const [libreRace,       setLibreRace]      = useState("");
  const [libreSubrace,    setLibreSubrace]   = useState("");
  const [libreClass,      setLibreClass]     = useState("");
  const [libreSubclass,   setLibreSubclass]  = useState("");
  const [libreBackground, setLibreBackground]= useState("");

  // ── Background narrative fields ───────────────────────────────────────────
  const [bgFeature,     setBgFeature]    = useState("");
  const [bgPersonality, setBgPersonality]= useState("");
  const [bgIdeals,      setBgIdeals]     = useState("");
  const [bgBonds,       setBgBonds]      = useState("");
  const [bgFlaws,       setBgFlaws]      = useState("");

  // ── Additional info ───────────────────────────────────────────────────────
  const [alignment,  setAlignment]  = useState("");
  const [appearance, setAppearance] = useState("");
  const [age,        setAge]        = useState("");
  const [history,    setHistory]    = useState("");
  const [languages,  setLanguages]  = useState("");
  const [notes,      setNotes]      = useState("");
  const [xp,         setXp]         = useState("");

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        let charSystem = system;
        let charMode: CreationMode = mode;
        let charPackIds = packIds;

        if (isEditMode) {
          const char = await fetchCharacter(charId!);
          const ch = char.choices ?? {};

          charSystem = (ch.system as string) ?? "dnd-5e-2014";
          charMode   = ((ch.mode as string) ?? "vanilla") as CreationMode;
          charPackIds = ch.packIds ? (ch.packIds as string).split(",").filter(Boolean) : undefined;

          setSystem(charSystem);
          setMode(charMode);
          setPackIds(charPackIds);

          // Identity
          setName(char.name);
          setPortraitUrl(char.portraitUrl ?? "");
          setHistory(char.backstory ?? "");
          setStats(char.stats);
          setLevel(char.level);
          setStatus((char.status as 'active' | 'dead' | 'retired') ?? 'active');
          setStatMethod((ch.statMethod as StatMethod) ?? 'free');
          setCustomHp(char.hitPoints);

          // Origin
          if (charMode !== 'libre') {
            setRaceAssetId(char.raceAssetId ?? "");
            setSubraceAssetId((ch.subraceAssetId as string) ?? "");
            setClassAssetId(char.classAssetId ?? "");
            setSubclassAssetId((ch.subclassAssetId as string) ?? "");
            skipBgAutoPopulateRef.current = true;
            setBackgroundAssetId(char.backgroundAssetId ?? "");
          } else {
            setLibreRace((ch.libreRace as string) ?? "");
            setLibreSubrace((ch.libreSubrace as string) ?? "");
            setLibreClass((ch.libreClass as string) ?? "");
            setLibreSubclass((ch.libreSubclass as string) ?? "");
            setLibreBackground((ch.libreBackground as string) ?? "");
          }

          // Background narrative
          setBgFeature((ch.bgFeature as string) ?? "");
          setBgPersonality((ch.bgPersonality as string) ?? "");
          setBgIdeals((ch.bgIdeals as string) ?? "");
          setBgBonds((ch.bgBonds as string) ?? "");
          setBgFlaws((ch.bgFlaws as string) ?? "");

          // Additional info
          setAlignment((ch.alignment as string) ?? "");
          setAppearance((ch.appearance as string) ?? "");
          setAge(ch.age != null ? String(ch.age) : "");
          setLanguages((ch.languages as string) ?? "");
          setNotes((ch.notes as string) ?? "");
          setXp(ch.xp != null ? String(ch.xp) : "");
        } else if (campaignId) {
          const camp = await fetchCampaign(campaignId);
          setCampaign(camp);
        }

        if (charMode !== 'libre') {
          const data = await fetchAvailableAssets({
            campaignId,
            system: campaignId ? undefined : charSystem,
            packIds: campaignId ? undefined : charPackIds,
          });
          setAssets(data);
        }
      } catch (err: any) {
        setError(err.message ?? "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-populate background narrative fields from asset data
  useEffect(() => {
    if (isLibre || !backgroundAssetId) return;
    if (skipBgAutoPopulateRef.current) { skipBgAutoPopulateRef.current = false; return; }
    const bg = assets.backgrounds.find(b => b.id === backgroundAssetId);
    if (!bg) return;
    const d = bg.data as any;

    const featName = d?.feature?.name ?? "";
    const featDesc = Array.isArray(d?.feature?.desc)
      ? d.feature.desc.join(" ")
      : (d?.feature?.desc ?? "");
    setBgFeature(featName ? `${featName}: ${featDesc}`.substring(0, LONG_MAX) : "");

    const traits = d?.personality_traits?.from?.options
      ?.slice(0, 2).map((o: any) => o.string).filter(Boolean) ?? [];
    setBgPersonality(traits.join("\n").substring(0, MEDIUM_MAX));

    const ideals = d?.ideal?.from?.options
      ?.slice(0, 2).map((o: any) => o.desc ?? o.string).filter(Boolean) ?? [];
    setBgIdeals(ideals.join("\n").substring(0, MEDIUM_MAX));

    const bonds = d?.bond?.from?.options
      ?.slice(0, 2).map((o: any) => o.string).filter(Boolean) ?? [];
    setBgBonds(bonds.join("\n").substring(0, MEDIUM_MAX));

    const flaws = d?.flaw?.from?.options
      ?.slice(0, 2).map((o: any) => o.string).filter(Boolean) ?? [];
    setBgFlaws(flaws.join("\n").substring(0, MEDIUM_MAX));
  }, [backgroundAssetId, assets.backgrounds, isLibre]);

  // Reset subrace when race changes
  useEffect(() => {
    setSubraceAssetId("");
  }, [raceAssetId]);

  // Reset HP and subclass when class changes
  useEffect(() => { setCustomHp(null); setSubclassAssetId(""); }, [classAssetId]);

  // Clamp customHp to new max when CON changes (non-libre only)
  useEffect(() => {
    if (customHp !== null && !isLibre) {
      const cls = assets.classes.find(c => c.id === classAssetId);
      const die = (cls?.data as any)?.hit_die ?? 10;
      const max = Math.max(1, die + calculateModifier(stats.constitution));
      if (customHp > max) setCustomHp(max);
    }
  }, [stats.constitution]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const pbValidation   = validatePointBuy(stats);
  const selectedClass  = assets.classes.find(c => c.id === classAssetId);
  const hitDie         = (selectedClass?.data as any)?.hit_die ?? 10;
  const hpResult       = calculateHitPoints(hitDie, stats.constitution, isEditMode ? level : 1);
  const conMod         = calculateModifier(stats.constitution);
  const maxHpDisplay   = isLibre ? null : hpResult.maxHp;
  const profBonus      = calculateProficiencyBonus(isEditMode ? level : 1);
  const xpRange        = getXpRangeForLevel(isEditMode ? level : 1);

  // Final HP: user value if set, otherwise max
  const finalHp = isLibre
    ? (customHp ?? 10)
    : (customHp ?? hpResult.maxHp);
  const selectedRace   = assets.races.find(r => r.id === raceAssetId);
  const availSubraces   = assets.subraces.filter(
    sr => (sr.data as any)?.race?.index === selectedRace?.index
  );
  const availSubclasses = assets.subclasses.filter(
    sc => (sc.data as any)?.class?.index === selectedClass?.index
  );

  // Background proficiency display (vanilla/personalizado)
  const selectedBg   = assets.backgrounds.find(b => b.id === backgroundAssetId);
  const bgSkillProfs = selectedBg
    ? ((selectedBg.data as any)?.starting_proficiencies ?? [])
        .filter((p: any) => p.name?.startsWith("Skill:"))
        .map((p: any) => p.name.replace("Skill: ", ""))
        .join(", ")
    : "";
  const bgEquipment  = selectedBg
    ? ((selectedBg.data as any)?.starting_equipment ?? [])
        .map((e: any) => `${e.equipment?.name ?? "?"} ×${e.quantity ?? 1}`)
        .join(", ")
    : "";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const rollHp = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setCustomHp(Math.max(1, roll + conMod));
  };

  const handleStatChange = (stat: keyof typeof DEFAULT_ABILITY_SCORES, val: number) => {
    if (statMethod === "point-buy") {
      if (val < POINT_BUY_MIN_SCORE || val > POINT_BUY_MAX_SCORE) return;
    } else {
      if (val < ABILITY_SCORE_MIN || val > ABILITY_SCORE_MAX) return;
    }
    setStats(prev => ({ ...prev, [stat]: val }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCharacterPortrait(blob);
      setPortraitUrl(url);
    } catch (err: any) {
      setError(err.message ?? "Error al subir retrato");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("El nombre del personaje es obligatorio"); return; }
    if (!isLibre && (!raceAssetId || !classAssetId)) { setError("Debes seleccionar Raza y Clase"); return; }
    if (isLibre && (!libreRace.trim() || !libreClass.trim())) { setError("Debes indicar Raza y Clase"); return; }
    if (statMethod === "point-buy" && !isLibre && !pbValidation.valid) { setError("Presupuesto de Point Buy excedido"); return; }

    setSubmitting(true);
    try {
      const choices: Record<string, any> = {
        system, mode,
        statMethod: isLibre ? 'libre' : statMethod,
        // Origin (libre)
        ...(isLibre && { libreRace: libreRace.trim(), libreClass: libreClass.trim() }),
        ...(isLibre && libreSubrace.trim() && { libreSubrace: libreSubrace.trim() }),
        ...(isLibre && libreSubclass.trim() && { libreSubclass: libreSubclass.trim() }),
        ...(isLibre && libreBackground.trim() && { libreBackground: libreBackground.trim() }),
        // Subrace / subclass (vanilla/personalizado)
        ...(subraceAssetId && { subraceAssetId }),
        ...(subclassAssetId && { subclassAssetId }),
        // Background narrative
        ...(bgFeature.trim()     && { bgFeature:     bgFeature.trim() }),
        ...(bgPersonality.trim() && { bgPersonality: bgPersonality.trim() }),
        ...(bgIdeals.trim()      && { bgIdeals:      bgIdeals.trim() }),
        ...(bgBonds.trim()       && { bgBonds:       bgBonds.trim() }),
        ...(bgFlaws.trim()       && { bgFlaws:       bgFlaws.trim() }),
        // Additional info
        ...(alignment            && { alignment }),
        ...(appearance.trim()    && { appearance:    appearance.trim() }),
        ...(age.trim()           && { age:           Number(age) }),
        ...(languages.trim()     && { languages:     languages.trim() }),
        ...(notes.trim()         && { notes:         notes.trim() }),
        ...(xp                   && { xp:            Number(xp) }),
      };

      if (isEditMode) {
        await updateCharacter(charId!, {
          name:              name.trim(),
          raceAssetId:       isLibre ? null : raceAssetId || null,
          classAssetId:      isLibre ? null : classAssetId || null,
          backgroundAssetId: isLibre ? null : backgroundAssetId || null,
          stats,
          portraitUrl:  portraitUrl || null,
          backstory:    history.trim() || null,
          level,
          hitPoints:    finalHp,
          status,
          choices,
        });
        navigate(campaignId ? `/campaigns/${campaignId}` : `/characters/${charId}`);
      } else {
        await createCharacter({
          campaignId,
          name: name.trim(),
          raceAssetId:       isLibre ? undefined : raceAssetId || undefined,
          classAssetId:      isLibre ? undefined : classAssetId || undefined,
          backgroundAssetId: isLibre ? undefined : backgroundAssetId || undefined,
          stats,
          portraitUrl:  portraitUrl || undefined,
          backstory:    history.trim() || undefined,
          choices,
          method:     isLibre ? "libre" : statMethod === "point-buy" ? "point-buy" : "free",
          hitPoints:  finalHp,
        });
        navigate(campaignId ? `/campaigns/${campaignId}` : "/characters");
      }
    } catch (err: any) {
      setError(err.message ?? "Error al crear personaje");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">{isEditMode ? "Cargando personaje..." : "Preparando forja de héroes..."}</p>
      </div>
    );
  }

  const modeBadge = {
    vanilla:       { label: "Vanilla · SRD",  color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    personalizado: { label: "Personalizado",   color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    libre:         { label: "Libre",           color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  }[mode];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {/* Nav */}
      <Link
        to={isEditMode
          ? (campaignId ? `/campaigns/${campaignId}` : `/characters/${charId}`)
          : (campaignId ? `/campaigns/${campaignId}` : "/characters")}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Volver a {isEditMode ? "el personaje" : (campaignId ? "la campaña" : "mis personajes")}
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-black text-white">{isEditMode ? "Editar Personaje" : "Forjar Personaje"}</h1>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${modeBadge.color}`}>
          {modeBadge.label}
        </span>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700 text-slate-500 uppercase tracking-widest">
          {system}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ═══ LEFT COLUMN ════════════════════════════════════════════════ */}
        <div className="flex-1 space-y-6">

          {/* 1 · Identidad */}
          <section className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Portrait */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group shrink-0 ${
                  portraitUrl ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-700 hover:border-indigo-500/40 bg-slate-900/30"
                }`}
              >
                {portraitUrl ? (
                  <>
                    <img src={portraitUrl} className="w-full h-full object-cover" alt="Héroe" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold flex items-center gap-1"><Upload size={14} /> Cambiar</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full mb-2 ${uploading ? "bg-slate-800" : "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"}`}>
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <User size={24} />}
                    </div>
                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Retrato</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              {/* Name + HP */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-tighter text-indigo-400">Identidad del Héroe</h2>
                  <input
                    type="text"
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

                <div className="flex items-start gap-3 flex-wrap">
                  {/* Nivel + Estado — solo en edición */}
                  {isEditMode && (
                    <>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel</p>
                        <input
                          type="number" min={1} max={20} value={level}
                          onChange={e => {
                            const newLevel = Math.max(1, Math.min(20, Number(e.target.value)));
                            setLevel(newLevel);
                            const range = getXpRangeForLevel(newLevel);
                            const cur = Number(xp) || 0;
                            if (cur < range.min) setXp(String(range.min));
                            else if (cur > range.max) setXp(String(range.max));
                            setCustomHp(null);
                          }}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-lg font-black text-indigo-400 text-center focus:outline-none focus:border-indigo-500/60 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</p>
                        <select value={status} onChange={e => setStatus(e.target.value as 'active' | 'dead' | 'retired')}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer h-[42px]">
                          <option value="active">Activo</option>
                          <option value="dead">Muerto</option>
                          <option value="retired">Retirado</option>
                        </select>
                      </div>
                    </>
                  )}
                  {/* HP Block */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {isEditMode ? "HP Máximos" : "HP Iniciales"}
                    </p>

                    {isLibre ? (
                      /* Libre: input sin límite mecánico */
                      <div className="space-y-0.5">
                        <input
                          type="number"
                          min={1} max={999}
                          value={customHp ?? ""}
                          onChange={e => {
                            const v = Number(e.target.value);
                            setCustomHp(v > 0 ? v : null);
                          }}
                          placeholder="—"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-lg font-black text-red-400 text-center focus:outline-none focus:border-red-500/60 transition-colors"
                        />
                        <p className="text-[10px] text-slate-700">sin límite</p>
                      </div>
                    ) : (
                      /* Estándar: input + dado, capped al máximo */
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={maxHpDisplay ?? 999}
                            value={customHp ?? hpResult.maxHp}
                            onChange={e => {
                              const raw = Number(e.target.value);
                              const max = maxHpDisplay ?? 999;
                              setCustomHp(Math.max(1, Math.min(raw, max)));
                            }}
                            className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-lg font-black text-red-400 text-center focus:outline-none focus:border-red-500/60 transition-colors"
                          />
                          <span className="text-[11px] text-slate-600 font-mono">
                            / {maxHpDisplay}
                          </span>
                          <button
                            type="button"
                            onClick={rollHp}
                            title={`Tirar 1d${hitDie} + ${conMod >= 0 ? "+" : ""}${conMod} CON`}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 transition-colors active:scale-[0.90] active:rotate-12 transition-transform"
                          >
                            <Dices size={16} />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-700 font-mono">
                          1d{hitDie} {conMod >= 0 ? "+" : ""}{conMod} CON · máx {maxHpDisplay}
                        </p>
                      </div>
                    )}
                  </div>

                  {!campaignId && !isLibre && (
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Método de Stats</p>
                      <select
                        value={statMethod}
                        onChange={e => { setStatMethod(e.target.value as StatMethod); setStats({ ...DEFAULT_ABILITY_SCORES }); }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value="point-buy">Point Buy (PHB)</option>
                        <option value="free">Libre (1-30)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Experiencia</p>
                    <input
                      type="number"
                      min={xpRange.min} max={xpRange.max}
                      value={xp}
                      onChange={e => setXp(e.target.value)}
                      placeholder={String(xpRange.min)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors text-center"
                    />
                    <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                      {xpRange.min.toLocaleString()}–{xpRange.max.toLocaleString()} XP
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bon. Comp.</p>
                    <div className="w-24 bg-slate-900/60 border border-slate-700/50 rounded-xl px-3 py-2 text-xs font-black text-violet-400 text-center select-none">
                      +{profBonus}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2 · Atributos */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Binary className="text-indigo-500" size={24} />
                Atributos
              </h3>
              {!isLibre && statMethod === "point-buy" && (
                <div className={`px-4 py-1.5 rounded-full border-2 flex items-center gap-2 transition-all ${
                  pbValidation.remaining >= 0
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"
                }`}>
                  <Sparkles size={16} />
                  <span className="text-sm font-black">Puntos: {pbValidation.remaining}</span>
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
                  label={STAT_LABELS[key]}
                  value={stats[key]}
                  onChange={val => handleStatChange(key, val)}
                  method={isLibre ? "free" : statMethod}
                  disabledPlus={
                    !isLibre && statMethod === "point-buy" &&
                    (stats[key] >= POINT_BUY_MAX_SCORE || pbValidation.remaining <= 0)
                  }
                  disabledMinus={stats[key] <= ((!isLibre && statMethod === "point-buy") ? POINT_BUY_MIN_SCORE : ABILITY_SCORE_MIN)}
                />
              ))}
            </div>
          </section>

          {/* 3 · Trasfondo */}
          <Section title="Trasfondo" icon={<ScrollText size={18} />} optional>
            <p className="text-[12px] text-slate-500 leading-relaxed -mt-2">
              El trasfondo revela de dónde vienes, cómo te convertiste en aventurero y cuál es tu lugar en el mundo.
              Selecciona uno existente o escríbelo libremente.
            </p>

            {/* Background selector */}
            {!isLibre ? (
              assets.backgrounds.length > 0 ? (
                <div>
                  <Field label="Seleccionar trasfondo">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
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
                  </Field>
                  {bgSkillProfs && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 space-y-1">
                      <p><span className="font-bold text-slate-300">Competencias de habilidad:</span> {bgSkillProfs}</p>
                      {bgEquipment && <p><span className="font-bold text-slate-300">Equipo inicial:</span> {bgEquipment}</p>}
                    </div>
                  )}
                </div>
              ) : null
            ) : (
              <Field label="Nombre del trasfondo" required={false}>
                <input
                  type="text"
                  maxLength={LIBRE_MAX}
                  value={libreBackground}
                  onChange={e => setLibreBackground(e.target.value)}
                  placeholder="Ej: Noble arruinado, Cazador de bestias..."
                  className={inputCls}
                />
                <p className={`text-right text-[10px] font-mono mt-1 ${libreBackground.length >= LIBRE_MAX ? "text-red-400" : "text-slate-700"}`}>
                  {libreBackground.length}/{LIBRE_MAX}
                </p>
              </Field>
            )}

            {/* Rasgo */}
            <Field
              label="Rasgo"
              icon={<Star size={12} />}
              hint="La habilidad especial o beneficio que otorga tu trasfondo."
              counter={{ current: bgFeature.length, max: LONG_MAX }}
            >
              <textarea
                maxLength={LONG_MAX}
                value={bgFeature}
                onChange={e => setBgFeature(e.target.value)}
                placeholder="Pulsa para editar el rasgo de tu trasfondo..."
                rows={3}
                className={textareaCls}
              />
            </Field>

            {/* Rasgos de personalidad */}
            <Field
              label="Rasgos de personalidad"
              icon={<Heart size={12} />}
              hint="Describe cómo piensa, habla y se comporta tu personaje."
              counter={{ current: bgPersonality.length, max: MEDIUM_MAX }}
            >
              <textarea
                maxLength={MEDIUM_MAX}
                value={bgPersonality}
                onChange={e => setBgPersonality(e.target.value)}
                placeholder="Pulsa para editar los rasgos de personalidad..."
                rows={3}
                className={textareaCls}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ideales */}
              <Field
                label="Ideales"
                icon={<Zap size={12} />}
                counter={{ current: bgIdeals.length, max: MEDIUM_MAX }}
              >
                <textarea
                  maxLength={MEDIUM_MAX}
                  value={bgIdeals}
                  onChange={e => setBgIdeals(e.target.value)}
                  placeholder="¿En qué cree tu personaje?"
                  rows={3}
                  className={textareaCls}
                />
              </Field>

              {/* Vínculos */}
              <Field
                label="Vínculos"
                icon={<Link2 size={12} />}
                counter={{ current: bgBonds.length, max: MEDIUM_MAX }}
              >
                <textarea
                  maxLength={MEDIUM_MAX}
                  value={bgBonds}
                  onChange={e => setBgBonds(e.target.value)}
                  placeholder="¿Qué le une al mundo o a otras personas?"
                  rows={3}
                  className={textareaCls}
                />
              </Field>
            </div>

            {/* Defectos */}
            <Field
              label="Defectos"
              icon={<Skull size={12} />}
              counter={{ current: bgFlaws.length, max: MEDIUM_MAX }}
            >
              <textarea
                maxLength={MEDIUM_MAX}
                value={bgFlaws}
                onChange={e => setBgFlaws(e.target.value)}
                placeholder="¿Cuál es la debilidad o el vicio de tu personaje?"
                rows={2}
                className={textareaCls}
              />
            </Field>
          </Section>

          {/* 4 · Información adicional */}
          <Section title="Información adicional" icon={<FileText size={18} />} optional>
            <p className="text-[12px] text-slate-500 -mt-2">Deja en blanco los campos que no vayas a utilizar.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alineamiento */}
              <Field label="Alineamiento" icon={<Award size={12} />}>
                <select
                  value={alignment}
                  onChange={e => setAlignment(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">Sin especificar</option>
                  {ALIGNMENTS.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </Field>

              {/* Edad */}
              <Field label="Edad">
                <input
                  type="number"
                  min={0} max={9999}
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="Años"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Apariencia */}
            <Field
              label="Apariencia"
              hint="Descripción física: altura, peso, color de ojos, rasgos distintivos..."
              counter={{ current: appearance.length, max: MEDIUM_MAX }}
            >
              <textarea
                maxLength={MEDIUM_MAX}
                value={appearance}
                onChange={e => setAppearance(e.target.value)}
                placeholder="Describe el aspecto físico de tu personaje..."
                rows={3}
                className={textareaCls}
              />
            </Field>

            {/* Historia */}
            <Field
              label="Historia"
              icon={<BookOpen size={12} />}
              hint="Una introducción al trasfondo de tu personaje."
              counter={{ current: history.length, max: HISTORY_MAX }}
            >
              <textarea
                maxLength={HISTORY_MAX}
                value={history}
                onChange={e => setHistory(e.target.value)}
                placeholder="Escribe el origen de tu héroe..."
                rows={4}
                className={textareaCls}
              />
            </Field>

            {/* Idiomas */}
            <Field
              label="Idiomas"
              icon={<Globe size={12} />}
              hint="Idiomas que conoce tu personaje además de los de su raza/trasfondo."
              counter={{ current: languages.length, max: SHORT_MAX }}
            >
              <input
                type="text"
                maxLength={SHORT_MAX}
                value={languages}
                onChange={e => setLanguages(e.target.value)}
                placeholder="Ej: Común, Élfico, Enano..."
                className={inputCls}
              />
            </Field>

            {/* Notas */}
            <Field
              label="Notas"
              hint="Apuntes adicionales sobre el personaje."
              counter={{ current: notes.length, max: NOTES_MAX }}
            >
              <textarea
                maxLength={NOTES_MAX}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Realiza aquí cualquier apunte sobre el personaje..."
                rows={4}
                className={textareaCls}
              />
            </Field>
          </Section>
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════════ */}
        <div className="lg:w-[400px] space-y-6">

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in-0 slide-in-from-top-1 duration-200 ease-out">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Raza */}
          <section className="space-y-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="text-amber-500" size={22} />
              Raza <span className="text-red-400 text-sm">*</span>
            </h3>

            {isLibre ? (
              <>
                <input
                  type="text"
                  maxLength={LIBRE_MAX}
                  value={libreRace}
                  onChange={e => setLibreRace(e.target.value)}
                  placeholder="Ej: Elfo de Luna, Humano variante..."
                  className={inputCls}
                />
                <p className={`text-right text-[10px] font-mono ${libreRace.length >= LIBRE_MAX ? "text-red-400" : "text-slate-700"}`}>
                  {libreRace.length}/{LIBRE_MAX}
                </p>
                {/* Subraza libre */}
                <input
                  type="text"
                  maxLength={LIBRE_MAX}
                  value={libreSubrace}
                  onChange={e => setLibreSubrace(e.target.value)}
                  placeholder="Subraza (opcional)"
                  className={inputCls}
                />
                <p className={`text-right text-[10px] font-mono ${libreSubrace.length >= LIBRE_MAX ? "text-red-400" : "text-slate-700"}`}>
                  {libreSubrace.length}/{LIBRE_MAX}
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {assets.races.length === 0
                    ? <p className="text-slate-500 text-sm text-center py-4">Sin razas para este sistema.</p>
                    : assets.races.map(asset => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          isSelected={raceAssetId === asset.id}
                          onSelect={() => setRaceAssetId(asset.id)}
                          type="race"
                        />
                      ))
                  }
                </div>

                {/* Subraza — only shown when the selected race has subraces */}
                {availSubraces.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Subraza de {selectedRace?.name}
                    </p>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {availSubraces.map(asset => (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          isSelected={subraceAssetId === asset.id}
                          onSelect={() => setSubraceAssetId(subraceAssetId === asset.id ? "" : asset.id)}
                          type="race"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Clase */}
          <section className="space-y-3">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sword className="text-indigo-500" size={22} />
              Clase <span className="text-red-400 text-sm">*</span>
            </h3>

            {isLibre ? (
              <>
                <input
                  type="text"
                  maxLength={LIBRE_MAX}
                  value={libreClass}
                  onChange={e => setLibreClass(e.target.value)}
                  placeholder="Ej: Guerrero, Mago de la Torre..."
                  className={inputCls}
                />
                <p className={`text-right text-[10px] font-mono ${libreClass.length >= LIBRE_MAX ? "text-red-400" : "text-slate-700"}`}>
                  {libreClass.length}/{LIBRE_MAX}
                </p>
              </>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {assets.classes.length === 0
                  ? <p className="text-slate-500 text-sm text-center py-4">Sin clases para este sistema.</p>
                  : assets.classes.map(asset => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        isSelected={classAssetId === asset.id}
                        onSelect={() => setClassAssetId(asset.id)}
                        type="class"
                      />
                    ))
                }
              </div>
            )}
          </section>

          {/* Subclase */}
          {isLibre ? (
            <section className="space-y-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sword className="text-violet-400" size={20} />
                Subclase
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 normal-case tracking-normal">opcional</span>
              </h3>
              <input
                type="text"
                maxLength={LIBRE_MAX}
                value={libreSubclass}
                onChange={e => setLibreSubclass(e.target.value)}
                placeholder="Ej: Camino del Berserker, Escuela de Evocación..."
                className={inputCls}
              />
              <p className={`text-right text-[10px] font-mono ${libreSubclass.length >= LIBRE_MAX ? "text-red-400" : "text-slate-700"}`}>
                {libreSubclass.length}/{LIBRE_MAX}
              </p>
            </section>
          ) : availSubclasses.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sword className="text-violet-400" size={20} />
                Subclase de {selectedClass?.name}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 normal-case tracking-normal">opcional</span>
              </h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {availSubclasses.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={subclassAssetId === asset.id}
                    onSelect={() => setSubclassAssetId(subclassAssetId === asset.id ? "" : asset.id)}
                    type="class"
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="w-full py-5 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xl uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-colors active:scale-[0.98] transition-transform disabled:opacity-50 group flex items-center justify-center gap-3"
          >
            {submitting ? (
              <Loader2 className="animate-spin" size={24} />
            ) : isEditMode ? (
              <><Save className="group-hover:translate-y-[-2px] transition-transform" size={22} /> Guardar Cambios</>
            ) : (
              <>Forjar Héroe <Save className="group-hover:translate-y-[-2px] transition-transform" size={22} /></>
            )}
          </button>

          <p className="text-center text-[10px] font-black uppercase tracking-tighter text-slate-700">
            {system} · {mode}
          </p>
        </div>
      </div>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspect={1}
          outputSize={400}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
};
