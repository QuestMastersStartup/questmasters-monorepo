import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCampaigns, type Campaign } from "../services/campaigns.api";
import { PlusCircle, Users, BookOpen, Clock } from "lucide-react";

export const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await fetchCampaigns();
        setCampaigns(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando campañas...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mis Campañas</h1>
          <p className="text-slate-400">Gestiona tus partidas y aventuras como Dungeon Master.</p>
        </div>
        <Link
          to="/campaigns/create"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
        >
          <PlusCircle size={20} />
          Nueva Campaña
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
          Error: {error}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <BookOpen className="text-slate-500" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tienes campañas aún</h3>
          <p className="text-slate-400 mb-6">
            Crea tu primera campaña para empezar a jugar con tus amigos.
          </p>
          <Link
            to="/campaigns/create"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Comienza una aventura <PlusCircle size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.id}`}
              className="group bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:bg-slate-800/60 flex flex-col"
            >
              <div className="h-40 bg-slate-900 relative">
                {campaign.coverImageUrl ? (
                  <img
                    src={campaign.coverImageUrl}
                    alt={campaign.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/40 to-slate-900">
                    <BookOpen size={48} className="text-indigo-500/20" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                    campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                  {campaign.name}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 flex-1">
                  {campaign.description || "Sin descripción disponible."}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-4">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>Jugadores</span>
                  </div>
                  <div className="flex items-center gap-1 uppercase tracking-tighter font-semibold">
                    <span>{campaign.system}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(campaign.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
