import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import { Mail, Phone, MapPin, Star, Building2, Calendar, TrendingDown, Activity, FileCheck, Repeat, MessageSquare, Loader2, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contacts")({
  head: () => ({ meta: [{ title: "Contact 360 — SenAI" }] }),
  component: Contact360,
});

const typeIcons: Record<string, any> = {
  email: Mail, meeting: Calendar, ticket: FileCheck, renewal: Repeat,
};

// Default sentiment journey mock (kept for charts)
const sentimentJourneyMock = [
  { month: "Dec", sentiment: 80 },
  { month: "Jan", sentiment: 85 },
  { month: "Feb", sentiment: 78 },
  { month: "Mar", sentiment: 90 },
  { month: "Apr", sentiment: 92 },
  { month: "May", sentiment: 88 },
  { month: "Jun", sentiment: 87 },
  { month: "Jul", sentiment: 82 },
  { month: "Aug", sentiment: 89 },
  { month: "Sep", sentiment: 91 },
  { month: "Oct", sentiment: 78 },
  { month: "Nov", sentiment: 87 },
];

function Contact360() {
  const [contactsList, setContactsList] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [contactData, setContactData] = useState<any>(null);
  const [contactThreads, setContactThreads] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Load all contacts
  const fetchContacts = async () => {
    try {
      setLoadingList(true);
      const res = await fetch("http://127.0.0.1:8000/contacts");
      if (res.ok) {
        const data = await res.json();
        setContactsList(data);
        if (data.length > 0 && !selectedEmail) {
          setSelectedEmail(data[0].email);
        }
      }
    } catch (e) {
      console.error("Failed to load contacts:", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Load selected contact details & timeline threads
  useEffect(() => {
    if (!selectedEmail) return;

    let active = true;
    async function loadContactDetails() {
      try {
        setLoadingDetails(true);
        const [detailRes, threadsRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/contacts/${selectedEmail}`),
          fetch(`http://127.0.0.1:8000/threads/${selectedEmail}`)
        ]);

        if (detailRes.ok && threadsRes.ok && active) {
          setContactData(await detailRes.json());
          setContactThreads(await threadsRes.json());
        }
      } catch (err) {
        console.error("Failed to load contact details:", err);
      } finally {
        if (active) setLoadingDetails(false);
      }
    }

    loadContactDetails();
    return () => {
      active = false;
    };
  }, [selectedEmail]);

  // Update contact status flag
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedEmail) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/contacts/${selectedEmail}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setStatusMenuOpen(false);
        // Refresh contacts lists and active contact
        fetchContacts();
        const detailRes = await fetch(`http://127.0.0.1:8000/contacts/${selectedEmail}`);
        if (detailRes.ok) {
          setContactData(await detailRes.json());
        }
      }
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const currentContact = contactData || {
    name: "Loading Contact...",
    email: selectedEmail,
    company: "—",
    arr: 0,
    vip: false,
    churnRisk: 0,
    status: "Active"
  };

  const isVip = currentContact.vip || currentContact.status === "VIP";

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Contact list sidebar */}
        <div className="w-72 border-r border-border flex flex-col bg-background shrink-0">
          <div className="p-3 border-b border-border text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Customer Directory ({contactsList.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading directory...
              </div>
            ) : (
              contactsList.map((c) => {
                const active = c.email === selectedEmail;
                const statusColor = {
                  VIP: "bg-warning", Blocked: "bg-critical",
                  Active: "bg-positive", Churned: "bg-muted-foreground"
                }[c.status as "VIP"] || "bg-positive";

                return (
                  <button
                    key={c.email}
                    onClick={() => setSelectedEmail(c.email)}
                    className={cn(
                      "w-full text-left p-3.5 transition-colors block border-b border-border/10",
                      active ? "bg-surface" : "hover:bg-surface/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1 justify-between">
                      <span className="text-xs font-semibold truncate flex-1">{c.name}</span>
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColor)} title={c.status} />
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.company}</div>
                    <div className="mt-2 flex items-center justify-between text-[9px]">
                      <span className="px-1 py-0.5 bg-surface-2 border border-border/40 rounded text-muted-foreground font-mono">{c.arr} ARR</span>
                      <span className="font-mono text-muted-foreground">{c.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Contact detail view */}
        <div className="flex-1 flex flex-col bg-background overflow-y-auto">
          {loadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />
              <span>Retrieving historical interactions & ARR telemetry...</span>
            </div>
          ) : (
            <>
              {/* Hero */}
              <div className="relative border-b border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-info/10" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="relative px-6 lg:px-8 py-8">
                  <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-info to-primary grid place-items-center text-2xl font-bold text-foreground shadow-[0_8px_40px_-8px_oklch(0.555_0.22_277/0.6)] shrink-0">
                      {currentContact.name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">{currentContact.name}</h1>
                        {isVip && <Badge tone="warning"><Star className="w-2.5 h-2.5" /> VIP</Badge>}
                        <Badge tone={currentContact.status === "Blocked" ? "critical" : currentContact.status === "Churned" ? "muted" : "positive"}>
                          {currentContact.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">Representative at <span className="text-foreground/80">{currentContact.company}</span></div>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {currentContact.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +1 (415) 555-0184</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> San Francisco, CA</span>
                      </div>
                    </div>

                    {/* Status updates action */}
                    <div className="relative">
                      <button
                        onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                        className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs font-semibold text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <span>Update Status</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {statusMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
                          <div className="absolute right-0 mt-1.5 w-40 rounded-md border border-border bg-popover text-popover-foreground shadow-lg z-50 py-1 divide-y divide-border/30">
                            {["Active", "VIP", "Blocked", "Churned"].map((st) => (
                              <button
                                key={st}
                                onClick={() => handleUpdateStatus(st)}
                                className={cn(
                                  "w-full text-left px-3.5 py-1.5 text-xs hover:bg-sidebar-accent/50 transition-colors",
                                  currentContact.status === st ? "font-semibold text-primary-glow bg-sidebar-accent" : "text-foreground/80"
                                )}
                              >
                                Mark as {st}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8 space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    { label: "Account ARR", value: typeof currentContact.arr === "number" ? `$${currentContact.arr.toLocaleString()}` : currentContact.arr, accent: "positive" },
                    { label: "CSAT score", value: "8.7/10", accent: "positive" },
                    { label: "NPS", value: "+9", accent: "positive" },
                    { label: "Churn risk", value: `${currentContact.churnRisk || currentContact.churn_risk_score}%`, accent: (currentContact.churnRisk > 30 ? "critical" : "warning") },
                    { label: "Tier", value: isVip ? "Enterprise" : "Starter", accent: "primary" },
                  ].map((s) => {
                    const c = { primary: "text-primary-glow", critical: "text-critical", warning: "text-warning", positive: "text-positive" }[s.accent as "primary"] || "text-foreground";
                    return (
                      <div key={s.label} className="card-elevated p-4">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
                        <div className={cn("mt-2 text-2xl font-semibold tabular-nums", c)}>{s.value}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Sentiment journey */}
                  <Panel className="col-span-12 xl:col-span-7" title="Sentiment journey" subtitle="12-month relationship arc" icon={<Activity className="w-4 h-4" />}>
                    <div className="h-72">
                      <ResponsiveContainer>
                        <AreaChart data={sentimentJourneyMock} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gJourney" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={ttStyle} />
                          <Area type="monotone" dataKey="sentiment" stroke="#4F46E5" strokeWidth={2.5} fill="url(#gJourney)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Panel>

                  {/* Account intel */}
                  <Panel className="col-span-12 xl:col-span-5" title="Account intelligence" subtitle="AI-generated summary" icon={<Building2 className="w-4 h-4" />}>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-md bg-primary/5 border border-primary/30">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-primary-glow mb-1">Health summary</div>
                        <p className="text-xs leading-relaxed text-foreground/90">
                          {currentContact.status === "Blocked"
                            ? "This account has been flagged for active threat patterns. Auto-responding is disabled. CSAT history is frozen pending security assessment."
                            : isVip
                            ? "High-value enterprise customer with SLA guarantees. Outages trigger emergency escalation. Relationship health is critical for upcoming quarterly renewal."
                            : "Standard tier user. Response pipelines flow through autonomous classification and draft generation. CSAT scores show stable adoption."}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { k: "Open tickets", v: String(contactThreads.filter(t => t.status !== "Resolved").length), tone: "warning" },
                          { k: "Last QBR", v: "9 days ago", tone: "positive" },
                          { k: "Active threads count", v: String(contactThreads.length), tone: "info" },
                          { k: "Company Domain", v: selectedEmail.split("@")[1] || "—", tone: "info" },
                          { k: "Product adoption", v: isVip ? "88%" : "64%", tone: "positive" },
                        ].map((r) => {
                          const c = { positive: "text-positive", warning: "text-warning", info: "text-info" }[r.tone as "positive"];
                          return (
                            <div key={r.k} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{r.k}</span>
                              <span className={cn("font-mono font-medium", c)}>{r.v}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Panel>
                </div>

                {/* Communication timeline */}
                <Panel title="Communication timeline" subtitle="Every thread and ticket registered in the database" icon={<MessageSquare className="w-4 h-4" />}>
                  <div className="relative pl-6">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-4">
                      {contactThreads.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-4 text-center">
                          No communication history in the database.
                        </div>
                      ) : (
                        contactThreads.map((t, i) => {
                          const tone = {
                            Critical: "bg-critical", Negative: "bg-warning",
                            Positive: "bg-positive", Neutral: "bg-info"
                          }[t.sentiment as "Neutral"] || "bg-info";

                          return (
                            <div key={i} className="relative">
                              <div className={cn("absolute -left-[18px] top-1 w-3.5 h-3.5 rounded-full border-2 border-background", tone)} />
                              <div className="flex items-center gap-3 p-3.5 rounded-md bg-surface/60 border border-border/60 hover:border-primary/40 transition-colors">
                                <div className="w-9 h-9 rounded-md bg-surface-2 grid place-items-center shrink-0">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 justify-between">
                                    <span className="text-sm font-medium truncate">{t.subject}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Badge tone={t.status === "Resolved" ? "positive" : t.status === "Needs Review" ? "warning" : "muted"}>
                                        {t.status}
                                      </Badge>
                                      <Badge tone={t.sentiment === "Critical" ? "critical" : t.sentiment === "Negative" ? "warning" : t.sentiment === "Positive" ? "positive" : "muted"}>
                                        {t.sentiment}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono">
                                    Last Updated: {new Date(t.last_updated_at).toLocaleString()} · Category: {t.category} · Urgency: {t.urgency}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </Panel>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const ttStyle = { background: "oklch(0.20 0.022 265)", border: "1px solid oklch(0.30 0.025 265)", borderRadius: 8, fontSize: 11, color: "oklch(0.97 0.005 250)" };
