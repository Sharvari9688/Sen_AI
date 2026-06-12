import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge, Stat } from "@/components/ui-kit";
import {
  Mail, AlertOctagon, ArrowUpRight, CheckCircle2, Bot, Sparkles,
  TrendingUp, TrendingDown, Activity, Zap, ShieldAlert, Server,
  Database, Cpu, Globe2, Download, Filter, Loader2, SendHorizonal, X,
} from "lucide-react";
import {
  heroMetrics, activityFeed, priorityQueue, categories, sentimentBreakdown,
  sentimentTrend, escalationTrend, systemHealth, sampleIngestEmails,
} from "@/lib/mock-data";
import { prependThread } from "@/lib/inbox-store";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — SenAI" },
      { name: "description", content: "Live operations dashboard for AI-powered customer intelligence." },
    ],
  }),
  component: MissionControl,
});

const iconMap: Record<string, any> = { Mail, AlertOctagon, ArrowUpRight, CheckCircle2, Bot, Sparkles };

type IngestState = "idle" | "loading" | "success" | "error";

interface ToastMsg {
  id: number;
  type: "success" | "error";
  subject: string;
  company: string;
  category: string;
  urgency: string;
}

function MissionControl() {
  const [ingestState, setIngestState] = useState<IngestState>("idle");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const ingestIndexRef = useRef(0);

  // Form states for Simulated Email Ingest
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formSender, setFormSender] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  // Live API States
  const [metrics, setMetrics] = useState<any[]>(heroMetrics);
  const [sentimentTrendData, setSentimentTrendData] = useState<any[]>(sentimentTrend);
  const [categoriesData, setCategoriesData] = useState<any[]>(categories);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, trendRes, categoryRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/dashboard/stats"),
        fetch("http://127.0.0.1:8000/analytics/sentiment-trend"),
        fetch("http://127.0.0.1:8000/analytics/category-breakdown")
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        // Update metrics
        setMetrics([
          { label: "Emails Processed Today", value: ((stats.processed_today % 9) + 1).toString(), change: "+18.2%", trend: "up", icon: "Mail", accent: "primary" },
          { label: "Critical Incidents", value: ((stats.critical_incidents % 9) + 1).toString(), change: "-4", trend: "down", icon: "AlertOctagon", accent: "critical" },
          { label: "Escalated Threads", value: ((stats.escalated_threads % 9) + 1).toString(), change: "+12", trend: "up", icon: "ArrowUpRight", accent: "warning" },
          { label: "Auto Resolved", value: ((stats.auto_resolved % 9) + 1).toString(), change: "73.3%", trend: "up", icon: "CheckCircle2", accent: "positive" },
          { label: "Active AI Agents", value: "4 / 5", change: "92%", trend: "up", icon: "Bot", accent: "info" },
          { label: "Avg Confidence", value: Math.min(9.9, stats.avg_confidence * 10).toFixed(1) + "%", change: "+1.8%", trend: "up", icon: "Sparkles", accent: "primary" },
        ]);
      }

      if (trendRes.ok) {
        setSentimentTrendData(await trendRes.json());
      }

      if (categoryRes.ok) {
        setCategoriesData(await categoryRes.json());
      }
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh stats every 5 seconds to show new emails in action
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const simulateIngest = useCallback(async (senderVal: string, subjectVal: string, bodyVal: string) => {
    if (ingestState === "loading") return;
    setIngestState("loading");

    let finalSender = senderVal.trim();
    if (!finalSender.includes("@")) {
      const slug = finalSender.toLowerCase().replace(/[^a-z0-9]+/g, ".");
      finalSender = `${slug || "customer"}@example.com`;
    }

    try {
      // Perform real POST /api/ingest
      const ingestRes = await fetch("http://127.0.0.1:8000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: finalSender,
          subject: subjectVal.trim() || "(No Subject)",
          body: bodyVal.trim() || "(No Content)"
        })
      });

      if (!ingestRes.ok) throw new Error("Server ingest failed");
      const ingestData = await ingestRes.json();
      const jobId = ingestData.job_id;

      // Poll job status until completed
      let completed = false;
      let attempts = 0;
      while (!completed && attempts < 15) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 800));
        const statusRes = await fetch(`http://127.0.0.1:8000/api/status/${jobId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === "completed") {
            completed = true;
          } else if (statusData.status === "failed") {
            throw new Error("Pipeline task failed");
          }
        }
      }

      // Sync global store so threads list displays it
      import("@/lib/inbox-store").then((m) => m.syncThreads());
      // Refresh dashboard charts
      fetchDashboardData();

      setIngestState("success");
      const toastId = Date.now();
      const domainParts = finalSender.split("@")[1];
      const companyVal = domainParts ? domainParts.split(".")[0].toUpperCase() : "DEMO";
      setToasts((prev) => [
        {
          id: toastId,
          type: "success",
          subject: subjectVal,
          company: companyVal,
          category: "Processing",
          urgency: "P1",
        },
        ...prev,
      ]);
      setTimeout(() => dismissToast(toastId), 6000);
      setTimeout(() => setIngestState("idle"), 1800);
      setIsDialogOpen(false);
      setFormSender("");
      setFormSubject("");
      setFormBody("");
    } catch (err) {
      console.error(err);
      setIngestState("error");
      const toastId = Date.now();
      setToasts((prev) => [
        { id: toastId, type: "error", subject: "Ingest failed", company: "—", category: "—", urgency: "—" },
        ...prev,
      ]);
      setTimeout(() => dismissToast(toastId), 5000);
      setTimeout(() => setIngestState("idle"), 2000);
    }
  }, [ingestState, dismissToast]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulateIngest(formSender, formSubject, formBody);
  };

  return (
    <AppShell
      title="Mission Control"
      subtitle="Live operational view of every email, agent, and decision moving through the platform."
      actions={
        <>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/60 text-xs hover:bg-surface transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/60 text-xs hover:bg-surface transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          {/* ── Simulate Email Ingest ── */}
          <button
            id="simulate-ingest-btn"
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-md text-xs font-semibold text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] hover:opacity-90 transition-all cursor-pointer"
          >
            <SendHorizonal className="w-3.5 h-3.5" />
            Simulate Email Ingest
          </button>

          <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs font-medium text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] hover:opacity-90 transition-opacity">
            <Sparkles className="w-3.5 h-3.5" /> Run AI sweep
          </button>
        </>
      }
    >
      {/* Toast notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-xl animate-[slideUp_0.25s_ease-out]",
              t.type === "success"
                ? "bg-sidebar/90 border-positive/40"
                : "bg-sidebar/90 border-critical/40"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg grid place-items-center shrink-0",
              t.type === "success" ? "bg-positive/15" : "bg-critical/15"
            )}>
              {t.type === "success"
                ? <Mail className="w-4 h-4 text-positive" />
                : <AlertOctagon className="w-4 h-4 text-critical" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn("text-xs font-semibold", t.type === "success" ? "text-positive" : "text-critical")}>
                  {t.type === "success" ? "Email Ingested" : "Ingest Failed"}
                </span>
                {t.type === "success" && (
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold",
                    t.urgency === "P0" ? "bg-critical/15 text-critical" :
                    t.urgency === "P1" ? "bg-warning/15 text-warning" :
                    "bg-info/15 text-info"
                  )}>{t.urgency}</span>
                )}
              </div>
              <div className="text-[11px] font-medium text-foreground truncate">{t.subject}</div>
              {t.type === "success" && (
                <div className="text-[10px] text-muted-foreground mt-0.5">{t.company} · {t.category} · Now in AI Inbox ↗</div>
              )}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground p-0.5 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Hero metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {metrics.map((m, i) => {
            const Icon = iconMap[m.icon];
            const accentClass = (({
              primary: "text-primary-glow", critical: "text-critical",
              warning: "text-warning", positive: "text-positive", info: "text-info",
            } as Record<string, string>)[m.accent]) || "text-foreground";
            return (
              <div
                key={m.label}
                className="card-elevated p-4 relative overflow-hidden group hover:border-primary/40 transition-colors fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors blur-2xl" />
                <div className="flex items-center justify-between relative">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.label}</span>
                  <Icon className={cn("w-4 h-4", accentClass)} />
                </div>
                <div className="mt-2.5 text-2xl font-semibold tracking-tight tabular-nums">{m.value}</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {m.trend === "up" ? <TrendingUp className="w-3 h-3 text-positive" /> : <TrendingDown className="w-3 h-3 text-warning" />}
                  <span className="font-mono">{m.change}</span>
                  <span>vs yesterday</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row: Activity + Charts */}
        <div className="grid grid-cols-12 gap-6">
          <Panel
            className="col-span-12 xl:col-span-8"
            title="Sentiment trend"
            subtitle="Rolling 24h — positive vs negative vs critical"
            icon={<Activity className="w-4 h-4" />}
            actions={<Badge tone="positive">+8.2% positive</Badge>}
          >
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={sentimentTrendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPos" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gNeg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCrit" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                  <XAxis dataKey="hour" stroke="oklch(0.55 0.02 265)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.55 0.02 265)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} fill="url(#gPos)" />
                  <Area type="monotone" dataKey="negative" stroke="#f59e0b" strokeWidth={2} fill="url(#gNeg)" />
                  <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} fill="url(#gCrit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            className="col-span-12 xl:col-span-4"
            title="Priority queue"
            subtitle="Active threads awaiting action"
            icon={<Zap className="w-4 h-4" />}
          >
            <div className="space-y-3">
              {priorityQueue.map((p) => {
                const color = {
                  critical: "bg-critical", warning: "bg-warning",
                  info: "bg-info", positive: "bg-positive",
                }[p.color];
                return (
                  <div key={p.level} className="flex items-center gap-3 p-3 rounded-md bg-surface/60 border border-border/60 hover:border-primary/30 transition-colors">
                    <div className={cn("w-1 h-10 rounded-full", color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{p.level}</span>
                        <span className="text-base font-semibold tabular-nums">{p.count}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Activity feed full width */}
        <div className="grid grid-cols-12 gap-6">
          <Panel
            className="col-span-12 lg:col-span-7"
            title="Real-time activity feed"
            subtitle="Live stream from agents, classifiers, and security"
            icon={<Activity className="w-4 h-4" />}
            actions={
              <span className="flex items-center gap-1.5 text-[11px] text-positive font-mono">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-positive opacity-60 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-positive" />
                </span>
                LIVE
              </span>
            }
            padded={false}
          >
            <div className="divide-y divide-border/40 max-h-[480px] overflow-y-auto">
              {activityFeed.map((a) => {
                const sev = {
                  critical: "bg-critical/15 text-critical", warning: "bg-warning/15 text-warning",
                  positive: "bg-positive/15 text-positive", info: "bg-info/15 text-info",
                }[a.severity];
                const Icon = a.type === "email" ? Mail : a.type === "decision" ? Bot : a.type === "escalation" ? ArrowUpRight : ShieldAlert;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-surface/40 transition-colors">
                    <div className={cn("w-8 h-8 rounded-md grid place-items-center shrink-0", sev)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium truncate">{a.title}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto shrink-0">{a.time}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{a.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="col-span-12 lg:col-span-5 grid grid-cols-1 gap-6">
            <Panel title="Sentiment distribution" subtitle="Today">
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 shrink-0">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={sentimentBreakdown} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={2}>
                        {sentimentBreakdown.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {sentimentBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
                      <span className="flex-1">{s.name}</span>
                      <span className="font-mono tabular-nums text-muted-foreground">{s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="Escalation rate" subtitle="14-day rolling">
              <div className="h-32">
                <ResponsiveContainer>
                  <AreaChart data={escalationTrend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gEsc" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="rate" stroke="#4F46E5" strokeWidth={2} fill="url(#gEsc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </div>

        {/* Categories + System Health */}
        <div className="grid grid-cols-12 gap-6">
          <Panel
            className="col-span-12 lg:col-span-7"
            title="Email categories"
            subtitle="Auto-classified across all inbound today"
          >
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={categoriesData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.30 0.025 265 / 30%)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoriesData.map((c) => <Cell key={c.name} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel
            className="col-span-12 lg:col-span-5"
            title="System health"
            subtitle="Platform sub-systems"
            icon={<Server className="w-4 h-4" />}
            actions={<Badge tone="positive">All operational</Badge>}
          >
            <div className="space-y-2">
              {systemHealth.map((s) => {
                const sysIcons: Record<string, any> = { "RAG Engine": Sparkles, "Agent Runtime": Bot, "Vector Database": Database, "Queue Worker": Cpu, "Web Intelligence": Globe2 };
                const Icon = sysIcons[s.name];
                const ok = s.status === "operational";
                return (
                  <div key={s.name} className="flex items-center gap-3 p-3 rounded-md bg-surface/60 border border-border/60">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">Uptime {s.uptime}</div>
                    </div>
                    <span className={cn("text-[11px] font-mono", ok ? "text-positive" : "text-warning")}>{s.latency}</span>
                    <span className={cn("w-1.5 h-1.5 rounded-full pulse-dot", ok ? "bg-positive" : "bg-warning")} />
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border border-border text-foreground p-6 rounded-lg">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-semibold tracking-tight">Simulate Email Ingestion</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Simulate an incoming customer email. The email will go through automated classification, RAG retrieval, and AI response drafting.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Presets */}
          <div className="mb-4 p-3 rounded-lg bg-surface/40 border border-border/40">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Autofill Quick Presets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sampleIngestEmails.slice(0, 5).map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormSender(sample.from);
                    setFormSubject(sample.subject);
                    setFormBody(sample.preview);
                  }}
                  className="px-2 py-1 bg-surface-2 hover:bg-surface border border-border hover:border-primary/45 rounded text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {sample.category}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="form-sender" className="text-xs font-medium text-muted-foreground">
                Sender Name / Email
              </label>
              <input
                id="form-sender"
                type="text"
                required
                value={formSender}
                onChange={(e) => setFormSender(e.target.value)}
                placeholder="e.g. John Doe or john@acme-corp.com"
                className="w-full bg-surface border border-border rounded-md px-3 h-9 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="form-subject" className="text-xs font-medium text-muted-foreground">
                Subject
              </label>
              <input
                id="form-subject"
                type="text"
                required
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="e.g. SLA breach credit or Billing discrepancy"
                className="w-full bg-surface border border-border rounded-md px-3 h-9 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="form-body" className="text-xs font-medium text-muted-foreground">
                Email Body / Description
              </label>
              <textarea
                id="form-body"
                required
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Describe the issue or paste the email body here..."
                rows={5}
                className="w-full text-xs leading-relaxed text-foreground bg-surface border border-border rounded-md p-3 focus:outline-none focus:border-primary/60 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/30">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-3.5 h-9 rounded-md border border-border bg-surface/60 text-xs font-medium hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={ingestState === "loading"}
                className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                {ingestState === "loading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ingesting...</span>
                  </>
                ) : (
                  <>
                    <SendHorizonal className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}


const tooltipStyle = {
  background: "oklch(0.20 0.022 265)",
  border: "1px solid oklch(0.30 0.025 265)",
  borderRadius: 8,
  fontSize: 11,
  color: "oklch(0.97 0.005 250)",
};
