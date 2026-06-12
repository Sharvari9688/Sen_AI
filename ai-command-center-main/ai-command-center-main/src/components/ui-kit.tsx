import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title, subtitle, icon, actions, className, children, padded = true,
}: {
  title?: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode;
  className?: string; children: ReactNode; padded?: boolean;
}) {
  return (
    <div className={cn("card-elevated overflow-hidden flex flex-col", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-semibold tracking-tight truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn("flex-1 min-h-0", padded && "p-5")}>{children}</div>
    </div>
  );
}

export function Badge({ tone = "default", children, className }: {
  tone?: "default" | "primary" | "critical" | "warning" | "positive" | "info" | "muted";
  children: ReactNode; className?: string;
}) {
  const tones = {
    default: "bg-surface-2 text-foreground border-border",
    primary: "bg-primary/15 text-primary-glow border-primary/30",
    critical: "bg-critical/15 text-critical border-critical/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    positive: "bg-positive/15 text-positive border-positive/30",
    info: "bg-info/15 text-info border-info/30",
    muted: "bg-muted text-muted-foreground border-border",
  } as const;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border font-mono uppercase tracking-wider",
      tones[tone], className,
    )}>
      {children}
    </span>
  );
}

export function Stat({ label, value, hint, accent = "primary" }: {
  label: string; value: string; hint?: string;
  accent?: "primary" | "critical" | "warning" | "positive" | "info";
}) {
  const colors = {
    primary: "text-primary-glow",
    critical: "text-critical",
    warning: "text-warning",
    positive: "text-positive",
    info: "text-info",
  } as const;
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tracking-tight", colors[accent])}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
