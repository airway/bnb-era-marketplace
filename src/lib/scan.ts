import { DEFAULT_CHAIN_ID, SCAN_API_BASE } from "./contracts";
import { normalizeScanAgent, type ScanAgentRaw } from "./normalize";
import type { AgentListResult, MarketplaceAgent } from "./types";

const TIMEOUT_MS = 8000;

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

async function scanFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (process.env.SCAN_API_KEY) headers["X-API-Key"] = process.env.SCAN_API_KEY;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${SCAN_API_BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
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
  if (!res.ok) {
    throw new Error(`8004scan HTTP ${res.status}`);
  }
  const body = (await res.json()) as ScanListResponse;
  if (!body.success) {
    throw new Error(body.error?.message ?? "8004scan returned success=false");
  }
  const rows = Array.isArray(body.data) ? body.data : body.data?.agents ?? [];
  const pagination = body.meta?.pagination;
  return {
    agents: rows.map((r) => normalizeScanAgent(r, "live")),
    total: pagination?.total ?? rows.length,
    page: pagination?.page ?? page,
    limit: pagination?.limit ?? limit,
    hasMore: pagination?.hasMore ?? rows.length >= limit,
    source: "live",
    liveAttempted: true,
  };
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
    const message = err instanceof Error ? err.message : "live index failed";
    return { error: message };
  }
}

export async function tryLiveAgent(
  chainId: number,
  tokenId: string,
): Promise<MarketplaceAgent | { error: string }> {
  try {
    return await fetchLiveAgent(chainId, tokenId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "live index failed";
    return { error: message };
  }
}
