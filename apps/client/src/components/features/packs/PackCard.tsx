import type { Pack } from "../../../services/api";
import { BadgeCheck, Download, Scroll, Shield } from "lucide-react";

import { Link } from "react-router-dom";

interface PackCardProps {
  pack: Pack;
}

export function PackCard({ pack }: PackCardProps) {
  return (
    <Link to={`/library/${pack.slug}`} className="block">
      <div className="card group hover-glow bg-card/50 backdrop-blur-sm border-border transition-all duration-300 h-full">
        <div className="relative h-32 w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Shield className="w-24 h-24 rotate-12" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <span className="badge bg-background/80 backdrop-blur text-xs border-primary/30 text-primary uppercase tracking-wider">
              {pack.system.replace("dnd-", "D&D ").toUpperCase()}
            </span>
            {pack.type === "srd" && (
              <span className="badge bg-amber-500/20 text-amber-500 border-amber-500/50 gap-1">
                <BadgeCheck className="w-3 h-3" /> Official
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xl font-cinzel font-bold group-hover:text-primary transition-colors">
              {pack.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">
              {pack.description}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Scroll className="w-3 h-3" />
              <span>v{pack.version}</span>
            </div>
            <button className="btn btn-ghost btn-sm gap-2 text-primary hover:bg-primary/10">
              <Download className="w-4 h-4" />
              Install
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
