import React from "react";
import { CheckCircle2, Shield, Sword, ScrollText } from "lucide-react";
import { type Asset } from "../../../services/characters.api";

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  type: 'race' | 'class' | 'background';
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  onSelect,
  type,
}) => {
  const Icon = type === 'race' ? Shield : type === 'class' ? Sword : ScrollText;
  const traits = asset.data.traits || [];
  const hitDie = asset.data.hit_die;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 h-full ${
        isSelected
          ? "bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]"
          : "bg-slate-900/40 border-slate-700/50 hover:bg-slate-900/60 hover:border-slate-600 active:scale-[0.98]"
      }`}
    >
      <div className={`p-3 rounded-xl flex-shrink-0 ${isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500"}`}>
        <Icon size={24} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-black text-white truncate text-lg pr-6">
            {asset.name}
          </h4>
          {isSelected && (
            <CheckCircle2 size={18} className="text-indigo-400 absolute top-4 right-4" />
          )}
        </div>
        
        {hitDie && (
          <p className="text-[10px] font-black uppercase tracking-tighter text-indigo-400 mb-2">
            Dado de Golpe: d{hitDie}
          </p>
        )}

        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {traits.slice(0, 3).map((trait: any, idx: number) => (
              <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                {trait.name || trait}
              </span>
            ))}
            {traits.length > 3 && (
              <span className="text-[9px] font-bold text-slate-600">
                +{traits.length - 3} más
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
