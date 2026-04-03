import React, { useEffect, useState } from "react";
import { X, Package, Search, Loader2, Check, Plus, Trash2, ShieldCheck } from "lucide-react";
import { fetchPacks, type Pack } from "../../../services/api";
import { installPacks, uninstallPacks, type Campaign } from "../../../services/campaigns.api";

interface ManagePacksModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedCampaign: Campaign) => void;
}

export const ManagePacksModal: React.FC<ManagePacksModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadPacks = async () => {
        try {
          const allPacks = await fetchPacks();
          setPacks(allPacks);
        } catch (err) {
          console.error("Failed to load packs:", err);
        } finally {
          setLoading(false);
        }
      };
      loadPacks();
    }
  }, [isOpen]);

  const isInstalled = (packId: string) => campaign.installedPackIds.includes(packId);

  const handleTogglePack = async (packId: string) => {
    setProcessingId(packId);
    try {
      let updated: Campaign;
      if (isInstalled(packId)) {
        updated = await uninstallPacks(campaign.id, [packId]);
      } else {
        updated = await installPacks(campaign.id, [packId]);
      }
      onUpdated(updated);
    } catch (err: any) {
      alert("Error al gestionar pack: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredPacks = packs.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.system.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate compatible packs from others
  const compatiblePacks = filteredPacks.filter(p => p.system === campaign.system || p.system === "universal");
  const otherPacks = filteredPacks.filter(p => p.system !== campaign.system && p.system !== "universal");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <Package className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Gestionar Packs</h2>
              <p className="text-slate-500 text-sm font-medium">Instala o remueve contenido para tu aventura</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <label htmlFor="pack-search" className="sr-only">Buscar packs</label>
            <input
              id="pack-search"
              name="pack-search"
              type="text"
              placeholder="Buscar por nombre o sistema..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-slate-400 font-medium">Cargando biblioteca de packs...</p>
            </div>
          ) : (
            <>
              {compatiblePacks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-black tracking-widest text-indigo-400 flex items-center gap-2">
                    <ShieldCheck size={14} /> Recomendados para {campaign.system}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {compatiblePacks.map((pack) => (
                      <PackItem 
                        key={pack.id} 
                        pack={pack} 
                        installed={isInstalled(pack.id)}
                        processing={processingId === pack.id}
                        onToggle={() => handleTogglePack(pack.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {otherPacks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-black tracking-widest text-slate-500">
                    Otros Sistemas
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {otherPacks.map((pack) => (
                      <PackItem 
                        key={pack.id} 
                        pack={pack} 
                        installed={isInstalled(pack.id)}
                        processing={processingId === pack.id}
                        onToggle={() => handleTogglePack(pack.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredPacks.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-800 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron packs que coincidan con tu búsqueda.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/50 p-4 border-t border-slate-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
          <span className="text-slate-600">QuestMasters Content Sync</span>
          <span className="text-indigo-500">{campaign.installedPackIds.length} packs activos</span>
        </div>
      </div>
    </div>
  );
};

interface PackItemProps {
  pack: Pack;
  installed: boolean;
  processing: boolean;
  onToggle: () => void;
}

const PackItem: React.FC<PackItemProps> = ({ pack, installed, processing, onToggle }) => {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
      installed 
        ? "bg-slate-800/40 border-indigo-500/30 shadow-lg shadow-indigo-900/5" 
        : "bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/20"
    }`}>
      <div className="flex items-center gap-4 truncate">
        <div className={`p-3 rounded-xl flex-shrink-0 ${
          installed ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
        }`}>
          {installed ? <Check size={20} /> : <Package size={20} />}
        </div>
        <div className="truncate">
          <h4 className="text-white font-bold truncate">{pack.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {pack.system}
            </span>
            <span className="text-slate-500 text-xs truncate">por {pack.author}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={processing}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
          installed
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
            : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-600/20"
        } disabled:opacity-50`}
      >
        {processing ? (
          <Loader2 size={14} className="animate-spin" />
        ) : installed ? (
          <>
            <Trash2 size={14} /> Desinstalar
          </>
        ) : (
          <>
            <Plus size={14} /> Instalar
          </>
        )}
      </button>
    </div>
  );
};
