import { describe, expect, it } from "vitest";
import { classifyText, looksLikeSpamName, primaryCategory } from "../src/lib/classify";
import { MANDATES } from "../src/lib/categories";
import { referenceAgents } from "../src/lib/fallback";

describe("classifyText", () => {
  it("tags the four official categories", () => {
    expect(classifyText("wallet watch and price alerts")).toContain("monitoring");
    expect(classifyText("grid trading inside a range")).toContain("grid");
    expect(classifyText("health factor before liquidation on Venus")).toContain("health-factor");
    expect(classifyText("rotate yield across PancakeSwap farms")).toContain("yield");
  });

  it("picks health-factor over generic monitoring when both match", () => {
    expect(primaryCategory(classifyText("monitor health factor vs liquidation"))).toBe(
      "health-factor",
    );
  });

  it("falls back to other", () => {
    expect(classifyText("zzzz generic identity")).toEqual(["other"]);
  });
});

describe("spam heuristic", () => {
  it("keeps real product names", () => {
    expect(looksLikeSpamName("Ave.ai Trading Agent")).toBe(false);
    expect(looksLikeSpamName("MuseTraceAI.agent")).toBe(false);
  });

  it("flags keyboard-mash names", () => {
    expect(looksLikeSpamName("sjkdfiai")).toBe(true);
    expect(looksLikeSpamName("dhueiiai")).toBe(true);
  });
});

describe("reference catalog", () => {
  it("covers the four brief categories", () => {
    const cats = new Set(referenceAgents().flatMap((a) => a.categories));
    expect(cats.has("monitoring")).toBe(true);
    expect(cats.has("grid")).toBe(true);
    expect(cats.has("health-factor")).toBe(true);
    expect(cats.has("yield")).toBe(true);
  });

  it("labels every reference track record honestly", () => {
    for (const agent of referenceAgents()) {
      expect(agent.source).toBe("reference");
      expect(agent.trackRecord.source).toBe("reference-estimated");
    }
  });
});

describe("mandates", () => {
  it("has a hire mandate for each core category", () => {
    const cats = MANDATES.map((m) => m.category);
    expect(cats).toEqual(expect.arrayContaining(["monitoring", "grid", "health-factor", "yield"]));
  });
});
