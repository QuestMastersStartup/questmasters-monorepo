import React from "react";
import { Sword, Shield, Heart, Skull, Armchair, Pencil, Trash2 } from "lucide-react";
import type { Character } from "../../../services/characters.api";

interface CharacterCardProps {
  character: Character;
  isDM: boolean;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (newStatus: 'dead' | 'retired') => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isDM,
  isOwner,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isDead = character.status === "dead";
  const isRetired = character.status === "retired";
  const isInactive = isDead || isRetired;

  return (
    <div
      className={`relative group rounded-2xl border overflow-hidden transition-all duration-300 ${
        isDead
          ? "border-red-500/30 bg-slate-900/60"
          : isRetired
          ? "border-amber-500/30 bg-slate-900/60"
          : "border-slate-700/50 bg-slate-900/40 hover:bg-slate-900/60 hover:border-indigo-500/30"
      }`}
    >
      {/* Inactive overlay */}
      {isInactive && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className={`absolute inset-0 ${
              isDead ? "bg-red-950/40" : "bg-amber-950/30"
            }`}
          />
        </div>
      )}

      <div className="flex p-4 gap-4">
        {/* Portrait */}
        <div
          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 ${
            isDead
              ? "border-red-500/40 grayscale"
              : isRetired
              ? "border-amber-500/40 sepia"
              : "border-slate-700"
          }`}
        >
          {character.portraitUrl ? (
            <img
              src={character.portraitUrl}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <Shield className="text-slate-600" size={24} />
            </div>
          )}

          {/* Status badge */}
          {isInactive && (
            <div
              className={`absolute -bottom-0.5 inset-x-0 text-center py-0.5 text-[8px] font-black uppercase tracking-widest ${
                isDead
                  ? "bg-red-600 text-white"
                  : "bg-amber-600 text-white"
              }`}
            >
              {isDead ? "Muerto" : "Retirado"}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black text-lg truncate leading-tight">
            {character.name}
          </h4>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {character.raceName && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {character.raceName}
              </span>
            )}
            {character.className && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {character.className}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1 text-slate-400">
              <Sword size={12} className="text-indigo-400" />
              <span className="font-bold">Nv. {character.level}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Heart size={12} className="text-red-400" />
              <span className="font-bold">{character.hitPoints} HP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (visible on hover) */}
      {(isOwner || isDM) && (
        <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* DM status actions */}
          {isDM && character.status === "active" && onStatusChange && (
            <>
              <button
                onClick={() => onStatusChange("dead")}
                title="Matar personaje"
                className="p-1.5 rounded-lg bg-slate-800/90 text-red-400 hover:bg-red-500/20 border border-slate-700 transition-all"
              >
                <Skull size={14} />
              </button>
              <button
                onClick={() => onStatusChange("retired")}
                title="Retirar personaje"
                className="p-1.5 rounded-lg bg-slate-800/90 text-amber-400 hover:bg-amber-500/20 border border-slate-700 transition-all"
              >
                <Armchair size={14} />
              </button>
            </>
          )}
          <button
            onClick={onEdit}
            title="Editar personaje"
            className="p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-white hover:bg-indigo-500/20 border border-slate-700 transition-all"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            title="Eliminar personaje"
            className="p-1.5 rounded-lg bg-slate-800/90 text-slate-400 hover:text-red-400 hover:bg-red-500/20 border border-slate-700 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
