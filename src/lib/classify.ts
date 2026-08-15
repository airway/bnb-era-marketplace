import { CATEGORIES } from "./categories";
import type { CategoryId, ProtocolTag } from "./types";

const PRIORITY: CategoryId[] = [
  "health-factor",
  "grid",
  "yield",
  "monitoring",
  "security",
  "payments",
  "research",
  "trading",
  "other",
];

export function classifyText(text: string): CategoryId[] {
  const hay = text.toLowerCase();
  const hits = new Set<CategoryId>();
  for (const cat of CATEGORIES) {
    if (cat.id === "other") continue;
    if (cat.keywords.some((k) => hay.includes(k))) hits.add(cat.id);
  }
  if (hits.size === 0) hits.add("other");
  return [...hits].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
}

export function primaryCategory(categories: CategoryId[]): CategoryId {
  return [...categories].sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0] ?? "other";
}

export function inferProtocols(input: {
  supported?: string[] | null;
  x402?: boolean;
  services?: { name?: string; endpoint?: string }[] | null;
}): ProtocolTag[] {
  const tags = new Set<ProtocolTag>();
  for (const raw of input.supported ?? []) {
    const p = raw.toUpperCase();
    if (p.includes("A2A")) tags.add("A2A");
    else if (p.includes("MCP")) tags.add("MCP");
    else if (p.includes("OASF")) tags.add("OASF");
    else if (p.includes("WEB")) tags.add("Web");
    else if (p.includes("X402")) tags.add("x402");
  }
  for (const svc of input.services ?? []) {
    const name = (svc.name ?? "").toLowerCase();
    if (name.includes("a2a")) tags.add("A2A");
    if (name.includes("mcp")) tags.add("MCP");
    if (name.includes("oasf")) tags.add("OASF");
    if (name.includes("web") || name.includes("http")) tags.add("Web");
  }
  if (input.x402) tags.add("x402");
  return [...tags];
}

export function defaultHirePrice(category: CategoryId, x402: boolean): number {
  const base: Record<CategoryId, number> = {
    monitoring: 0.02,
    grid: 0.08,
    "health-factor": 0.05,
    yield: 0.04,
    trading: 0.03,
    research: 0.025,
    security: 0.035,
    payments: 0.02,
    other: 0.02,
  };
  return Number((base[category] * (x402 ? 1 : 1.15)).toFixed(3));
}

export function looksLikeSpamName(name: string): boolean {
  const n = name.trim();
  if (n.length < 3) return true;
  if (/[ \-_.]/.test(n)) return false;
  if (/^[a-z]{6,16}ai$/i.test(n)) return true;
  if (/^[a-z]{8,}$/i.test(n)) {
    const vowels = (n.match(/[aeiou]/gi) ?? []).length;
    if (vowels / n.length < 0.4) return true;
  }
  return false;
}
