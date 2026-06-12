import { Link, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import {
  LayoutDashboard, Inbox, Bot, BookOpen, Globe2, BarChart3, Users,
  Search, Bell, Settings, Sparkles, CircleDot, Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Mission Control", icon: LayoutDashboard },
  { to: "/inbox", label: "AI Inbox", icon: Inbox, badge: 42 },
  { to: "/knowledge", label: "Knowledge & RAG", icon: BookOpen },
];

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/60 backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-[0_0_20px_oklch(0.555_0.22_277/0.5)]">
              <Sparkles className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">SenAI</span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Agentic CRM</span>
          </div>
          <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono bg-primary/15 text-primary-glow border border-primary/25">v4.2</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Workspace</div>
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}
                className={cn(
                  "group flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all relative",
                  active
                    ? "bg-sidebar-accent text-foreground shadow-[inset_0_0_0_1px_oklch(0.555_0.22_277/0.3)]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary-glow" />}
                <Icon className={cn("w-4 h-4", active ? "text-primary-glow" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-critical/15 text-critical">{item.badge}</span>
                )}
              </Link>
            );
          })}

          <div className="px-2 mt-6 mb-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">System</div>
          <div className="px-3 py-2.5 rounded-md bg-sidebar-accent/40 border border-sidebar-border space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <CircleDot className="w-3 h-3 text-positive pulse-dot" />
              <span className="text-foreground/90">All systems operational</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>RAG</span><span className="text-positive">42ms</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>Agents</span><span className="text-positive">48/52</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>Queue</span><span className="text-warning">412ms</span>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-sidebar-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-info to-primary grid place-items-center text-[11px] font-semibold">EM</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Elena Morales</div>
            <div className="text-[10px] text-muted-foreground truncate">AI Ops Lead</div>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="lg:hidden flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-glow" />
            <span className="font-semibold">SenAI</span>
          </div>

          <div className="hidden md:flex relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search emails, threads, agents, customers…"
              className="w-full bg-surface/60 border border-border rounded-md pl-9 pr-16 h-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border border-border">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-2.5 h-9 rounded-md bg-surface/60 border border-border">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-positive opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-positive" />
              </span>
              <span className="text-xs font-mono text-foreground/80">8 agents active</span>
            </div>
            <button className="relative w-9 h-9 grid place-items-center rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-critical" />
            </button>
            <div className="w-px h-6 bg-border mx-1" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-info to-primary grid place-items-center text-[11px] font-semibold">EM</div>
          </div>
        </header>

        {/* Page header */}
        {(title || actions) && (
          <div className="px-6 lg:px-8 pt-8 pb-6 border-b border-border/60 bg-gradient-to-b from-background to-transparent">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">{title}</h1>}
                {subtitle && <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
