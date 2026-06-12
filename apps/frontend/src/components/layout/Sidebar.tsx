import { Link, useLocation } from "react-router-dom";
import { Book, ShoppingBag, Crown, LogOut, LogIn, Swords, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { isTesisMode, getTesisUser } from "../../lib/tesis-auth";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
        "hover:bg-accent/60 hover:text-foreground",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground",
      )}
    >
      {/* Indicador de ruta activa — borde izquierdo */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.6)]" />
      )}
      <Icon
        className={cn(
          "w-5 h-5 shrink-0 transition-all duration-200",
          isActive && "drop-shadow-[0_0_5px_hsl(var(--primary)/0.5)]",
        )}
      />
      <span className={cn("font-medium text-sm", isActive && "font-semibold")}>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { isAuthenticated, user, userProfile, signOut, isGuest } = useAuth();
  const tesisUser = isTesisMode() ? getTesisUser() : null;
  const displayEmail = user?.email ?? tesisUser?.email ?? '';

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background/95 backdrop-blur-xl flex flex-col">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-2xl font-cinzel font-bold gold-gradient text-shadow-glow">
          QuestMasters
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2 overflow-y-auto">
        <nav className="flex flex-col gap-1">
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            Navigation
          </p>
          {isGuest ? (
            <NavItem to="/marketplace" icon={ShoppingBag} label="Explore" />
          ) : (
            <>
              <NavItem to="/campaigns" icon={Crown} label="Campaigns" />
              <NavItem to="/characters" icon={Swords} label="My Characters" />
              <NavItem to="/dm-sessions" icon={Sparkles} label="DM IA" />
              <NavItem to="/library" icon={Book} label="Library" />
              <NavItem to="/marketplace" icon={ShoppingBag} label="Marketplace" />
            </>
          )}
        </nav>
      </div>

      <div className="p-3 border-t border-border bg-muted/10">
        {isAuthenticated ? (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card/60 border border-border/60 shadow-sm hover:border-primary/30 transition-colors group">
            <Link
              to="/profile"
              className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-primary/40 transition-all overflow-hidden border border-primary/30"
            >
              {userProfile?.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.username || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary uppercase">
                  {(userProfile?.username || displayEmail || 'QM')[0].toUpperCase()}
                </span>
              )}
            </Link>
            <Link to="/profile" className="flex flex-col flex-1 overflow-hidden min-w-0">
              <span className="text-sm font-semibold truncate text-foreground leading-tight">
                {userProfile?.username || displayEmail.split('@')[0] || 'Adventurer'}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-primary/70 font-bold mt-0.5">
                {userProfile?.role || 'player'}
              </span>
            </Link>
            <button
              onClick={signOut}
              className="p-1.5 text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 hover:border-primary/70 transition-all shadow-lg shadow-primary/10 font-cinzel font-bold"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
