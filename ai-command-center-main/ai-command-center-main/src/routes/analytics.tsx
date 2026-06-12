import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import { BarChart3, Calendar, Download, Filter, TrendingUp, Activity, Clock } from "lucide-react";
import { sentimentTrend, categories, escalationTrend, responseTimeData, heatmap } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, LineChart, Line, Legend, PieChart, Pie } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — SenAI" }] }),
  component: Analytics,
});

const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function Analytics() {
  return (
    <AppShell
      title="Analytics Center"
      subtitle="Executive insights across volume, sentiment, escalations, and agent performance."
      actions={
        <>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/60 text-xs hover:bg-surface"><Calendar className="w-3.5 h-3.5" /> Last 30 days</button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/60 text-xs hover:bg-surface"><Filter className="w-3.5 h-3.5" /> Filters</button>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface/60 text-xs hover:bg-surface"><Download className="w-3.5 h-3.5" /> Export PDF</button>
        </>
      }
    >
      <div className="p-6 lg:p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total volume", value: "284,917", change: "+12.4%", icon: BarChart3 },
            { label: "Resolution rate", value: "87.3%", change: "+3.1%", icon: TrendingUp },
            { label: "Avg response", value: "1.8s", change: "-0.4s", icon: Clock },
            { label: "Agent perf score", value: "94.2", change: "+1.2", icon: Activity },
          ].map((k) => (
            <div key={k.label} className="card-elevated p-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{k.label}</span>
                <k.icon className="w-4 h-4 text-primary-glow" />
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</div>
              <div className="mt-1 text-[11px] text-positive font-mono">{k.change} vs prev period</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Panel className="col-span-12 xl:col-span-8" title="Sentiment trends" subtitle="Hourly, last 24h">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={sentimentTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aPos" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="aNeg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} fill="url(#aPos)" />
                  <Area type="monotone" dataKey="negative" stroke="#f59e0b" strokeWidth={2} fill="url(#aNeg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="col-span-12 xl:col-span-4" title="Category breakdown" subtitle="Volume share">
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categories} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {categories.map((c) => <Cell key={c.name} fill={c.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Response time distribution" subtitle="p50 / p95 / p99 latency by hour" icon={<Clock className="w-4 h-4" />}>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={responseTimeData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p95" stroke="#4F46E5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid grid-cols-12 gap-6">
          <Panel className="col-span-12 xl:col-span-7" title="Activity heatmap" subtitle="Volume by day × hour (last week)">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="flex gap-1 mb-1 pl-10">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-[9px] font-mono text-center text-muted-foreground">{h % 3 === 0 ? h : ""}</div>
                  ))}
                </div>
                {days.map((d, di) => (
                  <div key={d} className="flex gap-1 mb-1 items-center">
                    <div className="w-8 text-[10px] font-mono text-muted-foreground">{d}</div>
                    <div className="flex gap-1 flex-1">
                      {Array.from({ length: 24 }, (_, hi) => {
                        const v = heatmap.find((c) => c.day === di && c.hour === hi)?.value ?? 0;
                        const intensity = Math.min(1, v / 100);
                        return (
                          <div
                            key={hi}
                            className="flex-1 aspect-square rounded-sm border border-border/40"
                            style={{ background: `oklch(0.555 0.22 277 / ${0.08 + intensity * 0.7})` }}
                            title={`${d} ${hi}:00 — ${v}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                  <span>Low</span>
                  {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((o) => (
                    <div key={o} className="w-4 h-3 rounded-sm" style={{ background: `oklch(0.555 0.22 277 / ${o})` }} />
                  ))}
                  <span>High</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="col-span-12 xl:col-span-5" title="Escalation rate" subtitle="14-day rolling">
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={escalationTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} cursor={{ fill: "oklch(0.30 0.025 265 / 30%)" }} />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {escalationTrend.map((d, i) => <Cell key={i} fill={d.rate > 12 ? "#ef4444" : d.rate > 9 ? "#f59e0b" : "#4F46E5"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

const ttStyle = { background: "oklch(0.20 0.022 265)", border: "1px solid oklch(0.30 0.025 265)", borderRadius: 8, fontSize: 11, color: "oklch(0.97 0.005 250)" };
