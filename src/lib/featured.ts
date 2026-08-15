import type { CategoryId } from "./types";

/** Live operator bases taken from ERC-8004 registration files (not invented).
 *  `#265876` is a real yield identity whose operator returned HTTP 502 — not listed here,
 *  not featured, and not treated as a live A2A. We do not invent a replacement host. */
export const OPERATOR_BY_TOKEN: Record<
  string,
  { base?: string; a2a?: string; category: Exclude<CategoryId, "other"> }
> = {
  "265375": {
    base: "https://bnb-lp-api.172-104-171-139.nip.io",
    a2a: "https://bnb-lp.172-104-171-139.nip.io/",
    category: "rebalancing",
  },
  "266933": {
    base: "https://bnb-guardian.172-104-171-139.nip.io",
    a2a: "https://bnb-guardian.172-104-171-139.nip.io/a2a",
    category: "health-factor",
  },
};

/** Lead cards: live operator when one answers. Grid leads with the first honest
 *  registered identity (`#266234`) — Termix card is a live status URL, not a hireable A2A.
 *  Yield has no live operator; do not lead with the 502 host. */
export const FEATURED_BY_DESK: Record<Exclude<CategoryId, "other">, string[]> = {
  rebalancing: ["265375"],
  grid: ["266234"],
  yield: [],
  "health-factor": ["266933"],
};

/** Agent Studio /launch listings — real token IDs, no A2A, not featured. */
export const STUDIO_STUBS = new Set(["267697", "267698"]);

export function operatorFor(tokenId: string) {
  return OPERATOR_BY_TOKEN[tokenId];
}
