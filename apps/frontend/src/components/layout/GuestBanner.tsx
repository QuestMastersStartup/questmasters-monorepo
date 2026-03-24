import { Link } from "react-router-dom";
import { Search, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function GuestBanner() {
  const { isGuest } = useAuth();

  if (!isGuest) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/30 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Search className="w-32 h-32 rotate-12" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-cinzel font-bold text-primary flex items-center gap-2">
            <Search className="w-5 h-5" />
            Explorando QuestMasters
          </h3>
          <p className="text-muted-foreground max-w-xl">
            Estás en modo vista previa. Regístrate para crear tus propios packs, 
            coleccionar contenido de la comunidad y unirte a próximas partidas.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/register" 
            className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Cuenta</span>
          </Link>
          <Link 
            to="/login" 
            className="btn btn-outline gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
