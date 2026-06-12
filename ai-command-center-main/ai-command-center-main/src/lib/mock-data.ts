// Mock data for SenAI CRM
export const heroMetrics = [
  { label: "Emails Processed Today", value: "0", change: "+0%", trend: "up", icon: "Mail", accent: "primary" },
  { label: "Critical Incidents", value: "0", change: "-0", trend: "down", icon: "AlertOctagon", accent: "critical" },
  { label: "Escalated Threads", value: "0", change: "+0", trend: "up", icon: "ArrowUpRight", accent: "warning" },
  { label: "Auto Resolved", value: "0", change: "0%", trend: "up", icon: "CheckCircle2", accent: "positive" },
  { label: "Active AI Agents", value: "8", change: "100%", trend: "up", icon: "Bot", accent: "info" },
  { label: "Avg Confidence", value: "9.5%", change: "+0.0%", trend: "up", icon: "Sparkles", accent: "primary" },
];

export const activityFeed = [
  { id: 1, type: "email", title: "New email from acme.corp", desc: "Subject: Urgent — production outage on Tier-1 cluster", time: "12s ago", severity: "critical" },
  { id: 2, type: "decision", title: "AI auto-resolved ticket #48291", desc: "Refund processed via policy match (confidence 97%)", time: "34s ago", severity: "positive" },
  { id: 3, type: "escalation", title: "Escalated to Legal Team", desc: "GDPR data-subject request from EU customer", time: "1m ago", severity: "warning" },
  { id: 4, type: "security", title: "Security alert: credential leak suspected", desc: "Pattern matched in inbound thread from unknown sender", time: "2m ago", severity: "critical" },
  { id: 5, type: "decision", title: "Drafted reply for review", desc: "VIP customer — confidence 88%, human review required", time: "3m ago", severity: "info" },
  { id: 6, type: "email", title: "New email from globex.io", desc: "Subject: Pricing inquiry for Enterprise tier", time: "4m ago", severity: "info" },
  { id: 7, type: "decision", title: "Knowledge base updated", desc: "refund_policy.md re-embedded (1,247 chunks)", time: "6m ago", severity: "positive" },
  { id: 8, type: "escalation", title: "Compliance flag raised", desc: "SOC-2 audit reference in customer message", time: "8m ago", severity: "warning" },
];

export const priorityQueue = [
  { level: "Critical", count: 23, color: "critical", desc: "Immediate action required" },
  { level: "High", count: 78, color: "warning", desc: "Within 1 hour" },
  { level: "Medium", count: 314, color: "info", desc: "Within 8 hours" },
  { level: "Low", count: 892, color: "positive", desc: "Standard queue" },
];

export const categories = [
  { name: "Complaints", count: 1842, pct: 18, color: "#ef4444" },
  { name: "Billing", count: 2914, pct: 28, color: "#4F46E5" },
  { name: "Legal", count: 312, pct: 3, color: "#f59e0b" },
  { name: "Compliance", count: 487, pct: 5, color: "#a855f7" },
  { name: "Feature Requests", count: 2103, pct: 20, color: "#10b981" },
  { name: "Bug Reports", count: 2689, pct: 26, color: "#3b82f6" },
];

export const sentimentBreakdown = [
  { name: "Positive", value: 4218, color: "#10b981" },
  { name: "Neutral", value: 5421, color: "#64748b" },
  { name: "Negative", value: 2014, color: "#f59e0b" },
  { name: "Critical", value: 1194, color: "#ef4444" },
];

export const sentimentTrend = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  positive: 80 + Math.round(Math.sin(i / 3) * 30 + Math.random() * 20),
  negative: 20 + Math.round(Math.cos(i / 4) * 15 + Math.random() * 15),
  critical: 5 + Math.round(Math.random() * 12),
}));

export const escalationTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  rate: 8 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 3),
  resolved: 60 + Math.round(Math.cos(i / 3) * 10 + Math.random() * 15),
}));

export const systemHealth = [
  { name: "RAG Engine", status: "operational", latency: "42ms", uptime: "99.99%" },
  { name: "Agent Runtime", status: "operational", latency: "118ms", uptime: "99.97%" },
  { name: "Vector Database", status: "operational", latency: "8ms", uptime: "100%" },
  { name: "Queue Worker", status: "degraded", latency: "412ms", uptime: "99.42%" },
  { name: "Web Intelligence", status: "operational", latency: "1.2s", uptime: "99.81%" },
];

export const inboxFolders = [
  { name: "Inbox", count: 1287, icon: "Inbox" },
  { name: "Needs Review", count: 42, icon: "Eye" },
  { name: "Escalated", count: 18, icon: "ArrowUpRight" },
  { name: "Spam", count: 234, icon: "Ban" },
  { name: "Security", count: 7, icon: "ShieldAlert" },
  { name: "Legal", count: 12, icon: "Scale" },
  { name: "Compliance", count: 9, icon: "FileCheck" },
  { name: "Resolved", count: 9412, icon: "CheckCircle2" },
];



export const agents = [
  { id: "ag-classifier", name: "Intent Classifier", role: "Classification", status: "running", tasks: 1287, success: 98.4, avgMs: 142 },
  { id: "ag-rag", name: "RAG Reasoner", role: "Retrieval", status: "running", tasks: 942, success: 96.1, avgMs: 412 },
  { id: "ag-responder", name: "Response Drafter", role: "Generation", status: "running", tasks: 718, success: 94.7, avgMs: 1840 },
  { id: "ag-escalator", name: "Escalation Router", role: "Routing", status: "running", tasks: 187, success: 99.5, avgMs: 88 },
  { id: "ag-legal", name: "Legal Sentinel", role: "Compliance", status: "idle", tasks: 34, success: 100, avgMs: 612 },
  { id: "ag-security", name: "Security Watchdog", role: "Threat Detection", status: "running", tasks: 412, success: 97.8, avgMs: 218 },
  { id: "ag-billing", name: "Billing Resolver", role: "Resolution", status: "running", tasks: 218, success: 92.1, avgMs: 2104 },
  { id: "ag-crm", name: "CRM Sync", role: "Integration", status: "degraded", tasks: 1842, success: 88.2, avgMs: 320 },
];

export const toolUsage = [
  { tool: "vector_search", calls: 4218 },
  { tool: "send_email", calls: 2104 },
  { tool: "create_ticket", calls: 1287 },
  { tool: "crm_lookup", calls: 3104 },
  { tool: "web_search", calls: 612 },
  { tool: "slack_notify", calls: 487 },
];

export const knowledgeDocs = [
  { name: "pricing_policy.md", size: "42 KB", chunks: 124, embedded: true, retrievals: 1842, accuracy: 94.2, updated: "2h ago" },
  { name: "refund_policy.md", size: "28 KB", chunks: 87, embedded: true, retrievals: 1247, accuracy: 96.8, updated: "1d ago" },
  { name: "sla_policy.md", size: "61 KB", chunks: 198, embedded: true, retrievals: 2412, accuracy: 92.1, updated: "5h ago" },
  { name: "compliance_faq.md", size: "104 KB", chunks: 342, embedded: true, retrievals: 487, accuracy: 91.7, updated: "3d ago" },
  { name: "escalation_matrix.md", size: "18 KB", chunks: 54, embedded: true, retrievals: 1104, accuracy: 98.2, updated: "1w ago" },
  { name: "api_docs.md", size: "284 KB", chunks: 942, embedded: true, retrievals: 3218, accuracy: 95.4, updated: "4h ago" },
];

export const webIntel = {
  trustpilot: { score: 4.6, reviews: 12847, trend: "+0.2" },
  g2: { score: 4.8, reviews: 1247, trend: "+0.1" },
  capterra: { score: 4.7, reviews: 842, trend: "0" },
  nps: { score: 62, trend: "+4" },
};

export const reviewTrend = Array.from({ length: 12 }, (_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  reviews: 80 + Math.round(Math.random() * 60),
  rating: 4.2 + Math.random() * 0.6,
}));

export const competitorPricing = [
  { name: "SenAI", starter: 49, pro: 199, enterprise: 999 },
  { name: "Competitor A", starter: 59, pro: 249, enterprise: 1299 },
  { name: "Competitor B", starter: 39, pro: 179, enterprise: 849 },
  { name: "Competitor C", starter: 79, pro: 299, enterprise: 1599 },
];

export const marketInsights = [
  { title: "Pricing pressure detected", desc: "Competitor B reduced starter tier by 12% — review pricing strategy for Q1.", severity: "warning" },
  { title: "Sentiment uptick on G2", desc: "Last 30 days show +0.3 rating increase driven by 'ease of integration' mentions.", severity: "positive" },
  { title: "New entrant in EU market", desc: "ZenithCRM launched in DACH region — monitor share-of-voice.", severity: "info" },
  { title: "Negative review cluster", desc: "Trustpilot: 7 reviews citing onboarding friction in last 72h.", severity: "critical" },
];

export const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  p50: 40 + Math.round(Math.sin(i / 3) * 12 + Math.random() * 8),
  p95: 180 + Math.round(Math.cos(i / 4) * 40 + Math.random() * 30),
  p99: 420 + Math.round(Math.random() * 80),
}));

export const heatmap = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => ({
    day: d, hour: h,
    value: Math.round(Math.random() * 100 * (h > 8 && h < 20 ? 1 : 0.4)),
  }))
).flat();



// ── Sample emails for the "Simulate Email Ingest" button ─────────────────────
export const sampleIngestEmails = [
  {
    from: "cto@hyperwave.io",
    name: "David Park",
    company: "HyperWave Inc.",
    subject: "API latency spike — degrading our SLA commitments",
    preview: "We noticed a 400% increase in p95 latency on your REST API since 14:00 UTC. This is directly violating our SLA…",
    category: "Bug Report",
    sentiment: "Critical" as const,
    urgency: "P0" as const,
    confidence: 96,
    vip: true,
  },
  {
    from: "finance@prism-analytics.com",
    name: "Priya Sharma",
    company: "Prism Analytics",
    subject: "Double billing on November subscription",
    preview: "Our credit card was charged twice for the November Pro plan. Transaction IDs: TXN-88211 and TXN-88219…",
    category: "Billing",
    sentiment: "Negative" as const,
    urgency: "P1" as const,
    confidence: 93,
    vip: false,
  },
  {
    from: "dpo@verdant-health.eu",
    name: "Klaus Müller",
    company: "Verdant Health EU",
    subject: "GDPR Data Processing Agreement — renewal required",
    preview: "Our current DPA with SenAI expires Dec 31. Per GDPR Article 28 we must have a signed agreement in place before…",
    category: "Legal",
    sentiment: "Neutral" as const,
    urgency: "P1" as const,
    confidence: 89,
    vip: false,
  },
  {
    from: "security@ironclad-ventures.com",
    name: "Tanya Rivers",
    company: "IronClad Ventures",
    subject: "Suspicious OAuth token usage detected",
    preview: "Our SIEM flagged anomalous OAuth activity from IP 185.220.101.x using our SenAI integration credentials…",
    category: "Security",
    sentiment: "Critical" as const,
    urgency: "P0" as const,
    confidence: 98,
    vip: true,
  },
  {
    from: "product@starflow.app",
    name: "Mia Chen",
    company: "StarFlow",
    subject: "Feature request: Webhook delivery retries with backoff",
    preview: "We'd love to see configurable retry policies for webhooks. Currently a single failure drops the event entirely…",
    category: "Feature Request",
    sentiment: "Positive" as const,
    urgency: "P3" as const,
    confidence: 91,
    vip: false,
  },
  {
    from: "ops@deeproute.ai",
    name: "Raj Anand",
    company: "DeepRoute AI",
    subject: "Bulk export job stuck at 0% for 3 hours",
    preview: "We kicked off a data export for Q3 analytics at 10:00 AM and it has been sitting at 0% since. Job ID: EXPORT-8821…",
    category: "Bug Report",
    sentiment: "Negative" as const,
    urgency: "P1" as const,
    confidence: 87,
    vip: false,
  },
  {
    from: "hello@novatech-startup.io",
    name: "Lena Kovacs",
    company: "NovaTech",
    subject: "Interested in upgrading to Enterprise — quick question",
    preview: "Our team has been loving SenAI! We're evaluating the Enterprise plan and would love clarity on custom SSO and…",
    category: "Sales",
    sentiment: "Positive" as const,
    urgency: "P2" as const,
    confidence: 95,
    vip: false,
  },
];
