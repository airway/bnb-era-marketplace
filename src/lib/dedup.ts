import type { MarketplaceAgent } from "./types";

const CLONE = /ave\.ai|q402|example-agent\.ai|yi he nexus|\bbort\b|energy grid for silicon|hodlai protocol/i;

export function isCloneNoise(agent: Pick<MarketplaceAgent, "name" | "description" | "services">): boolean {
  const hay = `${agent.name} ${agent.description} ${agent.services.map((s) => s.endpoint).join(" ")}`;
  return CLONE.test(hay);
}

export function preferLive(a: MarketplaceAgent, b: MarketplaceAgent): number {
  const as = (a.strategy?.available ? 2 : 0) + (a.a2aUrl ? 1 : 0) + (a.x402 ? 0.2 : 0);
  const bs = (b.strategy?.available ? 2 : 0) + (b.a2aUrl ? 1 : 0) + (b.x402 ? 0.2 : 0);
  return bs - as;
}
