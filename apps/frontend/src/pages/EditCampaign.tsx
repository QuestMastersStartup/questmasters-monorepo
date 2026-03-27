import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { fetchCampaign, updateCampaign, uploadCampaignPortrait } from "../services/campaigns.api";
import { ArrowLeft, Save, AlertCircle, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { resizeImageToWebP } from "../lib/resize-image";

export const EditCampaign: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImageUrl: "" as string | null,
  });

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return;
      try {
        const campaign = await fetchCampaign(id);
        setFormData({
          name: campaign.name,
          description: campaign.description,
          coverImageUrl: campaign.coverImageUrl,
        });
      } catch (err: any) {
        setError("Error al cargar la campaña: " + err.message);
      } finally {
        setFetching(false);
      }
    };
    loadCampaign();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const resizedBlob = await resizeImageToWebP(file, 800);
      const portraitUrl = await uploadCampaignPortrait(resizedBlob);
      setFormData({ ...formData, coverImageUrl: portraitUrl });
    } catch (err: any) {
      setError(err.message || "Error al subir la imagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || !id) return;
    
    setLoading(true);
    setError(null);

    try {
      const payload = { ...formData };
      // Allow null if empty string was pasted (to clear image)
      if (payload.coverImageUrl === "") payload.coverImageUrl = null;

      await updateCampaign(id, payload);
      navigate(`/campaigns/${id}`);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la campaña");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <Link
        to={`/campaigns/${id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Volver a detalles
      </Link>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 md:p-10 backdrop-blur-sm shadow-xl shadow-indigo-900/10 transition-all hover:bg-slate-800/60">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Editar Ajustes
          </h1>
          <p className="text-slate-400">Modifica los detalles generales de tu campaña.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-8 animate-shake">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label className="text-sm font-semibold text-slate-300 ml-1 block group-focus-within:text-indigo-400 transition-colors">
              Nombre de la Campaña
            </label>
            <input
              type="text"
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              placeholder="Ej: Las Crónicas de Icewind Dale"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-sm font-semibold text-slate-300 ml-1 block group-focus-within:text-indigo-400 transition-colors">
              Descripción
            </label>
            <textarea
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none h-32"
              placeholder="Resume de qué tratará la aventura..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-2">
            <label className="text-sm font-semibold text-slate-300 ml-1 block">
              Imagen de Portada (Opcional)
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden group ${
                  formData.coverImageUrl 
                  ? 'border-indigo-500/50 bg-indigo-500/5' 
                  : 'border-slate-700 hover:border-indigo-500/40 bg-slate-900/30'
                }`}
              >
                {formData.coverImageUrl ? (
                  <>
                    <img src={formData.coverImageUrl} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-sm font-bold flex items-center gap-2">
                        <Upload size={18} /> Cambiar Foto
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`p-3 rounded-full mb-3 transition-colors ${uploading ? 'bg-slate-800' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'}`}>
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload size={24} />}
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subir Imagen</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>

              <div className="flex flex-col justify-center gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <ImageIcon size={16} />
                  </div>
                  <input
                    type="url"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    placeholder="O pega una URL directa..."
                    value={formData.coverImageUrl || ""}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  />
                </div>
                {formData.coverImageUrl && (
                   <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImageUrl: null })}
                    className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-tighter text-left ml-1"
                   >
                     Quitar Imagen
                   </button>
                )}
                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                  Recomendado: 800px o superior. Se aplicará optimización automática (WebP) al subir.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando cambios...
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
