import type { CategoryId } from "./types";

/** Live operator bases taken from ERC-8004 registration files (not invented). */
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
  "265876": {
    base: "https://bnb-yield.172-104-171-139.nip.io",
    a2a: "https://bnb-yield.172-104-171-139.nip.io/a2a",
    category: "yield",
  },
};

export const FEATURED_BY_DESK: Record<Exclude<CategoryId, "other">, string[]> = {
  rebalancing: ["265375", "266231"],
  grid: ["267697", "266234"],
  yield: ["265876", "267698", "266232"],
  "health-factor": ["266933", "266229", "259573"],
};

export function operatorFor(tokenId: string) {
  return OPERATOR_BY_TOKEN[tokenId];
}
