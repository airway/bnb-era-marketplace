import { looksLikeSpamName } from "./classify";
import { allFallbackAgents, referenceAgents, snapshotAgents, snapshotPagination, SNAPSHOT_CAPTURED_AT } from "./fallback";
import { tryLiveAgent, tryLiveAgents } from "./scan";
import type { AgentListResult, CategoryId, MarketplaceAgent } from "./types";

export interface ListQuery {
  q?: string;
  category?: CategoryId | "all";
  x402?: boolean;
  hideSpam?: boolean;
  includeReference?: boolean;
  page?: number;
  limit?: number;
  sort?: "newest" | "price" | "score" | "name";
  preferLive?: boolean;
}

function matchesQuery(agent: MarketplaceAgent, q: ListQuery): boolean {
  if (q.category && q.category !== "all" && !agent.categories.includes(q.category)) {
    return false;
  }
  if (q.x402 && !agent.x402) return false;
  if (q.hideSpam && looksLikeSpamName(agent.name) && agent.source !== "reference") {
    return false;
  }
  if (q.q) {
    const hay = `${agent.name} ${agent.description} ${agent.tokenId} ${agent.owner} ${agent.categories.join(" ")}`.toLowerCase();
    if (!hay.includes(q.q.toLowerCase())) return false;
  }
  return true;
}

function sortAgents(agents: MarketplaceAgent[], sort: ListQuery["sort"]): MarketplaceAgent[] {
  const copy = [...agents];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => a.hirePriceTbnb - b.hirePriceTbnb);
    case "score":
      return copy.sort(
        (a, b) =>
          b.trackRecord.averageScore - a.trackRecord.averageScore ||
          b.trackRecord.feedbackCount - a.trackRecord.feedbackCount,
      );
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }
}

function paginate(agents: MarketplaceAgent[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return {
    slice: agents.slice(start, start + limit),
    total: agents.length,
    hasMore: start + limit < agents.length,
  };
}

export async function listMarketplaceAgents(q: ListQuery): Promise<AgentListResult> {
  const page = q.page ?? 1;
  const limit = q.limit ?? 24;
  const includeReference = q.includeReference !== false;
  const preferLive = q.preferLive !== false;

  let live: AgentListResult | { error: string } | null = null;
  if (preferLive) {
    live = await tryLiveAgents({
      page,
      limit,
      search: q.q,
    });
  }

  if (live && "agents" in live) {
    let agents = live.agents;
    if (includeReference) {
      const extras = referenceAgents().filter((a) => matchesQuery(a, q));
      agents = [...extras, ...agents];
    }
    agents = agents.filter((a) => matchesQuery(a, { ...q, q: undefined }));
    agents = sortAgents(agents, q.sort);
    return {
      ...live,
      agents,
      total: (live.total ?? agents.length) + (includeReference ? referenceAgents().filter((a) => matchesQuery(a, q)).length : 0),
      warning: undefined,
    };
  }

  const pool = includeReference ? allFallbackAgents() : snapshotAgents();
  const filtered = sortAgents(pool.filter((a) => matchesQuery(a, q)), q.sort);
  const { slice, total, hasMore } = paginate(filtered, page, limit);
  const pag = snapshotPagination();
  return {
    agents: slice,
    total,
    page,
    limit,
    hasMore,
    source: slice.some((a) => a.source === "snapshot") ? "snapshot" : "reference",
    liveAttempted: preferLive,
    warning:
      live && "error" in live
        ? `Live 8004scan unavailable (${live.error}). Showing bundled snapshot from ${SNAPSHOT_CAPTURED_AT} plus labeled reference listings.`
        : `Showing bundled snapshot from ${SNAPSHOT_CAPTURED_AT} plus labeled reference listings.`,
    capturedAt: SNAPSHOT_CAPTURED_AT,
  };
}

export async function getMarketplaceAgent(
  chainId: number,
  tokenId: string,
): Promise<{ agent: MarketplaceAgent; warning?: string }> {
  if (tokenId.startsWith("ref-") || tokenId.startsWith("ref:")) {
    const agent = allFallbackAgents().find((a) => a.tokenId === tokenId || a.id === tokenId);
    if (!agent) throw new Error("Reference agent not found");
    return { agent };
  }

  const live = await tryLiveAgent(chainId, tokenId);
  if ("id" in live) return { agent: live };

  const fallback = allFallbackAgents().find((a) => a.tokenId === tokenId || a.id === tokenId);
  if (fallback) {
    return {
      agent: fallback,
      warning: `Live 8004scan unavailable (${live.error}). Showing ${fallback.source} copy.`,
    };
  }
  throw new Error(live.error);
}
