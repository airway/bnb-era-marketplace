import { describe, expect, it } from "vitest";
import { overlayTrackRecord } from "../src/lib/strategy";
import type { MarketplaceAgent } from "../src/lib/types";

function stub(partial: Partial<MarketplaceAgent>): MarketplaceAgent {
  return {
    id: "56:x:1",
    tokenId: "1",
    chainId: 56,
    registry: "0x",
    agentRegistry: "eip155:56:0x",
    name: "Test",
    description: "",
    imageUrl: null,
    owner: "0x1",
    agentWallet: null,
    createdAt: null,
    createdTxHash: null,
    createdBlock: null,
    x402: false,
    active: true,
    verified: false,
    protocols: [],
    services: [],
    supportedTrust: [],
    categories: ["rebalancing"],
    primaryCategory: "rebalancing",
    tags: [],
    hirePriceTbnb: 0.05,
    hireUnit: "per job",
    source: "live",
    trackRecord: {
      source: "unavailable",
      jobsCompleted: 0,
      feedbackCount: 0,
      averageScore: 0,
      validationCount: 0,
      successfulValidations: 0,
      notes: "No feedback or validation events indexed. You are hiring an on-chain identity, not a proven score.",
    },
    explorerUrl: "",
    scanUrl: "",
    ...partial,
  };
}

describe("honest track record overlay", () => {
  it("does not turn empty feedback into a win rate", () => {
    const agent = overlayTrackRecord(
      stub({
        strategy: {
          available: true,
          probedAt: "2026-08-15T00:00:00Z",
          sourceUrl: "https://example.test/status",
          facts: [
            { label: "PnL (USDT)", value: "-0.0187" },
            { label: "APR (window)", value: "6.517%" },
          ],
        },
      }),
    );
    expect(agent.trackRecord.feedbackCount).toBe(0);
    expect(agent.trackRecord.notes).toMatch(/not a win rate/i);
    expect(agent.trackRecord.notes).toMatch(/PnL/);
  });
});
