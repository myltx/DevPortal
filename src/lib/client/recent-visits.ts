import { STORAGE_KEYS } from "@/lib/config/app-registry";

export type RecentVisitKind = "app" | "project" | "module";

export interface RecentVisitEntry {
  id: string;
  kind: RecentVisitKind;
  title: string;
  path: string;
  lastVisitedAt: number;
  visitCount: number;
  meta?: Record<string, unknown>;
}

const MAX_ENTRIES = 50;

const safeParse = (raw: string | null): RecentVisitEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => x as RecentVisitEntry)
      .filter(
        (x) =>
          typeof x.id === "string" &&
          (x.kind === "app" || x.kind === "project" || x.kind === "module") &&
          typeof x.title === "string" &&
          typeof x.path === "string" &&
          typeof x.lastVisitedAt === "number" &&
          typeof x.visitCount === "number",
      );
  } catch {
    return [];
  }
};

export const getRecentVisitEntries = (): RecentVisitEntry[] => {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEYS.RECENT_VISITS));
};

export const saveRecentVisitEntries = (entries: RecentVisitEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEYS.RECENT_VISITS,
    JSON.stringify(entries.slice(0, MAX_ENTRIES)),
  );
};

export const recordRecentVisit = (
  input: Omit<RecentVisitEntry, "lastVisitedAt" | "visitCount"> & {
    meta?: Record<string, unknown>;
  },
) => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const current = getRecentVisitEntries();
  const existingIndex = current.findIndex((x) => x.id === input.id);

  let next: RecentVisitEntry[];
  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const updated: RecentVisitEntry = {
      ...existing,
      ...input,
      lastVisitedAt: now,
      visitCount: Number(existing.visitCount || 0) + 1,
    };
    next = [updated, ...current.filter((_, i) => i !== existingIndex)];
  } else {
    const created: RecentVisitEntry = {
      ...input,
      lastVisitedAt: now,
      visitCount: 1,
    };
    next = [created, ...current];
  }

  saveRecentVisitEntries(next);
};

export const clearRecentVisits = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.RECENT_VISITS);
};

export const clearRecentVisitsByKind = (kind: RecentVisitKind) => {
  if (typeof window === "undefined") return;
  const next = getRecentVisitEntries().filter((x) => x.kind !== kind);
  if (next.length === 0) {
    localStorage.removeItem(STORAGE_KEYS.RECENT_VISITS);
    return;
  }
  saveRecentVisitEntries(next);
};

export const getRecentVisits = (opts?: {
  kind?: RecentVisitKind;
  limit?: number;
}) => {
  const entries = getRecentVisitEntries();
  const kind = opts?.kind;
  const limit = opts?.limit ?? 8;
  return entries
    .filter((x) => (kind ? x.kind === kind : true))
    .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
    .slice(0, limit);
};

export const getFrequentVisits = (opts?: {
  kind?: RecentVisitKind;
  limit?: number;
}) => {
  const entries = getRecentVisitEntries();
  const kind = opts?.kind;
  const limit = opts?.limit ?? 8;
  return entries
    .filter((x) => (kind ? x.kind === kind : true))
    .sort((a, b) => b.visitCount - a.visitCount || b.lastVisitedAt - a.lastVisitedAt)
    .slice(0, limit);
};
