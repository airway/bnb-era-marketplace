import type { HireRecord, MarketplaceAgent } from "./types";

const COMPARE_KEY = "era.compare";
const HIRES_KEY = "era.hires";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getCompareIds(): string[] {
  return readJson<string[]>(COMPARE_KEY, []);
}

export function toggleCompare(id: string): string[] {
  const cur = getCompareIds();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  return next;
}

export function clearCompare() {
  localStorage.removeItem(COMPARE_KEY);
}

export function saveHireLocal(hire: HireRecord) {
  const cur = readJson<HireRecord[]>(HIRES_KEY, []);
  localStorage.setItem(HIRES_KEY, JSON.stringify([hire, ...cur.filter((h) => h.hireId !== hire.hireId)]));
}

export function getLocalHires(): HireRecord[] {
  return readJson<HireRecord[]>(HIRES_KEY, []);
}

export function rememberAgents(agents: MarketplaceAgent[]) {
  if (typeof window === "undefined") return;
  const map = readJson<Record<string, MarketplaceAgent>>("era.agents", {});
  for (const a of agents) {
    map[a.id] = a;
    map[a.tokenId] = a;
  }
  localStorage.setItem("era.agents", JSON.stringify(map));
}

export function recallAgent(id: string): MarketplaceAgent | undefined {
  const map = readJson<Record<string, MarketplaceAgent>>("era.agents", {});
  return map[id];
}
