import { Link, useLocation } from "react-router-dom";
import { Book, ShoppingBag, Crown } from "lucide-react";
import { cn } from "../../lib/utils";

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

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-background/95 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <h1 className="text-2xl font-cinzel font-bold gold-gradient">
          QuestMasters
        </h1>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-6">
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
        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-card border border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">QM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Adventurer</span>
            <span className="text-xs text-muted-foreground">Free Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
