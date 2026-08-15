import { STUDIO_STUBS } from "./featured";
import type { MarketplaceAgent } from "./types";

const CLONE =
  /ave\.ai|q402|example-agent\.ai|yi he nexus|\bbort\b|energy grid for silicon|hodlai protocol|bsc-hackathon-ia-marketplace\.vercel\.app\/launch|fluxagent|novahub|\(agent studio\)/i;

export function isCloneNoise(
  agent: Pick<MarketplaceAgent, "name" | "description" | "services"> & { tokenId?: string },
): boolean {
  if (agent.tokenId && STUDIO_STUBS.has(agent.tokenId)) return true;
  const hay = `${agent.name} ${agent.description} ${agent.services.map((s) => s.endpoint).join(" ")}`;
  return CLONE.test(hay);
}

export function preferLive(a: MarketplaceAgent, b: MarketplaceAgent): number {
  const as = (a.strategy?.available ? 2 : 0) + (a.a2aUrl ? 1 : 0) + (a.x402 ? 0.2 : 0);
  const bs = (b.strategy?.available ? 2 : 0) + (b.a2aUrl ? 1 : 0) + (b.x402 ? 0.2 : 0);
  return bs - as;
}
