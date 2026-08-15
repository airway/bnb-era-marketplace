import { DESKS } from "./categories";
import { isTermixCatalogUrl } from "./endpoints";
import type { CategoryId, FitBreakdown, HireReadiness, MarketplaceAgent } from "./types";

export function fitForDesk(text: string, deskId: Exclude<CategoryId, "other">): FitBreakdown {
  const desk = DESKS.find((d) => d.id === deskId)!;
  const hay = text.toLowerCase();
  const matched: string[] = [];
  let score = 0;
  for (const k of desk.keywords) {
    const hit =
      k.startsWith("\\b") || k.startsWith("^")
        ? new RegExp(k, "i").test(hay)
        : hay.includes(k.toLowerCase());
    if (hit) {
      score += 2;
      matched.push(k);
    }
  }
  for (const p of desk.penalties) {
    const pat = p.startsWith("^") ? new RegExp(p, "i") : null;
    if (pat ? pat.test(hay) : hay.includes(p.toLowerCase())) score -= 3;
  }
  return { category: deskId, score, matched };
}

export function classifyText(text: string): FitBreakdown[] {
  return DESKS.map((d) => fitForDesk(text, d.id)).sort((a, b) => b.score - a.score);
}

export function categoriesFromFits(fits: FitBreakdown[], min = 2): CategoryId[] {
  const hits = fits.filter((f) => f.score >= min).map((f) => f.category);
  return hits.length ? hits : ["other"];
}

export function primaryCategory(fits: FitBreakdown[]): CategoryId {
  const top = fits[0];
  return top && top.score >= 2 ? top.category : "other";
}

export function inferProtocols(input: {
  supported?: string[] | null;
  x402?: boolean;
  services?: { name?: string; endpoint?: string }[] | null;
}): Array<"A2A" | "MCP" | "OASF" | "Web" | "x402" | "HTTP"> {
  const tags = new Set<"A2A" | "MCP" | "OASF" | "Web" | "x402" | "HTTP">();
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

/** List price is unpublished unless an operator quote says otherwise. Do not invent one. */
export function defaultHirePrice(_category?: CategoryId, _x402?: boolean): number | null {
  return null;
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

export function readinessOf(agent: Pick<
  MarketplaceAgent,
  | "tokenId"
  | "owner"
  | "agentWallet"
  | "services"
  | "x402"
  | "trackRecord"
  | "supportedTrust"
  | "tokenUri"
  | "strategy"
  | "a2aUrl"
>): HireReadiness {
  return {
    hasIdentity: Boolean(agent.tokenId),
    hasOwner: Boolean(agent.owner),
    hasWallet: Boolean(agent.agentWallet),
    hasEndpoint: agent.services.length > 0,
    hasX402: agent.x402,
    hasFeedback: agent.trackRecord.feedbackCount > 0 || agent.trackRecord.validationCount > 0,
    hasTrust: agent.supportedTrust.length > 0,
    hasOnchainUri: Boolean(agent.tokenUri),
    hasLiveStrategy: Boolean(agent.strategy?.available),
    hasA2A:
      Boolean(agent.a2aUrl) ||
      agent.services.some((s) => /a2a/i.test(s.name) && !isTermixCatalogUrl(s.endpoint)),
  };
}
