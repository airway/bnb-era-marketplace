import snapshot from "@/data/snapshot.json";
import reference from "@/data/reference-catalog.json";
import { agentRegistryId, explorerToken, IDENTITY_REGISTRY, scanAgentUrl } from "./contracts";
import { normalizeScanAgent, type ScanAgentRaw } from "./normalize";
import { primaryCategory } from "./classify";
import type {
  CategoryId,
  DataSource,
  MarketplaceAgent,
  ProtocolTag,
  TrackRecordSource,
} from "./types";

export const SNAPSHOT_CAPTURED_AT = snapshot.capturedAt;
export const SNAPSHOT_SOURCE = snapshot.source;

function fromReference(raw: (typeof reference.agents)[number]): MarketplaceAgent {
  const chainId = raw.chainId;
  const registry = raw.registry ?? IDENTITY_REGISTRY[chainId];
  const categories = raw.categories as CategoryId[];
  return {
    id: raw.id,
    tokenId: raw.tokenId,
    chainId,
    registry,
    agentRegistry: agentRegistryId(chainId, registry as `0x${string}`),
    name: raw.name,
    description: raw.description,
    imageUrl: raw.imageUrl,
    owner: raw.owner,
    agentWallet: raw.agentWallet ?? null,
    createdAt: null,
    createdTxHash: null,
    createdBlock: null,
    x402: raw.x402,
    active: raw.active,
    verified: false,
    protocols: raw.protocols as ProtocolTag[],
    services: [],
    supportedTrust: raw.supportedTrust,
    categories,
    primaryCategory: primaryCategory(categories),
    tags: [],
    hirePriceTbnb: raw.hirePriceTbnb,
    hireUnit: raw.hireUnit,
    source: "reference",
    trackRecord: {
      source: raw.trackRecord.source as TrackRecordSource,
      jobsCompleted: raw.trackRecord.jobsCompleted,
      feedbackCount: raw.trackRecord.feedbackCount,
      averageScore: raw.trackRecord.averageScore,
      validationCount: raw.trackRecord.validationCount,
      successfulValidations: raw.trackRecord.successfulValidations,
      winRate: raw.trackRecord.winRate,
      notes: raw.trackRecord.notes,
    },
    explorerUrl: explorerToken(chainId, raw.tokenId),
    scanUrl: scanAgentUrl(chainId, raw.tokenId),
  };
}

export function snapshotAgents(): MarketplaceAgent[] {
  return (snapshot.agents as ScanAgentRaw[]).map((row) => normalizeScanAgent(row, "snapshot"));
}

export function referenceAgents(): MarketplaceAgent[] {
  return reference.agents.map(fromReference);
}

export function allFallbackAgents(): MarketplaceAgent[] {
  return [...referenceAgents(), ...snapshotAgents()];
}

export function findFallbackAgent(tokenId: string): MarketplaceAgent | undefined {
  return allFallbackAgents().find((a) => a.tokenId === tokenId || a.id === tokenId);
}

export function snapshotPagination() {
  return snapshot.pagination as { page: number; limit: number; total: number; hasMore: boolean };
}

export function sourceLabel(source: DataSource): string {
  if (source === "live") return "Live 8004scan";
  if (source === "snapshot") return "Bundled 8004scan snapshot";
  return "Reference listing";
}
