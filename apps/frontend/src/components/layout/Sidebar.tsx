import { Link, useLocation } from "react-router-dom";
import { Book, ShoppingBag, Crown, LogOut, LogIn } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

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
        "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary/20 text-primary border border-primary/50"
          : "text-muted-foreground",
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { session, user, userProfile, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background/95 backdrop-blur-xl flex flex-col">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-2xl font-cinzel font-bold gold-gradient">
          QuestMasters
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-6 overflow-y-auto">
        <nav className="flex flex-col gap-2">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Collection
          </div>
          <NavItem to="/library" icon={Book} label="Library" />
          <NavItem to="/marketplace" icon={ShoppingBag} label="Marketplace" />
          <NavItem to="/workshop" icon={Crown} label="Workshop" />
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        {session ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border border-border">
            <Link to="/profile" className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/50 transition-all">
              <span className="text-xs font-bold text-primary uppercase">
                 {(userProfile?.username || user?.email || 'QM')[0].toUpperCase()}
              </span>
            </Link>
            <Link to="/profile" className="flex flex-col flex-1 overflow-hidden hover:opacity-80 transition-opacity">
              <span className="text-sm font-medium truncate">{userProfile?.username || user?.email || 'Adventurer'}</span>
              <span className="text-xs text-muted-foreground">{userProfile?.role || 'player'}</span>
            </Link>
            <button onClick={signOut} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors shrink-0" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-colors">
            <LogIn className="w-4 h-4" />
            <span className="font-medium">Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
