import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import {
  Bot, Cpu, Activity, CheckCircle2, AlertTriangle, Sparkles, Mail,
  Search, Brain, Zap, Send, ArrowRight, Clock,
} from "lucide-react";
import { agents, toolUsage } from "@/lib/mock-data";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "Agent Monitor — SenAI" }] }),
  component: AgentMonitor,
});

const flow = [
  { label: "Email", icon: Mail, color: "text-info" },
  { label: "Classify", icon: Brain, color: "text-primary-glow" },
  { label: "RAG Search", icon: Search, color: "text-info" },
  { label: "Reasoning", icon: Sparkles, color: "text-primary-glow" },
  { label: "Action", icon: Send, color: "text-positive" },
];

const liveLogs = [
  { t: "12:42:18.241", level: "INFO", agent: "Intent Classifier", msg: "Classified inbound msg_4821 → 'Bug Report' (conf 0.97)" },
  { t: "12:42:18.402", level: "INFO", agent: "RAG Reasoner", msg: "Retrieved 4 chunks from sla_policy.md, escalation_matrix.md" },
  { t: "12:42:19.811", level: "WARN", agent: "Escalation Router", msg: "VIP threshold exceeded — routing to human review" },
  { t: "12:42:20.118", level: "INFO", agent: "Response Drafter", msg: "Generated 218-token response, awaiting approval" },
  { t: "12:42:21.502", level: "INFO", agent: "CRM Sync", msg: "Updated contact sarah.chen@acme-corp.com (last_touch)" },
  { t: "12:42:22.014", level: "ERROR", agent: "CRM Sync", msg: "Salesforce rate limit hit, retrying in 2s (attempt 1/3)" },
  { t: "12:42:23.811", level: "INFO", agent: "Security Watchdog", msg: "Scanned 12 attachments, 0 threats detected" },
  { t: "12:42:24.402", level: "INFO", agent: "Legal Sentinel", msg: "Detected GDPR pattern in msg_4822, flagged for review" },
];

function AgentMonitor() {
  const stats = [
    { label: "Active agents", value: "48 / 52", icon: Bot, accent: "primary" },
    { label: "Running tasks", value: "1,287", icon: Activity, accent: "info" },
    { label: "Tool calls / min", value: "412", icon: Zap, accent: "warning" },
    { label: "Success rate", value: "96.4%", icon: CheckCircle2, accent: "positive" },
    { label: "Avg resolution", value: "1.8s", icon: Clock, accent: "primary" },
  ];

  return (
    <AppShell
      title="Autonomous Agent Operations"
      subtitle="Real-time visibility into every agent, tool call, and decision in the runtime."
      actions={
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs font-medium text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)]">
          <Sparkles className="w-3.5 h-3.5" /> Deploy new agent
        </button>
      }
    >
      <div className="p-6 lg:p-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            const c = { primary: "text-primary-glow", info: "text-info", warning: "text-warning", positive: "text-positive" }[s.accent];
            return (
              <div key={s.label} className="card-elevated p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <Icon className={cn("w-4 h-4", c)} />
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Workflow diagram */}
        <Panel
          title="Agent execution pipeline"
          subtitle="Live workflow — each stage shows current load and average latency"
          icon={<Cpu className="w-4 h-4" />}
        >
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
            {flow.map((f, i) => (
              <div key={f.label} className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                  <div className="relative">
                    <div className={cn("w-16 h-16 rounded-2xl grid place-items-center border bg-surface/60 backdrop-blur-sm", "border-primary/30")}>
                      <f.icon className={cn("w-6 h-6", f.color)} />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-positive pulse-dot border-2 border-background" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold">{f.label}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">{[142, 88, 412, 1840, 218][i]}ms</div>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </Panel>

        {/* Agents grid + Tool usage */}
        <div className="grid grid-cols-12 gap-6">
          <Panel className="col-span-12 xl:col-span-8" title="Active agents" subtitle="Status, throughput, and success rate" icon={<Bot className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((a) => {
                const status = ({
                  running: { c: "bg-positive", label: "running", t: "positive" as const },
                  idle: { c: "bg-muted-foreground", label: "idle", t: "muted" as const },
                  degraded: { c: "bg-warning", label: "degraded", t: "warning" as const },
                } as const)[a.status as "running" | "idle" | "degraded"];
                return (
                  <div key={a.id} className="p-4 rounded-lg border border-border bg-surface/40 hover:border-primary/40 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary/20 to-primary-glow/20 border border-primary/30 grid place-items-center shrink-0">
                        <Bot className="w-4 h-4 text-primary-glow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{a.name}</span>
                          <Badge tone={status.t}>
                            <span className={cn("w-1.5 h-1.5 rounded-full pulse-dot", status.c)} />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">{a.role} · {a.id}</div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <div className="text-muted-foreground">Tasks</div>
                            <div className="font-mono font-semibold tabular-nums">{a.tasks.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Success</div>
                            <div className="font-mono font-semibold tabular-nums text-positive">{a.success}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg ms</div>
                            <div className="font-mono font-semibold tabular-nums">{a.avgMs}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="col-span-12 xl:col-span-4 space-y-6">
            <Panel title="Tool usage" subtitle="Last 24h">
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={toolUsage} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                    <YAxis dataKey="tool" type="category" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} width={90} />
                    <Tooltip contentStyle={ttStyle} cursor={{ fill: "oklch(0.30 0.025 265 / 30%)" }} />
                    <Bar dataKey="calls" radius={[0, 6, 6, 0]}>
                      {toolUsage.map((_, i) => <Cell key={i} fill={["#4F46E5","#10b981","#f59e0b","#3b82f6","#a855f7","#ef4444"][i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Failure analysis" subtitle="Last 7d" icon={<AlertTriangle className="w-4 h-4" />}>
              <div className="space-y-2">
                {[
                  { reason: "Rate limit (Salesforce)", count: 42, pct: 38 },
                  { reason: "LLM timeout (>30s)", count: 18, pct: 16 },
                  { reason: "RAG empty result", count: 14, pct: 13 },
                  { reason: "Schema validation", count: 9, pct: 8 },
                  { reason: "Other", count: 27, pct: 25 },
                ].map((f) => (
                  <div key={f.reason}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground/90">{f.reason}</span>
                      <span className="font-mono text-muted-foreground">{f.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-critical to-warning rounded-full" style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Live logs */}
        <Panel
          title="Real-time execution log"
          subtitle="Streaming from all agent runtimes"
          icon={<Activity className="w-4 h-4" />}
          actions={
            <span className="flex items-center gap-1.5 text-[11px] text-positive font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-positive pulse-dot" /> STREAMING
            </span>
          }
          padded={false}
        >
          <div className="font-mono text-[11px] divide-y divide-border/40 max-h-80 overflow-y-auto">
            {liveLogs.map((l, i) => {
              const lc = { INFO: "text-info", WARN: "text-warning", ERROR: "text-critical" }[l.level];
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-2 hover:bg-surface/40">
                  <span className="text-muted-foreground shrink-0">{l.t}</span>
                  <span className={cn("shrink-0 font-semibold w-12", lc)}>{l.level}</span>
                  <span className="shrink-0 text-foreground/80 w-44 truncate">{l.agent}</span>
                  <span className="text-foreground/70 truncate">{l.msg}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

const ttStyle = {
  background: "oklch(0.20 0.022 265)",
  border: "1px solid oklch(0.30 0.025 265)",
  borderRadius: 8, fontSize: 11, color: "oklch(0.97 0.005 250)",
};
