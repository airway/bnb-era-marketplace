import type { CategoryId, HireMandate } from "./types";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  short: string;
  blurb: string;
  keywords: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "monitoring",
    label: "Monitoring",
    short: "Watch markets, wallets, and positions",
    blurb: "Alerts when a wallet, pool, or price moves. No custody.",
    keywords: [
      "monitor",
      "watch",
      "alert",
      "radar",
      "sentinel",
      "scan",
      "tracker",
      "oracle",
      "price feed",
      "wallet watch",
    ],
  },
  {
    id: "grid",
    label: "Grid trading",
    short: "Range-bound automated strategies",
    blurb: "Places buys and sells inside a band you set.",
    keywords: ["grid", "range", "market make", "market-make", "mm bot", "spread"],
  },
  {
    id: "health-factor",
    label: "Health factor",
    short: "Loan health and liquidation defense",
    blurb: "Tracks LTV / health factor and acts before liquidation.",
    keywords: [
      "health factor",
      "health-factor",
      "liquidation",
      "ltv",
      "collateral",
      "venus",
      "aave",
      "borrow",
      "repay",
    ],
  },
  {
    id: "yield",
    label: "Yield",
    short: "Move capital to where it earns",
    blurb: "Vaults, farms, and LP rotation — including PancakeSwap.",
    keywords: [
      "yield",
      "apy",
      "apr",
      "farm",
      "vault",
      "restake",
      "pancake",
      "liquidity",
      "lp ",
      "harvest",
    ],
  },
  {
    id: "trading",
    label: "Trading",
    short: "Execution, DCA, and swaps",
    blurb: "Spot, DCA, and route-aware execution on BSC.",
    keywords: ["trad", "swap", "dca", "execution", "order", "arb", "funding"],
  },
  {
    id: "research",
    label: "Research",
    short: "Briefs, alpha, and pool demand",
    blurb: "Written research a human can act on.",
    keywords: ["research", "alpha", "sentiment", "brief", "muse", "orion", "trace"],
  },
  {
    id: "security",
    label: "Security",
    short: "Risk, phishing, and audit signals",
    blurb: "Screens contracts and counterparties before you sign.",
    keywords: ["security", "audit", "phish", "risk", "forge", "scan"],
  },
  {
    id: "payments",
    label: "Payments",
    short: "x402 and agent commerce",
    blurb: "Agents that settle over x402 / ERC-8183 rails.",
    keywords: ["x402", "payment", "commerce", "q402", "quack"],
  },
  {
    id: "other",
    label: "Other",
    short: "Unclassified on-chain identities",
    blurb: "Registered on ERC-8004, category not yet inferred.",
    keywords: [],
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>;

export const MANDATES: HireMandate[] = [
  {
    id: "watch-wallet",
    label: "Watch a wallet",
    category: "monitoring",
    description: "Ping on inbound/outbound transfers above a threshold for 7 days.",
    defaultBudget: 0.02,
  },
  {
    id: "grid-range",
    label: "Run a grid in range",
    category: "grid",
    description: "Place a 12-level grid on a BSC pair you name. Paper or live.",
    defaultBudget: 0.08,
  },
  {
    id: "hf-guard",
    label: "Guard a health factor",
    category: "health-factor",
    description: "Watch a Venus/Aave-style position and draft a repay if HF < 1.2.",
    defaultBudget: 0.05,
  },
  {
    id: "yield-rotate",
    label: "Rotate idle yield",
    category: "yield",
    description: "Compare two Pancake/vault venues and recommend a move. No custody.",
    defaultBudget: 0.04,
  },
  {
    id: "swap-route",
    label: "Quote a safe swap",
    category: "trading",
    description: "Return a PancakeSwap route with slippage and pool-risk notes.",
    defaultBudget: 0.015,
  },
  {
    id: "research-brief",
    label: "Write a market brief",
    category: "research",
    description: "One-page brief on a token or pool, with sources.",
    defaultBudget: 0.03,
  },
];
