import React from "react";
import { Plus, Minus } from "lucide-react";
import { calculateModifier, calculatePointBuyCost } from "@questmasters/dnd-rules";

interface StatCounterProps {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  method: 'point-buy' | 'free';
  disabledPlus?: boolean;
  disabledMinus?: boolean;
}

export const StatCounter: React.FC<StatCounterProps> = ({
  label,
  value,
  onChange,
  method,
  disabledPlus,
  disabledMinus,
}) => {
  const modifier = calculateModifier(value);
  const cost = method === 'point-buy' ? calculatePointBuyCost(value) : null;

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all hover:bg-slate-900/60 group">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-indigo-400 transition-colors">
        {label}
      </span>
      
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={disabledMinus}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500/20 disabled:opacity-20 transition-all active:scale-90"
        >
          <Minus size={16} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-white">{value}</span>
          <span className={`text-xs font-bold ${modifier >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabledPlus}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-emerald-500/20 disabled:opacity-20 transition-all active:scale-90"
        >
          <Plus size={16} />
        </button>
      </div>

      {method === 'point-buy' && (
        <span className="text-[10px] font-bold text-slate-600">
          Costo: <span className="text-amber-500">{cost} pts</span>
        </span>
      )}
    </div>
  );
};
