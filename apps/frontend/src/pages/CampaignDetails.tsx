import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchCampaign,
  deleteCampaign,
  changeCampaignStatus,
  fetchMembers,
  invitePlayer,
  removeMember,
  type Campaign,
  type CampaignMember,
} from "../services/campaigns.api";
import {
  fetchCharacters,
  deleteCharacter,
  updateCharacter,
  type Character,
} from "../services/characters.api";
import { fetchPacks, type Pack } from "../services/api";
import {
  ArrowLeft,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  Package,
  Users,
  Settings,
  BookOpen,
  Loader2,
  UserPlus,
  X,
  ShieldAlert,
  Swords,
  Plus,
} from "lucide-react";
import { UserSearch } from "../components/features/campaigns/UserSearch";
import { MemberCard } from "../components/features/campaigns/MemberCard";
import { ManagePacksModal } from "../components/features/campaigns/ManagePacksModal";
import { CharacterCard } from "../components/features/characters/CharacterCard";
import { ConfirmModal } from "../components/features/characters/ConfirmModal";
import { supabase } from "../lib/supabase";

export const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: 'red' | 'amber';
    action: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setCurrentUserId(data.user?.id || null));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const [campaignData, packsData, membersData] = await Promise.all([
          fetchCampaign(id),
          fetchPacks(),
          fetchMembers(id),
        ]);
        setCampaign(campaignData);
        setPacks(packsData);
        setMembers(membersData);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      // Character fetch is non-fatal — falls back to [] if table missing (pending migrations)
      try {
        const charsData = await fetchCharacters({ campaignId: id });
        setCharacters(charsData);
      } catch (err: any) {
        console.error('[CampaignDetails] Characters load failed:', err.message);
        setCharacters([]);
      }
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (
      !id ||
      !window.confirm(
        "¿Estás seguro de que quieres eliminar esta campaña? Esta acción no se puede deshacer.",
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteCampaign(id);
      navigate("/campaigns");
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async () => {
    if (!campaign || !id) return;
    const nextStatus = campaign.status === "active" ? "paused" : "active";
    try {
      const updated = await changeCampaignStatus(id, nextStatus);
      setCampaign(updated);
    } catch (err: any) {
      alert("Error al cambiar estado: " + err.message);
    }
  };

  const handleInvite = async (user: { id: string; username: string }) => {
    if (!id) return;
    try {
      const newMember = await invitePlayer(id, user.id);
      setMembers((prev) => [...prev, newMember]);
      setShowInviteModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !window.confirm("¿Eliminar a este jugador de la campaña?"))
      return;
    try {
      await removeMember(id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePacksUpdated = (updatedCampaign: Campaign) => {
    setCampaign(updatedCampaign);
  };

  const handleDeleteCharacter = (char: Character) => {
    setConfirmModal({
      isOpen: true,
      title: "Eliminar Personaje",
      description: `¿Estás seguro de que quieres eliminar a "${char.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
      confirmColor: "red",
      action: async () => {
        await deleteCharacter(char.id);
        setCharacters((prev) => prev.filter((c) => c.id !== char.id));
      },
    });
  };

  const handleStatusChange = (char: Character, newStatus: 'dead' | 'retired') => {
    const labels = { dead: 'Matar', retired: 'Retirar' };
    const descs = {
      dead: `¿Matar a "${char.name}"? Los personajes muertos no pueden volver a activarse.`,
      retired: `¿Retirar a "${char.name}"? Los personajes retirados no pueden volver a activarse.`,
    };
    setConfirmModal({
      isOpen: true,
      title: `${labels[newStatus]} Personaje`,
      description: descs[newStatus],
      confirmLabel: labels[newStatus],
      confirmColor: newStatus === 'dead' ? 'red' : 'amber',
      action: async () => {
        const updated = await updateCharacter(char.id, { status: newStatus });
        setCharacters((prev) => prev.map((c) => (c.id === char.id ? updated : c)));
      },
    });
  };

  const executeConfirm = async () => {
    if (!confirmModal) return;
    setConfirmLoading(true);
    try {
      await confirmModal.action();
      setConfirmModal(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Cargando aventura...</p>
      </div>
    );

  if (!campaign)
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl text-white mb-4">Campaña no encontrada</h1>
        <Link to="/campaigns" className="text-indigo-400">
          Volver a mis campañas
        </Link>
      </div>
    );

  const isDM = currentUserId === campaign.dmId;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      {/* Header with Navigation and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>

        {isDM && (
          <div className="flex gap-3">
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                campaign.status === "active"
                  ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
              }`}
            >
              {campaign.status === "active" ? (
                <>
                  <Pause size={18} /> Pausar
                </>
              ) : (
                <>
                  <Play size={18} /> Reanudar
                </>
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-lg font-medium transition-all"
            >
              <Trash2 size={18} />
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/10 backdrop-blur-sm mb-8">
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          {campaign.coverImageUrl ? (
            <img
              src={campaign.coverImageUrl}
              alt={campaign.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-slate-900 to-slate-900" />
          )}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
                    {campaign.system}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      campaign.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                  {campaign.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                  Acerca de la Campaña
                </h3>
                <p className="text-slate-400 leading-relaxed whitespace-pre-line text-lg">
                  {campaign.description ||
                    "Esta aventura aún no tiene una descripción detallada."}
                </p>
              </section>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center group hover:bg-slate-900/60 transition-colors">
                  <Users className="text-indigo-400 mb-2" size={24} />
                  <span className="text-white font-bold text-2xl">
                    {members.filter((m) => m.role === "player").length}
                  </span>
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                    Jugadores
                  </span>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center group hover:bg-slate-900/60 transition-colors">
                  <Package className="text-amber-400 mb-2" size={24} />
                  <span className="text-white font-bold text-2xl">
                    {campaign.installedPackIds.length}
                  </span>
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                    Packs Instalados
                  </span>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center text-center group hover:bg-slate-900/60 transition-colors">
                  <BookOpen className="text-emerald-400 mb-2" size={24} />
                  <span className="text-white font-bold text-2xl">0</span>
                  <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                    Sesiones
                  </span>
                </div>
              </div>

              {/* Members Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                    Aventureros
                  </h3>
                  {isDM && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
                    >
                      <UserPlus size={16} />
                      Invitar jugador
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {members.map((member) => (
                    <MemberCard
                      key={member.userId}
                      id={member.userId}
                      username={member.user?.username || "Unknown"}
                      avatarUrl={member.user?.avatarUrl}
                      role={member.role}
                      joinedAt={member.joinedAt}
                      isDM={isDM}
                      onRemove={() => handleRemoveMember(member.userId)}
                    />
                  ))}
                  {members.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800">
                      <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">
                        Aún no hay aventureros en esta campaña.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Characters Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                    <Swords size={20} className="text-amber-400" />
                    Personajes
                  </h3>
                  {currentUserId && (
                    <Link
                      to={`/campaigns/${campaign.id}/characters/create`}
                      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-amber-600/20 text-sm"
                    >
                      <Plus size={16} />
                      Crear Personaje
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      isDM={isDM}
                      isOwner={currentUserId === char.userId}
                      onEdit={() => navigate(`/campaigns/${campaign.id}/characters/${char.id}/edit`)}
                      onDelete={() => handleDeleteCharacter(char)}
                      onStatusChange={(status) => handleStatusChange(char, status)}
                    />
                  ))}
                  {characters.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-800">
                      <Swords className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">
                        Aún no hay personajes en esta campaña.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Side Column */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 underline decoration-indigo-500 decoration-2 underline-offset-4">
                  <Settings size={18} />
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <Link
                    to={`/campaigns/${campaign.id}/vtt`}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Abrir VTT
                  </Link>
                  <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-all">
                    Gestionar Jugadores
                  </button>
                  {isDM && (
                    <Link
                      to={`/campaigns/${campaign.id}/edit`}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-all"
                    >
                      Ajustes de Campaña
                    </Link>
                  )}
                  {isDM && campaign.status !== "completed" && (
                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            "¿Marcar campaña como completada? Esto es permanente.",
                          )
                        ) {
                          try {
                            const updated = await changeCampaignStatus(
                              campaign.id,
                              "completed",
                            );
                            setCampaign(updated);
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 font-bold py-3 rounded-xl border border-emerald-500/20 transition-all mt-6"
                    >
                      <CheckCircle size={18} /> Finalizar Campaña
                    </button>
                  )}
                </div>
              </div>

              {/* Active Packs */}
              <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/50">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2 underline decoration-amber-500 decoration-2 underline-offset-4">
                  <Package size={18} />
                  Packs Activos
                </h3>
                {campaign.installedPackIds.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    No hay packs instalados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {campaign.installedPackIds.slice(0, 5).map((id) => {
                      const pack = packs.find((p) => p.id === id);
                      return (
                        <div
                          key={id}
                          className="text-slate-400 text-sm flex items-center gap-2 truncate bg-slate-900/60 p-3 rounded-xl border border-slate-700/30"
                        >
                          <CheckCircle
                            size={14}
                            className="text-emerald-500 flex-shrink-0"
                          />
                          <span className="truncate font-medium">
                            {pack?.name || `Pack ${id.slice(0, 8)}`}
                          </span>
                        </div>
                      );
                    })}
                    {campaign.installedPackIds.length > 5 && (
                      <p className="text-indigo-400 text-xs font-bold pl-2 pt-1">
                        + {campaign.installedPackIds.length - 5} packs
                        adicionales
                      </p>
                    )}
                    {isDM && (
                      <button 
                        onClick={() => setShowPacksModal(true)}
                        className="w-full text-center py-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2 transition-colors"
                      >
                        Gestionar Packs
                      </button>
                    )}
                  </div>
                )}

                {campaign.installedPackIds.length === 0 && isDM && (
                  <button 
                    onClick={() => setShowPacksModal(true)}
                    className="w-full text-center py-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-widest mt-2 transition-colors"
                  >
                    Instalar Packs
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl">
                    <UserPlus className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      Recluta aventureros
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Busca jugadores para que se unan a tu historia
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="text-slate-400" />
                </button>
              </div>

              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mb-6 flex items-start gap-4">
                <ShieldAlert
                  className="text-indigo-400 mt-1 flex-shrink-0"
                  size={20}
                />
                <p className="text-indigo-300/80 text-xs leading-relaxed">
                  Solo puedes invitar a usuarios registrados en QuestMasters.
                  Los aventureros invitados tendrán acceso al VTT y a su diario
                  de campaña.
                </p>
              </div>

              <UserSearch
                onSelect={(user) => handleInvite(user)}
                excludeUserIds={members.map((m) => m.userId)}
              />
            </div>
            <div className="bg-slate-950/50 p-4 border-t border-slate-800 text-center">
              <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                QuestMasters Squad Management
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Manage Packs Modal */}
      {showPacksModal && campaign && (
        <ManagePacksModal
          campaign={campaign}
          isOpen={showPacksModal}
          onClose={() => setShowPacksModal(false)}
          onUpdated={handlePacksUpdated}
        />
      )}
      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          confirmColor={confirmModal.confirmColor}
          loading={confirmLoading}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};
