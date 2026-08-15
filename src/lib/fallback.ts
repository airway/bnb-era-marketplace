import coverage from "@/data/coverage-snapshot.json";
import { isCloneNoise } from "./dedup";
import { normalizeScanAgent, type ScanAgentRaw } from "./normalize";
import type { CategoryId, DataSource, MarketplaceAgent } from "./types";

export const SNAPSHOT_CAPTURED_AT = coverage.capturedAt;
export const SNAPSHOT_SOURCE = coverage.source;

export function coverageAgents(): MarketplaceAgent[] {
  return (coverage.agents as ScanAgentRaw[])
    .map((row) => normalizeScanAgent(row, "snapshot"))
    .filter((a) => !isCloneNoise(a));
}

export function coverageDesk(category: Exclude<CategoryId, "other">): MarketplaceAgent[] {
  const ids = new Set((coverage.desks as Record<string, string[]>)[category] ?? []);
  return coverageAgents().filter((a) => ids.has(a.tokenId));
}

export function findCoverageAgent(tokenId: string): MarketplaceAgent | undefined {
  return coverageAgents().find((a) => a.tokenId === tokenId || a.id === tokenId);
}

export function sourceLabel(source: DataSource): string {
  if (source === "live") return "Live 8004scan";
  if (source === "chain") return "Live BSC registry read";
  return "Bundled live snapshot";
}
