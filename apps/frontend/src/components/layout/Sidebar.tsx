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
  const { session, user, userProfile, signOut, isGuest } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background/95 backdrop-blur-xl flex flex-col">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-2xl font-cinzel font-bold gold-gradient text-shadow-glow">
          QuestMasters
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-6 overflow-y-auto">
        <nav className="flex flex-col gap-2">
          <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Collection
          </div>
          {isGuest ? (
            <NavItem to="/marketplace" icon={ShoppingBag} label="Explore" />
          ) : (
            <>
              <NavItem to="/campaigns" icon={Crown} label="Campaigns" />
              <NavItem to="/library" icon={Book} label="Library" />
              <NavItem to="/marketplace" icon={ShoppingBag} label="Marketplace" />
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-border bg-muted/20">
        {session ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-card/50 border border-border shadow-sm">
            <Link to="/profile" className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden border border-primary/30">
              {userProfile?.avatarUrl ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt={userProfile.username || 'Avatar'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-primary uppercase">
                   {(userProfile?.username || user?.email || 'QM')[0].toUpperCase()}
                </span>
              )}
            </Link>
            <Link to="/profile" className="flex flex-col flex-1 overflow-hidden hover:opacity-80 transition-opacity">
              <span className="text-sm font-medium truncate text-foreground">
                {userProfile?.username || user?.email?.split('@')[0] || 'Adventurer'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold opacity-80">
                {userProfile?.role || 'player'}
              </span>
            </Link>
            <button 
              onClick={signOut} 
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all shrink-0" 
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary/20 text-primary border border-primary/50 rounded-md hover:bg-primary/30 transition-all shadow-lg shadow-primary/10 font-cinzel font-bold"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
