import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, User, Shield, Sword, ScrollText, Binary, Save, Sparkles, Upload, AlertCircle, Loader2 } from "lucide-react";
import { 
  createCharacter, 
  fetchAvailableAssets, 
  uploadCharacterPortrait,
  type Asset 
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
  ABILITY_SCORE_MAX
} from "@questmasters/dnd-rules";
import { resizeImageToWebP } from "../lib/resize-image";

export const CreateCharacter: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UI State ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- Data State ---
  const [, setCampaign] = useState<Campaign | null>(null);
  const [assets, setAssets] = useState<{
    races: Asset[];
    classes: Asset[];
    backgrounds: Asset[];
  }>({ races: [], classes: [], backgrounds: [] });

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: "",
    portraitUrl: "",
    raceAssetId: "",
    classAssetId: "",
    backgroundAssetId: "",
    stats: { ...DEFAULT_ABILITY_SCORES },
    backstory: "",
    method: (campaignId ? "point-buy" : "free") as "point-buy" | "free",
  });

  // --- Initialization ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (campaignId) {
          const campData = await fetchCampaign(campaignId);
          setCampaign(campData);
        }
        
        const assetsData = await fetchAvailableAssets({ campaignId });
        setAssets(assetsData);
      } catch (err: any) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [campaignId]);

  // --- Computed Stats ---
  const pbValidation = validatePointBuy(formData.stats);
  const selectedClass = assets.classes.find(c => c.id === formData.classAssetId);
  const hitDie = selectedClass?.data.hit_die || 10;
  const hpResult = calculateHitPoints(hitDie, formData.stats.constitution, 1);

  // --- Handlers ---
  const handleStatChange = (stat: keyof typeof DEFAULT_ABILITY_SCORES, newValue: number) => {
    if (formData.method === 'point-buy') {
      if (newValue < POINT_BUY_MIN_SCORE || newValue > POINT_BUY_MAX_SCORE) return;
    } else {
      if (newValue < ABILITY_SCORE_MIN || newValue > ABILITY_SCORE_MAX) return;
    }

    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats, [stat]: newValue }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const resizedBlob = await resizeImageToWebP(file, 400); // Smaller for character portraits
      const url = await uploadCharacterPortrait(resizedBlob);
      setFormData(prev => ({ ...prev, portraitUrl: url }));
    } catch (err: any) {
      setError(err.message || "Error al subir retrato");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.raceAssetId || !formData.classAssetId) {
      setError("Faltan campos obligatorios (Nombre, Raza, Clase)");
      return;
    }
    
    if (formData.method === 'point-buy' && !pbValidation.valid) {
      setError("Presupuesto de Point Buy excedido o inválido");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createCharacter({
        ...formData,
        campaignId,
        backgroundAssetId: formData.backgroundAssetId || undefined,
        backstory: formData.backstory || undefined,
        portraitUrl: formData.portraitUrl || undefined,
      });

      if (campaignId) {
        navigate(`/campaigns/${campaignId}`);
      } else {
        navigate(`/profile`); // Assuming profile lists characters
      }
    } catch (err: any) {
      setError(err.message || "Error al crear personaje");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Preparando forja de héroes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      {/* Navigation */}
      <Link
        to={campaignId ? `/campaigns/${campaignId}` : "/campaigns"}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Volver a {campaignId ? 'la campaña' : 'mis campañas'}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN: Identity & Stats */}
        <div className="flex-1 space-y-8">
          
          {/* Section: Identity */}
          <section className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl shadow-indigo-900/5">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Portrait Upload */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group shrink-0 ${
                  formData.portraitUrl 
                  ? 'border-indigo-500/50 bg-indigo-500/5' 
                  : 'border-slate-700 hover:border-indigo-500/40 bg-slate-900/30'
                }`}
              >
                {formData.portraitUrl ? (
                  <>
                    <img src={formData.portraitUrl} className="w-full h-full object-cover" alt="Héroe" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-[10px] font-bold flex items-center gap-1">
                        <Upload size={14} /> Cambiar
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full mb-2 transition-colors ${uploading ? 'bg-slate-800' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'}`}>
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <User size={24} />}
                    </div>
                    <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Retrato</p>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              {/* Basic Info Inputs */}
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-tighter text-indigo-400">Identidad del Héroe</h2>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del personaje..."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-transparent border-b-2 border-slate-700 focus:border-indigo-500 text-3xl font-black text-white focus:outline-none py-2 transition-colors placeholder:text-slate-700"
                  />
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">HP Iniciales</p>
                    <div className="bg-slate-900/60 px-4 py-2 rounded-xl border border-red-500/20 flex items-center gap-2">
                      <span className="text-xl font-black text-red-400">{hpResult.maxHp}</span>
                    </div>
                  </div>
                  {!campaignId && (
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Método de Stats</p>
                      <select 
                        value={formData.method}
                        onChange={(e) => setFormData(p => ({ ...p, method: e.target.value as any, stats: { ...DEFAULT_ABILITY_SCORES } }))}
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

          {/* Section: Stats */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Binary className="text-indigo-500" size={24} />
                Atributos Básicos
              </h3>
              {formData.method === 'point-buy' && (
                <div className={`px-4 py-1.5 rounded-full border-2 flex items-center gap-2 transition-all ${pbValidation.remaining >= 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
                  <Sparkles size={16} />
                  <span className="text-sm font-black">Puntos restantes: {pbValidation.remaining}</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(Object.keys(DEFAULT_ABILITY_SCORES) as (keyof typeof DEFAULT_ABILITY_SCORES)[]).map((key) => (
                <StatCounter
                  key={key}
                  label={key === 'strength' ? 'FUE' : key === 'dexterity' ? 'DES' : key === 'constitution' ? 'CON' : key === 'intelligence' ? 'INT' : key === 'wisdom' ? 'SAB' : 'CAR'}
                  value={formData.stats[key]}
                  onChange={(val) => handleStatChange(key, val)}
                  method={formData.method}
                  disabledPlus={formData.method === 'point-buy' && (formData.stats[key] >= POINT_BUY_MAX_SCORE || pbValidation.remaining <= 0)}
                  disabledMinus={formData.stats[key] <= (formData.method === 'point-buy' ? POINT_BUY_MIN_SCORE : ABILITY_SCORE_MIN)}
                />
              ))}
            </div>
          </section>

          {/* Section: Backstory (Optional) */}
          <section className="bg-slate-900/40 border border-slate-700/50 rounded-3xl p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-3">
              <ScrollText className="text-emerald-500" size={20} />
              Trasfondo e Historia
            </h3>
            
            <div className="space-y-4">
               <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Seleccionar Background</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assets.backgrounds.map(asset => (
                    <AssetCard 
                      key={asset.id} 
                      asset={asset} 
                      isSelected={formData.backgroundAssetId === asset.id}
                      onSelect={() => setFormData(p => ({ ...p, backgroundAssetId: asset.id }))}
                      type="background"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Historia Pesonaje</label>
                <textarea 
                  value={formData.backstory}
                  onChange={(e) => setFormData(p => ({ ...p, backstory: e.target.value }))}
                  placeholder="Escribe el origen de tu héroe..."
                  className="w-full h-32 bg-slate-950/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Selection (Race & Class) */}
        <div className="lg:w-[400px] space-y-8">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Section: Race Selection */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Shield className="text-amber-500" size={22} />
              Raza
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {assets.races.map(asset => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  isSelected={formData.raceAssetId === asset.id}
                  onSelect={() => setFormData(p => ({ ...p, raceAssetId: asset.id }))}
                  type="race"
                />
              ))}
            </div>
          </section>

          {/* Section: Class Selection */}
          <section className="space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-3">
              <Sword className="text-indigo-500" size={22} />
              Clase
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {assets.classes.map(asset => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  isSelected={formData.classAssetId === asset.id}
                  onSelect={() => setFormData(p => ({ ...p, classAssetId: asset.id }))}
                  type="class"
                />
              ))}
            </div>
          </section>

          {/* Create Button */}
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
                <Save className="group-hover:translate-y-[-2px] transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-[10px] font-black uppercase tracking-tighter text-slate-600">
            QuestMasters Character Forge v1.0
          </p>
        </div>

      </div>
    </div>
  );
};
