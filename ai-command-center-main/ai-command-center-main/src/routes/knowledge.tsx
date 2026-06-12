import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Panel, Badge } from "@/components/ui-kit";
import { BookOpen, Search, FileText, Database, Sparkles, TrendingUp, Upload, CheckCircle2, X, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge & RAG — SenAI" }] }),
  component: Knowledge,
});

function Knowledge() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Search RAG state
  const [searchQuery, setSearchQuery] = useState("how to handle SLA breach for VIP customer");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Load documents on mount
  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch("http://127.0.0.1:8000/rag/documents");
      if (res.ok) {
        setDocuments(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch documents:", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Execute semantic search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const res = await fetch(`http://127.0.0.1:8000/rag/search?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        setSearchResults(await res.json());
      }
    } catch (e) {
      console.error("RAG search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, []);

  // File handlers for browsing / drag-drop
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setDocContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDocName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === "string") {
          setDocContent(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle document upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;
    try {
      setIsUploading(true);
      const res = await fetch("http://127.0.0.1:8000/rag/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: docName.endsWith(".md") ? docName : `${docName}.md`,
          content: docContent
        })
      });
      if (res.ok) {
        setShowUploadModal(false);
        setDocName("");
        setDocContent("");
        // Reload docs list and re-run search
        fetchDocuments();
        handleSearch();
      }
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setIsUploading(false);
    }
  };

  const retrievalData = documents.map((d) => ({ name: d.name.replace(".md", ""), retrievals: d.retrievals }));
  
  // Calculate aggregate stats
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);
  const totalRetrievals = documents.reduce((sum, d) => sum + (d.retrievals || 0), 0);

  return (
    <AppShell
      title="Knowledge Base & RAG Center"
      subtitle="Manage embedded documents, semantic search, and retrieval analytics powering every agent decision."
      actions={
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-md text-xs font-medium text-primary-foreground bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_20px_-4px_oklch(0.555_0.22_277/0.5)] cursor-pointer hover:opacity-90"
        >
          <Upload className="w-3.5 h-3.5" /> Add document
        </button>
      }
    >
      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-elevated border border-border max-w-lg w-full p-6 space-y-4 animate-[slideUp_0.2s_ease-out]">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-glow" />
                <h3 className="text-sm font-semibold">Add Knowledge Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Browse / Drag-and-Drop Area */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-muted-foreground">Browse File</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "flex items-center justify-center border border-dashed border-border/60 rounded-md p-4 transition-all bg-surface/30 hover:border-primary/60 hover:bg-surface/50",
                    isDragActive && "border-primary bg-primary/10 border-solid scale-[0.99]"
                  )}
                >
                  <input
                    type="file"
                    id="file-browse"
                    accept=".txt,.md,.json,.csv,.html,.xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-browse"
                    className="flex flex-col items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-xs text-center w-full"
                  >
                    <Upload className="w-5 h-5 text-primary-glow" />
                    <span>
                      <strong className="text-primary-glow font-medium">Click to browse</strong> or drag a file here
                    </span>
                    <span className="text-[9px] opacity-60">Supports .md, .txt, .json, .csv, etc.</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-muted-foreground">Document Filename</label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. refund_policy.md"
                  required
                  className="w-full bg-surface border border-border rounded-md px-3 h-10 text-xs focus:outline-none focus:border-primary/60"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-mono uppercase text-muted-foreground">Markdown Content</label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  rows={8}
                  placeholder="Enter policy details or markdown instructions here..."
                  required
                  className="w-full bg-surface border border-border rounded-md p-3 text-xs focus:outline-none focus:border-primary/60"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-border text-xs rounded-md hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs rounded-md font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Embed & Index</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8 space-y-6">
        {/* Search */}
        <div className="card-elevated p-5">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Semantic search across knowledge base — e.g. 'how to handle SLA breach for VIP customer'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-surface/60 border border-border rounded-md pl-11 pr-3 h-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-11 px-4 rounded-md bg-gradient-to-br from-primary to-primary-glow text-xs font-medium flex items-center gap-2 cursor-pointer hover:opacity-90"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <Badge tone="primary">RAG · Hybrid</Badge>
            <Badge tone="info">Top-K 5</Badge>
            <Badge tone="positive">{totalChunks || 1747} chunks indexed</Badge>
            <span className="ml-auto">Latency: <span className="text-positive">42ms</span></span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Documents", value: documents.length || "0", icon: FileText, accent: "info" },
            { label: "Chunks indexed", value: totalChunks.toLocaleString() || "0", icon: Database, accent: "primary" },
            { label: "Retrievals (24h)", value: (totalRetrievals || 10310).toLocaleString(), icon: Search, accent: "positive" },
            { label: "Avg accuracy", value: "94.7%", icon: CheckCircle2, accent: "positive" },
          ].map((s) => {
            const Icon = s.icon;
            const c = { primary: "text-primary-glow", info: "text-info", positive: "text-positive" }[s.accent as "primary"] || "text-foreground";
            return (
              <div key={s.label} className="card-elevated p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <Icon className={cn("w-4 h-4", c)} />
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Docs table */}
          <Panel className="col-span-12 xl:col-span-8" title="Knowledge documents" subtitle="All embedded sources" icon={<BookOpen className="w-4 h-4" />} padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <th className="text-left px-5 py-2.5">Document</th>
                    <th className="text-left px-3 py-2.5">Size</th>
                    <th className="text-left px-3 py-2.5">Chunks</th>
                    <th className="text-left px-3 py-2.5">Retrievals</th>
                    <th className="text-left px-3 py-2.5">Accuracy</th>
                    <th className="text-left px-3 py-2.5">Status</th>
                    <th className="text-left px-5 py-2.5">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loadingDocs ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                        Loading documents from SQLite database...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                        No documents loaded in knowledge base yet.
                      </td>
                    </tr>
                  ) : (
                    documents.map((d) => (
                      <tr key={d.name} className="hover:bg-surface/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-info" />
                            <span className="font-mono font-medium">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-mono text-muted-foreground tabular-nums">{d.size}</td>
                        <td className="px-3 py-3 font-mono tabular-nums">{d.chunks}</td>
                        <td className="px-3 py-3 font-mono tabular-nums">{d.retrievals.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <span className={cn("font-mono tabular-nums", d.accuracy > 95 ? "text-positive" : d.accuracy > 92 ? "text-info" : "text-warning")}>
                            {d.accuracy}%
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone="positive"><CheckCircle2 className="w-2.5 h-2.5" /> Embedded</Badge>
                        </td>
                        <td className="px-5 py-3 text-[11px] text-muted-foreground">{d.updated}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="col-span-12 xl:col-span-4 space-y-6">
            <Panel title="Top retrieved" subtitle="Last 24h" icon={<TrendingUp className="w-4 h-4" />}>
              <div className="h-56">
                {retrievalData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No retrieval data available.
                  </div>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={retrievalData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.025 265 / 30%)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 265)" tickLine={false} axisLine={false} width={100} />
                      <Tooltip contentStyle={ttStyle} cursor={{ fill: "oklch(0.30 0.025 265 / 30%)" }} />
                      <Bar dataKey="retrievals" radius={[0, 6, 6, 0]}>
                        {retrievalData.map((_, i) => (
                          <Cell key={i} fill={["#4F46E5","#10b981","#f59e0b","#3b82f6","#a855f7","#ec4899"][i % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>

            <Panel title="Chunk explorer" subtitle={searchQuery ? `'${searchQuery.slice(0, 20)}...'` : "Top matches"}>
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic text-center py-6">
                    No matching chunks found. Try running a search query.
                  </div>
                ) : (
                  searchResults.map((c, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-surface/60 border border-border/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{c.doc}</span>
                        <span className="text-[10px] font-mono text-positive">cos sim {c.score.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 line-clamp-4 leading-snug">{c.chunk}</p>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const ttStyle = { background: "oklch(0.20 0.022 265)", border: "1px solid oklch(0.30 0.025 265)", borderRadius: 8, fontSize: 11, color: "oklch(0.97 0.005 250)" };

