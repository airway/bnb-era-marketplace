import { describe, expect, it } from "vitest";
import { classifyText, looksLikeSpamName, primaryCategory } from "../src/lib/classify";
import { DESKS, MANDATES } from "../src/lib/categories";
import { coverageAgents, coverageDesk } from "../src/lib/fallback";

describe("four official desks", () => {
  it("scores the four jobs from registration text", () => {
    expect(primaryCategory(classifyText("PancakeSwap V3 range rebalancer"))).toBe("rebalancing");
    expect(primaryCategory(classifyText("Autonomous grid-trading agent"))).toBe("grid");
    expect(primaryCategory(classifyText("Yield-optimisation agent routes liquidity"))).toBe("yield");
    expect(primaryCategory(classifyText("Venus health factor before liquidation"))).toBe(
      "health-factor",
    );
  });

  it("does not treat energy-grid or yin-yang as the job", () => {
    expect(primaryCategory(classifyText("The Energy Grid for Silicon Life"))).toBe("other");
    expect(primaryCategory(classifyText("Yin Yang polarity diagnosis and rebalancing"))).toBe(
      "other",
    );
  });

  it("puts TradePilot-style copy on the grid desk, not only 'grid trad'", () => {
    const text = "Automated crypto trading bot with DCA, grid, and rebalancing strategies.";
    const fits = classifyText(text);
    expect(fits.find((f) => f.category === "grid")?.score ?? 0).toBeGreaterThanOrEqual(2);
    expect(fits.find((f) => f.category === "rebalancing")?.score ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("has equal mandate coverage", () => {
    expect(DESKS.map((d) => d.id).sort()).toEqual(
      ["grid", "health-factor", "rebalancing", "yield"].sort(),
    );
    expect(MANDATES.map((m) => m.category).sort()).toEqual(
      ["grid", "health-factor", "rebalancing", "yield"].sort(),
    );
  });
});

describe("coverage snapshot is real token ids", () => {
  it("has live BSC identities on every desk", () => {
    for (const d of DESKS) {
      const rows = coverageDesk(d.id);
      // Grid has three real BSC identities after Agent Studio #267697 is dropped.
      expect(rows.length).toBeGreaterThanOrEqual(d.id === "grid" ? 3 : 4);
      for (const a of rows) {
        expect(a.tokenId).toMatch(/^\d+$/);
        expect(a.source).toBe("snapshot");
      }
    }
  });

  it("does not invent reference agents", () => {
    for (const a of coverageAgents()) {
      expect(a.tokenId.startsWith("ref")).toBe(false);
    }
  });
});

describe("spam heuristic", () => {
  it("keeps product names", () => {
    expect(looksLikeSpamName("BNB LP Range Rebalancer")).toBe(false);
    expect(looksLikeSpamName("GridMaster Ops (Agent Studio)")).toBe(false);
  });
  it("flags mash names", () => {
    expect(looksLikeSpamName("sjkdfiai")).toBe(true);
  });
});
