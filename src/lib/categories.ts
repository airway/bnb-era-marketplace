import type { CategoryId, HireMandate } from "./types";

export interface CategoryDef {
  id: Exclude<CategoryId, "other">;
  label: string;
  short: string;
  blurb: string;
  youProvide: string;
  youGet: string;
  risk: string;
  searchTerms: string[];
  keywords: string[];
  penalties: string[];
}

/** Official four desks — equal product depth. */
export const DESKS: CategoryDef[] = [
  {
    id: "rebalancing",
    label: "Rebalancing",
    short: "Keep a position inside the band you set",
    blurb: "Moves LP or portfolio inventory when price walks out of range. You sign; it does not hold keys.",
    youProvide: "Pair, LP range width, auto-reset trigger (percent of band).",
    youGet: "Live range / in-range / last reset from the operator when published, then an ERC-8183 job.",
    risk: "Inventory and IL. Empty operator fields stay empty — we do not invent a backtest.",
    searchTerms: ["rebalance", "rebalancer", "lp-rebalance", "range rebalancer"],
    keywords: [
      "rebalanc",
      "range rebalanc",
      "lp rebalanc",
      "lp range",
      "auto reset",
      "auto-reset",
      "concentrated-liquidity",
      "concentrated liquidity",
      "inventory",
      "portfolio rebalanc",
    ],
    penalties: ["yin yang", "metaphysics", "bort ", "yi he nexus"],
  },
  {
    id: "grid",
    label: "Grid trading",
    short: "Buy and sell inside a range",
    blurb: "Lays a ladder of bids and asks on a BSC pair. Paper or live, with a band you name.",
    youProvide: "Pair, low/high, number of levels, paper vs live.",
    youGet: "A grid plan (levels, inventory, fee estimate) from a registered agent.",
    risk: "Range break and inventory. 'Energy grid' names are filtered out.",
    searchTerms: ["grid trading", "grid-trading", "gridmaster", "bounded-grid", "grid"],
    keywords: ["grid trad", "grid-trad", "bounded-grid", "gridmaster", "grid bot", "\\bgrid\\b"],
    penalties: ["energy grid", "landing page", "hodlai", "silicon life"],
  },
  {
    id: "yield",
    label: "Yield optimisation",
    short: "Move idle capital to where it earns",
    blurb: "Compares Venus / Pancake / vault APYs and recommends a rotation. No custody in this hire flow.",
    youProvide: "Asset, venues to compare, minimum APY, risk cap.",
    youGet: "A ranked venue list and a recommended move, tied to an ERC-8004 identity.",
    risk: "APY is point-in-time. Optimistic-rollup name collisions are filtered.",
    searchTerms: ["yield", "yield optimizer", "yield-optimisation", "yield compass"],
    keywords: ["yield", "apy", "farm", "vault", "harvest", "optimis"],
    penalties: ["optimistic rollup", "self building", "clawpump", "^hue$"],
  },
  {
    id: "health-factor",
    label: "Health factor monitoring",
    short: "Act before a loan is liquidated",
    blurb: "Watches Venus / Aave-style health factor and drafts a repay or collateral add.",
    youProvide: "Venue, account or position, health-factor floor.",
    youGet: "Current HF (when the agent can read it) and a bounded rescue plan.",
    risk: "Liquidation is fast. Empty on-chain feedback means you are hiring identity, not a proven track record.",
    searchTerms: ["health factor", "lending guardian", "lending-rescue", "liquidation"],
    keywords: ["health factor", "health-factor", "liquidation", "lending", "collateral", "venus", "aave", "repay"],
    penalties: ["yield-farmer", "yield compass", "yield optim", "coinank", "landing page"],
  },
];

export const CATEGORIES = DESKS;

export const CATEGORY_BY_ID = Object.fromEntries(DESKS.map((c) => [c.id, c])) as Record<
  Exclude<CategoryId, "other">,
  CategoryDef
>;

export const MANDATES: HireMandate[] = [
  {
    id: "rebalance-range",
    label: "Rebalance a range / weights",
    category: "rebalancing",
    description: "Propose the smallest move that puts a Pancake V3 or portfolio position back in band.",
    defaultBudget: 0.05,
    fields: [
      { id: "pair", label: "Pair", placeholder: "BNB/USDT V3", defaultValue: "BNB/USDT" },
      { id: "rangePct", label: "Range width", placeholder: "10%", defaultValue: "10%" },
      { id: "triggerPct", label: "Auto-reset trigger", placeholder: "5% of band", defaultValue: "5%" },
    ],
  },
  {
    id: "grid-range",
    label: "Run a grid in range",
    category: "grid",
    description: "Build or reject a grid under volatility, fee, and slippage bounds.",
    defaultBudget: 0.08,
    fields: [
      { id: "pair", label: "Pair", placeholder: "WBNB/USDT", defaultValue: "WBNB/USDT" },
      { id: "low", label: "Range low", placeholder: "price", defaultValue: "500" },
      { id: "high", label: "Range high", placeholder: "price", defaultValue: "700" },
      { id: "levels", label: "Levels", placeholder: "12", defaultValue: "12" },
    ],
  },
  {
    id: "yield-rotate",
    label: "Optimise idle yield",
    category: "yield",
    description: "Compare two or more BSC venues and recommend a rotation. You sign the move.",
    defaultBudget: 0.04,
    fields: [
      { id: "asset", label: "Asset", placeholder: "USDT", defaultValue: "USDT" },
      { id: "minApy", label: "Minimum APY", placeholder: "4%", defaultValue: "4%" },
    ],
  },
  {
    id: "hf-guard",
    label: "Guard a health factor",
    category: "health-factor",
    description: "Watch a Venus/Aave-style position and draft a repay if HF crosses your floor.",
    defaultBudget: 0.05,
    fields: [
      { id: "venue", label: "Venue", placeholder: "Venus", defaultValue: "Venus" },
      { id: "floor", label: "HF floor", placeholder: "1.20", defaultValue: "1.20" },
    ],
  },
];
