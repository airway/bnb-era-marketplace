import { FETCH_CACHE } from "./fetch-cache";
import { operatorFor } from "./featured";
import type { CategoryId, MarketplaceAgent, StrategyFact, StrategySnapshot } from "./types";

const TIMEOUT_MS = 8000;

async function getJson(url: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: FETCH_CACHE, headers: { Accept: "application/json" } });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      body = { text: text.slice(0, 400) };
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, status: 0, body: { error: err instanceof Error ? err.message : "fetch failed" } };
  } finally {
    clearTimeout(t);
  }
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function fact(label: string, value: unknown, emptyWhen?: (v: unknown) => boolean): StrategyFact {
  if (value === null || value === undefined || value === "") {
    return { label, value: "not published", empty: true };
  }
  if (emptyWhen?.(value)) return { label, value: String(value), empty: true };
  return { label, value: typeof value === "number" ? formatNum(value) : String(value) };
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 100) return n.toFixed(2);
  if (Math.abs(n) >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

function discoverBase(agent: MarketplaceAgent): string | null {
  const known = operatorFor(agent.tokenId);
  if (known?.base) return known.base;
  const fromDesc = agent.description.match(/https?:\/\/[^\s]+/i)?.[0];
  if (fromDesc) {
    try {
      const u = new URL(fromDesc.replace(/[).,]+$/, ""));
      if (u.pathname.includes("/api") || u.hostname.includes("-api.") || u.pathname === "/") {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      /* ignore */
    }
  }
  for (const s of agent.services) {
    try {
      const u = new URL(s.endpoint);
      if (u.hostname.includes("nip.io") || u.hostname.includes("termix") || u.pathname.includes("/status")) {
        return `${u.protocol}//${u.host}`;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function discoverA2A(agent: MarketplaceAgent): string | null {
  const known = operatorFor(agent.tokenId);
  if (known?.a2a) return known.a2a;
  const a2a = agent.services.find((s) => /a2a/i.test(s.name) || s.endpoint.includes("agent-card") || s.endpoint.endsWith("/a2a"));
  if (!a2a) return null;
  if (a2a.endpoint.includes("agent-card")) {
    try {
      return new URL("/", a2a.endpoint).href;
    } catch {
      return a2a.endpoint;
    }
  }
  return a2a.endpoint;
}

function factsFor(category: CategoryId, status: Record<string, unknown>, extra: Record<string, unknown>): StrategyFact[] {
  if (category === "rebalancing") {
    const params = (extra.parameters as Record<string, unknown> | undefined) ?? {};
    const target = (extra.target_range_if_rebalanced_now as Record<string, unknown> | undefined) ?? {};
    return [
      fact("Pair", status.pair ?? params.pair),
      fact("In range", status.in_range),
      fact("Lower", status.lower_price ?? target.lower_price),
      fact("Upper", status.upper_price ?? target.upper_price),
      fact("Spot", status.current_price),
      fact("Range width", params.range_pct != null ? `${params.range_pct}%` : null),
      fact("Auto-reset trigger", params.trigger_pct != null ? `${params.trigger_pct}% of band` : null),
      fact("Rebalance now", status.rebalance_required),
      fact("Reason", status.rebalance_reason),
      fact("Rebalances", status.rebalance_count ?? extra.rebalance_count),
      fact("Last reset", status.last_rebalance ?? extra.last_rebalance),
      fact("APR (window)", status.apr != null ? `${formatNum(Number(status.apr))}%` : null),
      fact("PnL (USDT)", status.pnl ?? extra.pnl_usdt, (v) => v === 0),
      fact("TVL (USDT)", status.tvl ?? extra.tvl_usdt),
      fact("PnL 30d", status.pnl_30d, (v) => v === null),
    ];
  }
  if (category === "health-factor") {
    const th = (extra.thresholds as Record<string, unknown> | undefined) ?? {};
    return [
      fact("Venue", status.protocol ?? extra.protocols),
      fact("Account", status.account ?? extra.account),
      fact(
        "Health factor",
        status.health_factor ?? extra.health_factor,
        (v) => v === null || v === undefined,
      ),
      fact("Risk", status.risk ?? extra.risk),
      fact("Collateral", status.collateral, (v) => v === 0 || v === 0.0),
      fact("Debt", status.debt, (v) => v === 0 || v === 0.0),
      fact("Safe above", th.safe_above),
      fact("Critical at", th.critical_at_or_below),
      fact("Protections succeeded", extra.protections_succeeded, (v) => v === 0),
      fact("Protections attempted", extra.protections_attempted, (v) => v === 0),
      fact("Last protection", extra.last_protection ?? status.last_protection, (v) => v === null),
    ];
  }
  if (category === "yield") {
    return [
      fact("Status", status.status ?? extra.status),
      fact("Recommended venue", status.venue ?? status.recommended ?? extra.recommended),
      fact("APR / APY", status.apr ?? status.apy ?? extra.apr ?? extra.apy),
      fact("Asset", status.asset ?? extra.asset),
      fact("Last harvest", status.last_harvest ?? extra.last_harvest),
    ];
  }
  if (category === "grid") {
    return [
      fact("Pair", status.pair ?? extra.pair),
      fact("Range low", status.low ?? status.lower ?? extra.low),
      fact("Range high", status.high ?? status.upper ?? extra.high),
      fact("Levels", status.levels ?? extra.levels),
      fact("Fills", status.fills ?? status.fill_count ?? extra.fills, (v) => v === 0),
      fact("Inventory", status.inventory ?? extra.inventory),
    ];
  }
  return [fact("Status", status.status)];
}

export async function probeStrategy(agent: MarketplaceAgent): Promise<StrategySnapshot> {
  const probedAt = new Date().toISOString();
  const base = discoverBase(agent);
  const category = agent.primaryCategory === "other" ? agent.categories[0] ?? "other" : agent.primaryCategory;

  if (!base) {
    return {
      available: false,
      probedAt,
      sourceUrl: null,
      error: "No operator status URL in the registration file.",
      facts: [
        {
          label: "Live feed",
          value: "This identity does not publish /status, /strategy, or /performance.",
          empty: true,
        },
      ],
      raw: null,
    };
  }

  const [statusRes, strategyRes, perfRes] = await Promise.all([
    getJson(`${base}/status`),
    getJson(`${base}/strategy`),
    getJson(`${base}/performance`),
  ]);

  const status = (statusRes.ok && typeof statusRes.body === "object" && statusRes.body
    ? (statusRes.body as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const extra = {
    ...((strategyRes.ok && typeof strategyRes.body === "object" && strategyRes.body
      ? strategyRes.body
      : {}) as Record<string, unknown>),
    ...((perfRes.ok && typeof perfRes.body === "object" && perfRes.body
      ? perfRes.body
      : {}) as Record<string, unknown>),
  };

  if (!statusRes.ok && !strategyRes.ok && !perfRes.ok) {
    const err =
      statusRes.status === 502
        ? `Operator ${base} returned 502. Live strategy is down — not estimated.`
        : `Operator ${base} did not serve /status (${statusRes.status || "network"}).`;
    return {
      available: false,
      probedAt,
      sourceUrl: `${base}/status`,
      error: err,
      facts: [{ label: "Live feed", value: err, empty: true }],
      raw: { status: statusRes.body, strategy: strategyRes.body, performance: perfRes.body },
    };
  }

  const facts = factsFor(category, status, extra).filter((f) => f.value !== "undefined");
  return {
    available: true,
    probedAt,
    sourceUrl: statusRes.ok ? `${base}/status` : `${base}/strategy`,
    facts,
    raw: { status, strategy: extra },
  };
}

export function overlayTrackRecord(agent: MarketplaceAgent): MarketplaceAgent {
  const strategy = agent.strategy;
  if (!strategy?.available) return agent;
  const pnl = strategy.facts.find((f) => f.label.startsWith("PnL") && !f.empty);
  const apr = strategy.facts.find((f) => f.label.includes("APR") && !f.empty);
  const hf = strategy.facts.find((f) => f.label === "Health factor" && !f.empty);
  const notes = [
    agent.trackRecord.feedbackCount + agent.trackRecord.validationCount > 0
      ? agent.trackRecord.notes
      : "No ERC-8004 feedback events. Operator /status is shown separately and is not a win rate.",
    pnl ? `Operator PnL: ${pnl.value}` : null,
    apr ? `Operator APR: ${apr.value}` : null,
    hf ? `Operator HF: ${hf.value}` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    ...agent,
    trackRecord: {
      ...agent.trackRecord,
      source: agent.trackRecord.feedbackCount > 0 ? "erc-8004-reputation" : "operator-status",
      notes,
    },
  };
}

export { num, str, discoverBase };
