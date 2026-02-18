import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && (
            <div className="text-primary">{icon}</div>
          )}
          <span className="text-sm font-semibold">{title}</span>
          {badge !== undefined && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}
