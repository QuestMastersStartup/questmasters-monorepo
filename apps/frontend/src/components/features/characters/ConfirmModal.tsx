import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmColor?: "red" | "amber" | "indigo";
  isOpen: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const colorClasses = {
  red: "bg-red-600 hover:bg-red-500 shadow-red-600/20",
  amber: "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20",
  indigo: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20",
};

const iconColorClasses = {
  red: "bg-red-500/20 text-red-400",
  amber: "bg-amber-500/20 text-amber-400",
  indigo: "bg-indigo-500/20 text-indigo-400",
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  description,
  confirmLabel = "Confirmar",
  confirmColor = "red",
  isOpen,
  loading,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onCancel}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        role="button"
        tabIndex={-1}
        aria-label="Cerrar"
      />
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${iconColorClasses[confirmColor]}`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-black text-white">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="text-slate-400" size={18} />
            </button>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-6 pl-1">
            {description}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${colorClasses[confirmColor]}`}
            >
              {loading ? "Procesando..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
