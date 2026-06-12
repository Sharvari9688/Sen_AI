/**
 * inbox-store.ts
 * Reactive store for email threads connected to the FastAPI backend.
 */

export interface EmailThread {
  id: string;
  from: string;
  name: string;
  company: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  status: string;
  category: string;
  sentiment: "Critical" | "Negative" | "Neutral" | "Positive";
  urgency: "P0" | "P1" | "P2" | "P3";
  confidence: number;
  vip: boolean;
  isNew?: boolean;
}

let threads: EmailThread[] = [];

type Listener = (threads: EmailThread[]) => void;
const listeners = new Set<Listener>();

export function getThreads(): EmailThread[] {
  return threads;
}

export function subscribeThreads(fn: Listener): () => void {
  listeners.add(fn);
  // Trigger immediate fetch to populate UI
  syncThreads();
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn([...threads]));
}

/** Prepend a new thread helper (retained for animation UI fallback) */
export function prependThread(thread: EmailThread) {
  threads = [{ ...thread, isNew: true }, ...threads];
  setTimeout(() => {
    threads = threads.map((t) =>
      t.id === thread.id ? { ...t, isNew: false } : t
    );
    notify();
  }, 2500);
  notify();
}

/** Mark thread as read via backend status updates */
export async function markRead(id: string) {
  // We can let the backend know, or just update UI locally.
  threads = threads.map((t) => (t.id === id ? { ...t, unread: false } : t));
  notify();
}

/** Active polling function to sync client threads with database */
export async function syncThreads() {
  try {
    const res = await fetch("http://127.0.0.1:8000/threads");
    if (res.ok) {
      const data = await res.json();
      // Only notify if contents changed
      if (JSON.stringify(threads.map(t => ({...t, isNew: false}))) !== JSON.stringify(data.map((t: any) => ({...t, isNew: false})))) {
        // Carry over the isNew animation flag if any
        threads = data.map((newT: any) => {
          const oldT = threads.find(t => t.id === newT.id);
          return oldT ? { ...newT, isNew: oldT.isNew } : newT;
        });
        notify();
      }
    }
  } catch (e) {
    console.error("Failed to sync threads from backend:", e);
  }
}

// Start polling on startup
if (typeof window !== "undefined") {
  syncThreads();
  setInterval(syncThreads, 3000);
}

