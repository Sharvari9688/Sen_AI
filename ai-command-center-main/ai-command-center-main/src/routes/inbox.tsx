import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useSyncExternalStore, startTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import {
  Inbox, Eye, ArrowUpRight, Ban, ShieldAlert, Scale, FileCheck, CheckCircle2,
  Search, Star, Paperclip, Reply, Forward, MoreHorizontal, Sparkles,
  Brain, FileText, User, Building2, AlertOctagon, Send, Edit3, X, Flag,
  ChevronRight, Zap, ChevronDown, Plus, Save, Loader2
} from "lucide-react";
import { inboxFolders, sampleIngestEmails } from "@/lib/mock-data";
import { getThreads, subscribeThreads, syncThreads } from "@/lib/inbox-store";
import type { EmailThread } from "@/lib/inbox-store";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "AI Inbox — SenAI" }] }),
  component: AIInbox,
});

const folderIcons: Record<string, any> = {
  Inbox, Eye, ArrowUpRight, Ban, ShieldAlert, Scale, FileCheck, CheckCircle2,
};

function AIInbox() {
  // Live thread list from global store (updates when Mission Control ingests)
  const threads = useSyncExternalStore(subscribeThreads, getThreads);

  const [selected, setSelected] = useState("");
  const [folder, setFolder] = useState("Inbox");
  const [showAIWorkspace, setShowAIWorkspace] = useState(true);
  const [aiTab, setAiTab] = useState<"insights" | "customer">("insights");
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);

  // Ingest state
  const [isIngesting, setIsIngesting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formSender, setFormSender] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  // Backend state for selected thread
  const [messages, setMessages] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Draft editing state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isApprovingDraft, setIsApprovingDraft] = useState(false);

  // Default select first thread
  useEffect(() => {
    if (!selected && threads.length > 0) {
      setSelected(threads[0].id);
    }
  }, [threads, selected]);

  // Load selected thread messages & RAG insights from FastAPI
  useEffect(() => {
    if (!selected) return;

    let active = true;
    async function loadThreadDetails() {
      try {
        setLoading(true);
        const [emailsRes, insightsRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/threads/${selected}/emails`),
          fetch(`http://127.0.0.1:8000/threads/${selected}/insights`)
        ]);

        if (emailsRes.ok && insightsRes.ok && active) {
          const emailsData = await emailsRes.json();
          const insightsData = await insightsRes.json();

          setMessages(emailsData);
          setInsights(insightsData);

          // Find draft and pre-populate edit state
          const draft = emailsData.find((m: any) => m.isAgentDraft);
          if (draft) {
            setDraftText(draft.body);
          } else {
            setDraftText("");
          }
          setIsEditingDraft(false);
        }
      } catch (err) {
        console.error("Failed to load thread details:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadThreadDetails();
    return () => {
      active = false;
    };
  }, [selected]);

  const thread = threads.find((t) => t.id === selected) || threads[0] || {
    id: "",
    subject: "No active thread selected",
    company: "—",
    from: "—",
    category: "—",
    sentiment: "Neutral",
    urgency: "P3",
    confidence: 100,
    vip: false,
  };

  // Find agent draft email
  const agentDraft = messages.find((m) => m.isAgentDraft);

  // Save edited draft
  const handleSaveDraft = async () => {
    if (!agentDraft) return;
    try {
      setIsSavingDraft(true);
      const res = await fetch(`http://127.0.0.1:8000/drafts/${agentDraft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draftText })
      });
      if (res.ok) {
        setIsEditingDraft(false);
        // Refresh emails
        const emailsRes = await fetch(`http://127.0.0.1:8000/threads/${selected}/emails`);
        if (emailsRes.ok) {
          setMessages(await emailsRes.json());
        }
      }
    } catch (e) {
      console.error("Failed to save draft:", e);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Approve draft to send
  const handleApproveDraft = async () => {
    if (!agentDraft) return;
    try {
      setIsApprovingDraft(true);
      const res = await fetch(`http://127.0.0.1:8000/drafts/${agentDraft.id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        // Refresh emails & sync thread statuses
        const emailsRes = await fetch(`http://127.0.0.1:8000/threads/${selected}/emails`);
        if (emailsRes.ok) {
          setMessages(await emailsRes.json());
        }
        syncThreads();
      }
    } catch (e) {
      console.error("Failed to approve draft:", e);
    } finally {
      setIsApprovingDraft(false);
    }
  };

  // Simulate Ingest button handler
  const handleSimulateIngest = async (senderVal: string, subjectVal: string, bodyVal: string) => {
    try {
      setIsIngesting(true);
      let finalSender = senderVal.trim();
      if (!finalSender.includes("@")) {
        const slug = finalSender.toLowerCase().replace(/[^a-z0-9]+/g, ".");
        finalSender = `${slug || "customer"}@example.com`;
      }

      const res = await fetch("http://127.0.0.1:8000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: finalSender,
          subject: subjectVal.trim() || "(No Subject)",
          body: bodyVal.trim() || "(No Content)"
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Wait and sync
        setTimeout(() => {
          syncThreads().then(() => {
            if (data.thread_id) setSelected(data.thread_id);
          });
          setIsIngesting(false);
          setIsDialogOpen(false);
          setFormSender("");
          setFormSubject("");
          setFormBody("");
        }, 1500);
      } else {
        setIsIngesting(false);
      }
    } catch (e) {
      console.error("Ingest simulation failed:", e);
      setIsIngesting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSimulateIngest(formSender, formSubject, formBody);
  };

  // Filter threads by active folder selection
  const filteredThreads = threads.filter((t) => {
    if (folder === "Inbox") return t.status === "Needs Review" || t.status === "Open" || t.status === "Critical" || t.status === "Negative";
    if (folder === "Needs Review") return t.status === "Needs Review";
    if (folder === "Escalated") return t.status === "Escalated";
    if (folder === "Spam") return t.category === "Spam";
    if (folder === "Security") return t.category === "Security";
    if (folder === "Legal") return t.category === "Legal";
    if (folder === "Compliance") return t.category === "Compliance";
    if (folder === "Resolved") return t.status === "Resolved" || t.status.includes("Auto-Sent");
    return true;
  });

  // Extract variables safely with fallbacks
  const ragContext = insights?.rag_matches ?? [];
  const agentReasoning = insights?.reasoning_steps ?? [];
  const customerProfile = insights?.customer_profile ?? {
    company: "—",
    arr: "$0",
    vip: false,
    churnRisk: 0,
    openTickets: 0,
    csat: 8.0,
    tier: "Standard"
  };

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Thread list (Column 1) */}
        <div className="w-80 border-r border-border flex flex-col bg-background shrink-0">
          <div className="p-3 border-b border-border space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              {/* Folder Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFolderMenuOpen(!folderMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-surface/60 hover:bg-surface text-xs font-semibold transition-colors"
                >
                  {(() => {
                    const activeFolder = inboxFolders.find((f) => f.name === folder) || inboxFolders[0];
                    const Icon = folderIcons[activeFolder.icon];
                    return <Icon className="w-3.5 h-3.5 text-primary-glow" />;
                  })()}
                  <span>{folder}</span>
                  <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
                </button>

                {folderMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setFolderMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-52 rounded-md border border-border bg-popover text-popover-foreground shadow-lg z-50 py-1 divide-y divide-border/30">
                      {inboxFolders.map((f) => {
                        const Icon = folderIcons[f.icon];
                        const active = folder === f.name;
                        return (
                          <button
                            key={f.name}
                            onClick={() => {
                              setFolder(f.name);
                              setFolderMenuOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors",
                              active ? "bg-sidebar-accent text-foreground font-medium" : "hover:bg-sidebar-accent/50 text-foreground/80"
                            )}
                          >
                            <Icon className={cn("w-3.5 h-3.5", active ? "text-primary-glow" : "text-muted-foreground")} />
                            <span className="flex-1">{f.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Ingest Simulation Button */}
              <button
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded border border-border bg-surface/40 hover:bg-surface text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Ingest Email</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Search threads…"
                className="w-full bg-surface/60 border border-border rounded-md pl-8 pr-3 h-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/20">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No threads in this folder.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const active = t.id === selected;
                const sentimentDotColor = {
                  Critical: "bg-critical", Neutral: "bg-muted-foreground/40",
                  Negative: "bg-warning", Positive: "bg-positive",
                }[t.sentiment] || "bg-muted-foreground/40";
                
                const sentBorder = {
                  Critical: "border-l-critical", Neutral: "border-l-transparent",
                  Negative: "border-l-warning", Positive: "border-l-positive",
                }[t.sentiment] || "border-l-transparent";

                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      "w-full text-left p-3 border-l-2 transition-colors block border-b border-border/10",
                      sentBorder,
                      active ? "bg-surface" : "hover:bg-surface/40",
                      t.unread && "bg-surface/10",
                      t.isNew && "thread-new",
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", sentimentDotColor)} title={t.sentiment} />
                      <span className={cn("text-xs truncate font-medium flex-1", t.unread ? "text-foreground font-semibold" : "text-muted-foreground")}>{t.name}</span>
                      {t.vip && <Star className="w-2.5 h-2.5 fill-warning text-warning shrink-0" />}
                      <span className="text-[10px] text-muted-foreground shrink-0">{t.time}</span>
                    </div>
                    <div className={cn("text-xs truncate mb-0.5", t.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {t.subject}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 truncate">{t.preview}</div>
                    <div className="mt-2 flex items-center justify-between text-[9px]">
                      <span className="px-1.5 py-0.5 bg-surface-2 border border-border/40 rounded text-muted-foreground font-mono">{t.category}</span>
                      <span className={cn("font-mono px-1 rounded font-semibold", t.urgency === "P0" ? "text-critical bg-critical/10" : t.urgency === "P1" ? "text-warning bg-warning/10" : "text-muted-foreground bg-muted/10")}>{t.urgency}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread viewer (Column 2) */}
        <div className={cn("flex-1 flex flex-col bg-background min-w-0 transition-all duration-200 border-r border-border")}>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />
              <span>Analyzing context & retrieving SLA guidelines...</span>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight truncate">{thread.subject}</h2>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{thread.company}</span>
                    <span>·</span>
                    <span className="truncate">{thread.from}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowAIWorkspace(!showAIWorkspace)}
                    className={cn(
                      "flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium transition-all",
                      showAIWorkspace
                        ? "bg-primary/10 border-primary/40 text-primary-glow"
                        : "border-border hover:bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Brain className="w-3.5 h-3.5" />
                    <span>{showAIWorkspace ? "Hide Insights" : "AI Insights"}</span>
                  </button>
                  <button className="w-8 h-8 grid place-items-center rounded-md hover:bg-surface text-muted-foreground"><Paperclip className="w-4 h-4" /></button>
                  <button className="w-8 h-8 grid place-items-center rounded-md hover:bg-surface text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No messages in this thread.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={cn("rounded-lg border p-4", m.isAgentDraft ? "border-primary/30 bg-primary/5 border-dashed" : m.isAgent ? "border-primary/30 bg-primary/5" : "border-border bg-surface/40")}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={cn("w-8 h-8 rounded-full grid place-items-center text-[10px] font-semibold", m.isAgent ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground" : "bg-gradient-to-br from-info to-primary")}>
                          {m.isAgent ? <Sparkles className="w-3.5 h-3.5 text-primary-foreground" /> : m.from.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{m.from}</span>
                            {m.isAgentDraft && <Badge tone="warning">AI Draft (Pending approval)</Badge>}
                            {m.isAgent && !m.isAgentDraft && <Badge tone="primary">AI Agent Reply</Badge>}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{m.email} · {m.time}</div>
                        </div>
                      </div>
                      
                      {m.isAgentDraft && isEditingDraft ? (
                        <div className="space-y-3">
                          <textarea
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            rows={6}
                            className="w-full text-sm leading-relaxed text-foreground bg-surface border border-primary/45 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary-glow"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditingDraft(false)}
                              className="px-3 py-1.5 rounded border border-border text-xs hover:bg-surface transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveDraft}
                              disabled={isSavingDraft}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                              {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{m.body}</p>
                      )}
                      
                      {m.entities && m.entities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {m.entities.map((e: string) => (
                            <span key={e} className="px-2 py-0.5 rounded text-[10px] font-mono bg-info/15 text-info border border-info/30">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action bar */}
              <div className="px-5 py-3.5 border-t border-border bg-surface/40 flex items-center gap-2">
                {agentDraft ? (
                  <>
                    <button
                      onClick={handleApproveDraft}
                      disabled={isApprovingDraft || isEditingDraft}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-medium shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60"
                    >
                      {isApprovingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Approve & Send Draft</span>
                    </button>
                    {!isEditingDraft && (
                      <button
                        onClick={() => setIsEditingDraft(true)}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-xs hover:bg-surface-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex-1 text-center text-xs text-muted-foreground font-mono">
                    {thread.status.includes("Resolved") ? "Thread Resolved" : "No pending AI response draft"}
                  </div>
                )}
                <button className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-surface text-xs hover:bg-surface-2"><ArrowUpRight className="w-3.5 h-3.5" /> Escalate</button>
                <button
                  onClick={() => setSelected("")}
                  className="w-9 h-9 grid place-items-center rounded-md border border-border bg-surface hover:bg-surface-2 text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* AI Workspace (Column 3, Collapsible) */}
        {showAIWorkspace && (
          <div className="w-80 shrink-0 flex flex-col bg-sidebar/20 border-l border-border h-full overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-sidebar/40">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary-glow" />
                <span className="text-xs font-semibold">AI Intelligence</span>
              </div>
              <button
                onClick={() => setShowAIWorkspace(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-sidebar-accent/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub-navigation tabs */}
            <div className="flex border-b border-border bg-sidebar/10 p-1 gap-1">
              <button
                onClick={() => setAiTab("insights")}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-medium rounded transition-all",
                  aiTab === "insights" ? "bg-surface text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                AI Insights
              </button>
              <button
                onClick={() => setAiTab("customer")}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-medium rounded transition-all",
                  aiTab === "customer" ? "bg-surface text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Customer Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiTab === "insights" ? (
                <>
                  {/* Classification */}
                  <div className="card-elevated p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
                      <span className="text-xs font-semibold">Classification</span>
                      <Badge tone="primary" className="ml-auto">{thread.confidence || 95}%</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <Row k="Category" v={thread.category || "—"} />
                      <Row k="Sentiment" v={thread.sentiment || "Neutral"} tone={thread.sentiment === "Critical" ? "critical" : thread.sentiment === "Negative" ? "warning" : "positive"} />
                      <Row k="Urgency" v={thread.urgency || "P3"} tone={thread.urgency === "P0" ? "critical" : thread.urgency === "P1" ? "warning" : "info"} />
                      <Row k="Human review" v={thread.status === "Resolved" ? "Not Needed" : "Required"} tone={thread.status === "Resolved" ? "positive" : "warning"} />
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="card-elevated p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-primary-glow" />
                      <span className="text-xs font-semibold">Agent reasoning trace</span>
                    </div>
                    <div className="space-y-2.5">
                      {agentReasoning.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground italic text-center py-2">
                          No reasoning steps available.
                        </div>
                      ) : (
                        agentReasoning.map((r: any) => {
                          const tone = {
                            Thought: "border-info/40 text-info",
                            Action: "border-primary/40 text-primary-glow",
                            Observation: "border-positive/40 text-positive",
                            "Next Step": "border-warning/40 text-warning",
                          }[r.type as string] || "border-border text-muted-foreground";
                          
                          return (
                            <div key={r.step} className={cn("border-l-2 pl-2.5 py-0.5", tone)}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">Step {r.step}</span>
                                <span className="text-[9px] font-semibold">{r.type}</span>
                              </div>
                              <p className="text-[10px] text-foreground/80 leading-snug">{r.content}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* RAG Context */}
                  <div className="card-elevated p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-primary-glow" />
                      <span className="text-xs font-semibold">RAG context matches</span>
                    </div>
                    <div className="space-y-2">
                      {ragContext.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground italic text-center py-2">
                          No RAG document context matched.
                        </div>
                      ) : (
                        ragContext.map((r: any) => (
                          <div key={r.doc} className="p-2 rounded bg-surface/50 border border-border/40">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="w-3 h-3 text-info shrink-0" />
                              <span className="text-[10px] font-mono font-semibold truncate flex-1">{r.doc}</span>
                              <span className="text-[9px] font-mono text-positive shrink-0">{(r.score * 10).toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">{r.chunk}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Customer Profile */}
                  <div className="card-elevated p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary-glow" />
                      <span className="text-xs font-semibold">Customer profile</span>
                      {customerProfile.vip && <Badge tone="warning" className="ml-auto"><Star className="w-2.5 h-2.5" /> VIP</Badge>}
                    </div>
                    <div className="space-y-2 text-xs">
                      <Row k="Company" v={customerProfile.company} />
                      <Row k="Tier" v={customerProfile.tier} />
                      <Row k="ARR" v={customerProfile.arr} tone="positive" />
                      <Row k="Churn risk" v={`${customerProfile.churnRisk}%`} tone="warning" />
                      <Row k="Open tickets" v={String(customerProfile.openTickets)} />
                      <Row k="CSAT" v={customerProfile.csat?.toFixed(1) || "8.5"} tone="positive" />
                    </div>
                  </div>

                  {/* Recommended actions */}
                  <div className="card-elevated p-3.5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary-glow" />
                      <span className="text-xs font-semibold">Recommended actions</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Send drafted reply", icon: Reply },
                        { label: "Escalate to VP Eng", icon: ArrowUpRight },
                        { label: "Create JIRA ticket", icon: FileCheck },
                        { label: "Flag for Legal", icon: Scale },
                        { label: "Flag for Security", icon: ShieldAlert },
                      ].map((a) => (
                        <button key={a.label} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface/50 border border-border/40 hover:border-primary/40 text-[11px] text-left transition-colors group">
                          <a.icon className="w-3 h-3 text-muted-foreground group-hover:text-primary-glow shrink-0 mr-1.5" />
                          <span className="flex-1 truncate">{a.label}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary-glow shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
                disabled={isIngesting}
                className="flex items-center gap-1.5 px-4 h-9 rounded-md bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                {isIngesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ingesting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
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

function Row({ k, v, tone }: { k: string; v: string; tone?: "critical" | "warning" | "positive" | "info" }) {
  const c = tone ? { critical: "text-critical", warning: "text-warning", positive: "text-positive", info: "text-info" }[tone] : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={cn("font-medium font-mono", c)}>{v}</span>
    </div>
  );
}

