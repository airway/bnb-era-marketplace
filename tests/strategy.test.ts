import { describe, expect, it } from "vitest";
import { coverageDesk } from "../src/lib/fallback";
import { isTermixCatalogUrl, resolveAgentPlaceholder } from "../src/lib/endpoints";
import { normalizeScanAgent } from "../src/lib/normalize";
import {
  discoverA2A,
  isHealthFactorSentinel,
  isVenusEmptyAccount,
  operatorCannotAnswer,
  overlayTrackRecord,
  publishedHealthFactor,
  strategyFacts,
  termixCardUrl,
} from "../src/lib/strategy";
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

describe("Venus empty account is unknown, not 999 / SAFE", () => {
  const emptyStatus = {
    health_factor: null,
    collateral: 0.0,
    debt: 0.0,
    risk: "SAFE",
    account: "0xd16faAa91F77397Bb84c69FBb89D11011bE11212",
    protocol: "Venus",
  };
  const perfExtra = {
    health_factor: 999.0,
    risk: "SAFE",
    protections_attempted: 0,
    protections_succeeded: 0,
  };

  it("treats 999 as a sentinel, not a published HF", () => {
    expect(isHealthFactorSentinel(999)).toBe(true);
    expect(isHealthFactorSentinel(999.0)).toBe(true);
    expect(isHealthFactorSentinel("999")).toBe(true);
    expect(isHealthFactorSentinel(1.35)).toBe(false);
    expect(isHealthFactorSentinel(null)).toBe(false);
  });

  it("detects null/0/0 as an empty Venus account even when performance prints 999", () => {
    expect(isVenusEmptyAccount(emptyStatus, perfExtra)).toBe(true);
    expect(publishedHealthFactor(emptyStatus, perfExtra)).toBeNull();
  });

  it("does not print 999.00 or SAFE on an empty account", () => {
    const facts = strategyFacts("health-factor", emptyStatus, perfExtra);
    const hf = facts.find((f) => f.label === "Health factor");
    const risk = facts.find((f) => f.label === "Risk");
    expect(hf?.empty).toBe(true);
    expect(hf?.value).toBe("unknown");
    expect(hf?.value).not.toMatch(/999/);
    expect(risk?.empty).toBe(true);
    expect(risk?.value).toBe("unknown");
    expect(risk?.value).not.toMatch(/SAFE/i);
    expect(facts.some((f) => String(f.value).includes("999"))).toBe(false);
  });

  it("still prints a real HF when the account has a position", () => {
    const facts = strategyFacts(
      "health-factor",
      { health_factor: 1.35, collateral: 10, debt: 4, risk: "SAFE", protocol: "Venus" },
      {},
    );
    const hf = facts.find((f) => f.label === "Health factor");
    const risk = facts.find((f) => f.label === "Risk");
    expect(hf?.empty).toBeFalsy();
    expect(hf?.value).toBe("1.3500");
    expect(risk?.empty).toBeFalsy();
    expect(risk?.value).toBe("SAFE");
  });

  it("does not overlay an unpublished HF into track-record notes", () => {
    const agent = overlayTrackRecord(
      stub({
        primaryCategory: "health-factor",
        categories: ["health-factor"],
        strategy: {
          available: true,
          probedAt: "2026-08-15T00:00:00Z",
          sourceUrl: "https://bnb-guardian.172-104-171-139.nip.io/status",
          facts: strategyFacts("health-factor", emptyStatus, perfExtra),
        },
      }),
    );
    expect(agent.trackRecord.notes).not.toMatch(/999/);
    expect(agent.trackRecord.notes).not.toMatch(/Operator HF/);
  });
});

describe("Termix {agentId} is a live card URL, not a hireable A2A", () => {
  it("substitutes the token id and does not leave a placeholder", () => {
    const raw = "https://platform-backend.prod.termix.live/api/v1/a2a/agents/{agentId}/card";
    expect(resolveAgentPlaceholder(raw, "266234")).toBe(
      "https://platform-backend.prod.termix.live/api/v1/a2a/agents/266234/card",
    );
    expect(isTermixCatalogUrl(resolveAgentPlaceholder(raw, "266234"))).toBe(true);
  });

  it("keeps the resolved Termix card on grid identities and does not advertise it as A2A", () => {
    const rows = coverageDesk("grid");
    expect(rows.map((a) => a.tokenId)).toEqual(expect.arrayContaining(["266234", "172801", "177310"]));
    expect(rows).toHaveLength(3);
    const grid = rows.find((a) => a.tokenId === "266234")!;
    expect(termixCardUrl(grid)).toBe(
      "https://platform-backend.prod.termix.live/api/v1/a2a/agents/266234/card",
    );
    expect(discoverA2A(grid)).toBeNull();
    expect(grid.services.some((s) => s.endpoint.includes("{agentId}"))).toBe(false);
  });

  it("surfaces Termix status/presence as the live grid feed", () => {
    const facts = strategyFacts(
      "grid",
      { termix_status: "OFFLINE", presence: "offline" },
      { endpoint: null },
    );
    const status = facts.find((f) => f.label === "Termix status");
    const presence = facts.find((f) => f.label === "Presence");
    expect(status?.empty).toBeFalsy();
    expect(status?.value).toBe("OFFLINE");
    expect(presence?.value).toBe("offline");
    expect(facts.find((f) => f.label === "Pair")?.empty).toBe(true);
  });
});

describe("502 yield operator cannot answer", () => {
  it("strips A2A when 8004scan health says 502", () => {
    const agent = stub({
      tokenId: "265876",
      primaryCategory: "yield",
      categories: ["yield"],
      healthStatus: { status: "unhealthy", score: 33, message: "HTTP 502 (cached)" },
      services: [{ name: "A2A", endpoint: "https://bnb-yield.172-104-171-139.nip.io/a2a" }],
    });
    expect(operatorCannotAnswer(agent)).toBe(true);
    expect(discoverA2A(agent)).toBeNull();
  });

  it("still discovers A2A for a live operator", () => {
    const agent = stub({
      tokenId: "265375",
      primaryCategory: "rebalancing",
      categories: ["rebalancing"],
    });
    expect(discoverA2A(agent)).toBe("https://bnb-lp.172-104-171-139.nip.io/");
  });
});

describe("normalize resolves Termix placeholders", () => {
  it("turns {agentId} into the token id", () => {
    const agent = normalizeScanAgent({
      token_id: "266234",
      chain_id: 56,
      name: "positioncrew-bounded-grid.agent",
      description: "Constructs or rejects a PancakeSwap WBNB/USDT grid",
      services: [
        {
          name: "A2A",
          endpoint: "https://platform-backend.prod.termix.live/api/v1/a2a/agents/{agentId}/card",
        },
      ],
    });
    expect(agent.services[0]?.endpoint).toBe(
      "https://platform-backend.prod.termix.live/api/v1/a2a/agents/266234/card",
    );
    expect(discoverA2A(agent)).toBeNull();
    expect(termixCardUrl(agent)).toContain("/266234/card");
  });
});
