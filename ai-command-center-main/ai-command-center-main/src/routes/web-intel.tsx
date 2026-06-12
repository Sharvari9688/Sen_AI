import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import { Globe2, Star, TrendingUp, MessageSquare, AlertTriangle, Sparkles, ArrowUpRight, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { webIntel, reviewTrend, competitorPricing, marketInsights } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/web-intel")({
  head: () => ({ meta: [{ title: "Web Intelligence — SenAI" }] }),
  component: WebIntel,
});

function WebIntel() {
  const [reputation, setReputation] = useState<any>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/intelligence/reputation")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("API failed");
      })
      .then((data) => setReputation(data))
      .catch((err) => console.error("Reputation load failed:", err));
  }, []);

  const trustpilotScore = reputation?.trustpilot?.score || webIntel.trustpilot.score;
  const trustpilotReviews = reputation?.trustpilot?.reviews || webIntel.trustpilot.reviews;
  const g2Score = reputation?.g2?.score || webIntel.g2.score;
  const g2Reviews = reputation?.g2?.reviews || webIntel.g2.reviews;
  const npsScore = reputation?.nps || webIntel.nps.score;

  return (
    <AppShell
      title="Web Intelligence Center"
      subtitle="AI-generated market signals, brand sentiment, and competitive intelligence across the public web."
      actions={
        <button className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs font-medium text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)]">
          <Sparkles className="w-3.5 h-3.5" /> Run intelligence sweep
        </button>
      }
    >
      <div className="p-6 lg:p-8 space-y-6">
        {/* Score cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "Trustpilot", score: trustpilotScore, reviews: trustpilotReviews, trend: webIntel.trustpilot.trend, color: "from-positive/30 to-positive/5" },
            { name: "G2", score: g2Score, reviews: g2Reviews, trend: webIntel.g2.trend, color: "from-critical/30 to-critical/5" },
            { name: "Capterra", score: webIntel.capterra.score, reviews: webIntel.capterra.reviews, trend: webIntel.capterra.trend, color: "from-warning/30 to-warning/5" },
            { name: "NPS Score", score: npsScore, reviews: null, trend: webIntel.nps.trend, color: "from-primary/30 to-primary/5" },
          ].map((s) => (
            <div key={s.name} className="card-elevated p-5 relative overflow-hidden">
              <div className={cn("absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl bg-gradient-to-br", s.color)} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{s.name}</span>
                  <Globe2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{s.score}</span>
                  {s.reviews !== null && <span className="text-xs text-muted-foreground">/ 5.0</span>}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {s.reviews !== null && (
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("w-3 h-3", i < Math.floor(s.score) ? "fill-warning text-warning" : "text-muted-foreground/40")} />
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {s.reviews !== null ? `${s.reviews.toLocaleString()} reviews` : "Industry Average: 42"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px]">
                  <ArrowUpRight className="w-3 h-3 text-positive" />
                  <span className="font-mono text-positive">{s.trend}</span>
                  <span className="text-muted-foreground">30d</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Panel className="col-span-12 xl:col-span-7" title="Brand sentiment trend" subtitle="Aggregate score across all monitored channels" icon={<TrendingUp className="w-4 h-4" />} actions={<Badge tone="positive">+0.4 vs last quarter</Badge>}>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={reviewTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis domain={[3.5, 5]} tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Area type="monotone" dataKey="rating" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gSent)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="col-span-12 xl:col-span-5" title="Review volume" subtitle="Monthly inbound mentions" icon={<MessageSquare className="w-4 h-4" />}>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={reviewTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} cursor={{ fill: "oklch(0.30 0.025 265 / 30%)" }} />
                  <Bar dataKey="reviews" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Panel className="col-span-12 xl:col-span-7" title="Competitor pricing benchmark" subtitle="Across 4 tracked competitors">
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={competitorPricing} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="starter" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pro" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="enterprise" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel className="col-span-12 xl:col-span-5" title="AI-generated market insights" subtitle="Synthesized from all signals" icon={<Lightbulb className="w-4 h-4" />}>
            <div className="space-y-3">
              {marketInsights.map((m, i) => {
                const tone = { critical: "critical", warning: "warning", positive: "positive", info: "info" }[m.severity] as any;
                const Icon = m.severity === "positive" ? TrendingUp : m.severity === "critical" ? AlertTriangle : Lightbulb;
                return (
                  <div key={i} className="p-3.5 rounded-md bg-surface/60 border border-border/60 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className={cn("w-8 h-8 rounded-md grid place-items-center shrink-0",
                        m.severity === "critical" && "bg-critical/15 text-critical",
                        m.severity === "warning" && "bg-warning/15 text-warning",
                        m.severity === "positive" && "bg-positive/15 text-positive",
                        m.severity === "info" && "bg-info/15 text-info",
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold">{m.title}</span>
                          <Badge tone={tone}>{m.severity}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

const ttStyle = { background: "oklch(0.20 0.022 265)", border: "1px solid oklch(0.30 0.025 265)", borderRadius: 8, fontSize: 11, color: "oklch(0.97 0.005 250)" };
