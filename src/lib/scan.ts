import { DESKS } from "./categories";
import { DEFAULT_CHAIN_ID, SCAN_API_BASE } from "./contracts";
import { FETCH_CACHE } from "./fetch-cache";
import { normalizeScanAgent, type ScanAgentRaw } from "./normalize";
import type { AgentListResult, CategoryId, MarketplaceAgent } from "./types";

const TIMEOUT_MS = 10000;

const deskCache = new Map<string, { at: number; value: AgentListResult }>();
const DESK_TTL_MS = 60_000;

interface ScanListResponse {
  success?: boolean;
  data?: ScanAgentRaw[] | { agents?: ScanAgentRaw[] };
  meta?: { pagination?: { page?: number; limit?: number; total?: number; hasMore?: boolean } };
  error?: { message?: string };
}

interface ScanOneResponse {
  success?: boolean;
  data?: ScanAgentRaw;
  error?: { message?: string };
}

async function scanFetch(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.SCAN_API_KEY) headers["X-API-Key"] = process.env.SCAN_API_KEY;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${SCAN_API_BASE}${path}`, {
      headers,
      signal: ctrl.signal,
      cache: FETCH_CACHE,
    });
  } finally {
    clearTimeout(t);
  }
}

function parseList(body: ScanListResponse, page: number, limit: number, source: "live"): AgentListResult {
  if (!body.success) throw new Error(body.error?.message ?? "8004scan returned success=false");
  const rows = Array.isArray(body.data) ? body.data : body.data?.agents ?? [];
  const pagination = body.meta?.pagination;
  return {
    agents: rows.map((r) => normalizeScanAgent(r, source)),
    total: pagination?.total ?? rows.length,
    page: pagination?.page ?? page,
    limit: pagination?.limit ?? limit,
    hasMore: pagination?.hasMore ?? rows.length >= limit,
    source,
    liveAttempted: true,
  };
}

export async function fetchLiveAgents(opts: {
  page?: number;
  limit?: number;
  search?: string;
  chainId?: number;
}): Promise<AgentListResult> {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 24, 50);
  const chainId = opts.chainId ?? DEFAULT_CHAIN_ID;
  const params = new URLSearchParams({
    chainId: String(chainId),
    page: String(page),
    limit: String(limit),
    sortBy: "created_at",
    sortOrder: "desc",
  });
  if (opts.search) params.set("search", opts.search);
  const res = await scanFetch(`/agents?${params.toString()}`);
  if (!res.ok) throw new Error(`8004scan HTTP ${res.status}`);
  return parseList((await res.json()) as ScanListResponse, page, limit, "live");
}

export async function searchLiveDesk(
  category: Exclude<CategoryId, "other">,
  limit = 20,
): Promise<AgentListResult> {
  const hit = deskCache.get(category);
  if (hit && Date.now() - hit.at < DESK_TTL_MS) return hit.value;
  const desk = DESKS.find((d) => d.id === category)!;
  const seen = new Map<string, MarketplaceAgent>();
  let lastError: string | null = null;
  let liveHit = false;
  for (const term of desk.searchTerms) {
    try {
      const page = await fetchLiveAgents({ search: term, limit, page: 1 });
      liveHit = true;
      for (const a of page.agents) {
        if (!seen.has(a.tokenId)) seen.set(a.tokenId, a);
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "search failed";
    }
  }
  const agents = [...seen.values()].filter((a) => {
    const fit = a.fit?.find((f) => f.category === category);
    return (fit?.score ?? 0) >= 2;
  });
  if (!liveHit) throw new Error(lastError ?? "8004scan search failed");
  const result: AgentListResult = {
    agents,
    total: agents.length,
    page: 1,
    limit,
    hasMore: false,
    source: "live",
    liveAttempted: true,
  };
  deskCache.set(category, { at: Date.now(), value: result });
  return result;
}

export async function fetchLiveAgent(chainId: number, tokenId: string): Promise<MarketplaceAgent> {
  const res = await scanFetch(`/agents/${chainId}/${tokenId}`);
  if (!res.ok) throw new Error(`8004scan HTTP ${res.status}`);
  const body = (await res.json()) as ScanOneResponse;
  if (!body.success || !body.data) {
    throw new Error(body.error?.message ?? "Agent not found on 8004scan");
  }
  return normalizeScanAgent(body.data, "live");
}

export async function tryLiveAgents(opts: {
  page?: number;
  limit?: number;
  search?: string;
  chainId?: number;
}): Promise<AgentListResult | { error: string }> {
  try {
    return await fetchLiveAgents(opts);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "live index failed" };
  }
}

export async function tryLiveDesk(
  category: Exclude<CategoryId, "other">,
): Promise<AgentListResult | { error: string }> {
  try {
    return await searchLiveDesk(category);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "live desk search failed" };
  }
}

export async function tryLiveAgent(
  chainId: number,
  tokenId: string,
): Promise<MarketplaceAgent | { error: string }> {
  try {
    return await fetchLiveAgent(chainId, tokenId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "live index failed" };
  }
}
