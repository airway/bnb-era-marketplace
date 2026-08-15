import { DESKS } from "./categories";
import { readIdentityOnchain, resolveRegistration } from "./chain";
import { looksLikeSpamName, readinessOf } from "./classify";
import { isCloneNoise, preferLive as sortByLiveSignal } from "./dedup";
import { coverageAgents, coverageDesk, findCoverageAgent, SNAPSHOT_CAPTURED_AT } from "./fallback";
import { FEATURED_BY_DESK } from "./featured";
import { tryLiveAgent, tryLiveAgents, tryLiveDesk } from "./scan";
import { discoverA2A, discoverBase, overlayTrackRecord, probeStrategy } from "./strategy";
import type { AgentListResult, CategoryId, MarketplaceAgent } from "./types";

export interface ListQuery {
  q?: string;
  category?: CategoryId | "all";
  x402?: boolean;
  hideSpam?: boolean;
  page?: number;
  limit?: number;
  sort?: "newest" | "price" | "score" | "name" | "fit";
  preferLive?: boolean;
}

function decorate(agent: MarketplaceAgent): MarketplaceAgent {
  const a2aUrl = discoverA2A(agent);
  const next = { ...agent, a2aUrl, operatorBase: discoverBase(agent) };
  next.readiness = readinessOf(next);
  return next;
}

function matchesQuery(agent: MarketplaceAgent, q: ListQuery): boolean {
  if (isCloneNoise(agent)) return false;
  if (q.category && q.category !== "all") {
    const fit = agent.fit?.find((f) => f.category === q.category);
    if (!agent.categories.includes(q.category) && (fit?.score ?? 0) < 2) return false;
  }
  if (q.x402 && !agent.x402) return false;
  if (q.hideSpam && looksLikeSpamName(agent.name)) return false;
  if (q.q) {
    const hay = `${agent.name} ${agent.description} ${agent.tokenId} ${agent.owner}`.toLowerCase();
    if (!hay.includes(q.q.toLowerCase())) return false;
  }
  return true;
}

function sortAgents(agents: MarketplaceAgent[], sort: ListQuery["sort"], category?: CategoryId | "all"): MarketplaceAgent[] {
  const copy = [...agents];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => (a.hirePriceTbnb ?? Number.POSITIVE_INFINITY) - (b.hirePriceTbnb ?? Number.POSITIVE_INFINITY));
    case "score":
      return copy.sort(
        (a, b) =>
          b.trackRecord.averageScore - a.trackRecord.averageScore ||
          b.trackRecord.feedbackCount - a.trackRecord.feedbackCount,
      );
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "fit":
      return copy.sort((a, b) => {
        const cat = category && category !== "all" ? category : a.primaryCategory;
        const as = a.fit?.find((f) => f.category === cat)?.score ?? 0;
        const bs = b.fit?.find((f) => f.category === cat)?.score ?? 0;
        return bs - as;
      });
    default:
      return copy.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }
}

function mergeUnique(rows: MarketplaceAgent[]): MarketplaceAgent[] {
  const map = new Map<string, MarketplaceAgent>();
  for (const a of rows) {
    const prev = map.get(a.tokenId);
    if (!prev || (a.source === "live" && prev.source !== "live")) map.set(a.tokenId, a);
  }
  return [...map.values()];
}

export async function listMarketplaceAgents(q: ListQuery): Promise<AgentListResult> {
  const page = q.page ?? 1;
  const limit = q.limit ?? 24;
  const useLive = q.preferLive !== false;
  const category = q.category && q.category !== "all" ? q.category : undefined;

  let warning: string | undefined;
  let liveAttempted = false;
  let source: AgentListResult["source"] = "snapshot";
  let agents: MarketplaceAgent[] = [];

  if (category && category !== "other" && useLive) {
    liveAttempted = true;
    const live = await tryLiveDesk(category);
    if ("agents" in live) {
      agents = live.agents;
      source = "live";
    } else {
      warning = `Live 8004scan search for ${category} failed (${live.error}). Showing bundled BSC identities captured ${SNAPSHOT_CAPTURED_AT}.`;
      agents = coverageDesk(category);
    }
  } else if (useLive) {
    liveAttempted = true;
    const live = await tryLiveAgents({ page: 1, limit: 40, search: q.q });
    if ("agents" in live) {
      agents = live.agents;
      source = "live";
    } else {
      warning = `Live 8004scan list failed (${live.error}). Showing bundled coverage snapshot from ${SNAPSHOT_CAPTURED_AT}.`;
      agents = coverageAgents();
    }
  } else {
    agents = coverageAgents();
  }

  if (agents.length < 4) {
    const extra = category && category !== "other" ? coverageDesk(category) : coverageAgents();
    agents = mergeUnique([...agents, ...extra]);
    if (source === "live") {
      warning = [warning, "Coverage snapshot merged so each desk stays populated with real token IDs."].filter(Boolean).join(" ");
    }
  }

  agents = agents.map(decorate).filter((a) => !isCloneNoise(a));

  if (category && category !== "other") {
    const featuredOrder = FEATURED_BY_DESK[category] ?? [];
    const featured = new Set(featuredOrder);
    const rank = (a: MarketplaceAgent) => {
      const i = featuredOrder.indexOf(a.tokenId);
      if (i >= 0) return i;
      if (a.a2aUrl) return 50;
      return 100;
    };
    agents = [...agents].sort((a, b) => rank(a) - rank(b) || sortByLiveSignal(a, b));
    const toProbe = agents.filter((a) => featured.has(a.tokenId) || Boolean(a.a2aUrl)).slice(0, 4);
    const probed = await Promise.all(
      toProbe.map(async (a) => overlayTrackRecord({ ...a, strategy: await probeStrategy(a) })),
    );
    const byId = new Map(probed.map((a) => [a.tokenId, decorate(a)]));
    agents = agents.map((a) => byId.get(a.tokenId) ?? a);
  }

  let filtered = sortAgents(
    agents.filter((a) => matchesQuery(a, q)),
    q.sort ?? (category ? "fit" : "newest"),
    q.category,
  );
  if (category && category !== "other") {
    const featuredOrder = FEATURED_BY_DESK[category] ?? [];
    const rank = (a: MarketplaceAgent) => {
      const i = featuredOrder.indexOf(a.tokenId);
      if (i >= 0) return i;
      if (a.a2aUrl) return 50;
      return 100;
    };
    filtered = [...filtered].sort((a, b) => rank(a) - rank(b) || sortByLiveSignal(a, b));
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  filtered = filtered.slice(start, start + limit);

  const deskCounts: AgentListResult["deskCounts"] = {};
  for (const d of DESKS) {
    deskCounts[d.id] = agents.filter((a) => a.categories.includes(d.id)).length;
  }

  return {
    agents: filtered,
    total,
    page,
    limit,
    hasMore: start + limit < total,
    source,
    liveAttempted,
    warning,
    capturedAt: source === "snapshot" ? SNAPSHOT_CAPTURED_AT : undefined,
    deskCounts,
  };
}

export async function getMarketplaceAgent(
  chainId: number,
  tokenId: string,
): Promise<{ agent: MarketplaceAgent; warning?: string; registration?: Record<string, unknown> | null }> {
  const live = await tryLiveAgent(chainId, tokenId);
  let agent: MarketplaceAgent | undefined = "id" in live ? live : undefined;
  let warning: string | undefined;
  if (!agent) {
    agent = findCoverageAgent(tokenId);
    if (!agent) throw new Error("error" in live ? live.error : "Agent not found");
    warning = `Live 8004scan detail failed (${"error" in live ? live.error : "unknown"}). Showing bundled copy of this real token ID.`;
  }

  const chain = await readIdentityOnchain(chainId, tokenId);
  if (chain.error) {
    warning = [warning, `On-chain tokenURI/ownerOf failed (${chain.error}).`].filter(Boolean).join(" ");
  } else {
    agent = {
      ...agent,
      tokenUri: chain.tokenUri ?? agent.tokenUri,
      chainOwner: chain.owner,
      owner: agent.owner || chain.owner || "",
      chainReadAt: chain.readAt,
      source: agent.source === "snapshot" ? "snapshot" : "live",
    };
  }
  const registration = await resolveRegistration(agent.tokenUri ?? null);
  if (registration) {
    const services = Array.isArray(registration.services)
      ? (registration.services as { name?: string; endpoint?: string; version?: string }[])
          .filter((s) => s.endpoint)
          .map((s) => ({ name: s.name ?? "service", endpoint: s.endpoint as string, version: s.version }))
      : agent.services;
    agent = {
      ...agent,
      name: (typeof registration.name === "string" && registration.name) || agent.name,
      description:
        (typeof registration.description === "string" && registration.description) || agent.description,
      services: services.length ? services : agent.services,
      x402: typeof registration.x402Support === "boolean" ? registration.x402Support : agent.x402,
      supportedTrust: Array.isArray(registration.supportedTrust)
        ? (registration.supportedTrust as string[])
        : agent.supportedTrust,
    };
  }
  agent = decorate(agent);
  agent.strategy = await probeStrategy(agent);
  agent = overlayTrackRecord(agent);
  agent.readiness = readinessOf(agent);
  return { agent, warning, registration };
}

export async function listAllDesks(): Promise<Record<Exclude<CategoryId, "other">, AgentListResult>> {
  const entries = await Promise.all(
    DESKS.map(async (d) => [
      d.id,
      await listMarketplaceAgents({ category: d.id, limit: 8, sort: "fit", preferLive: true }),
    ] as const),
  );
  return Object.fromEntries(entries) as Record<Exclude<CategoryId, "other">, AgentListResult>;
}
