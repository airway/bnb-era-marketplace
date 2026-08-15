import { describe, expect, it } from "vitest";
import { a2aProxyBases, isAllowedA2AUrl, PAGES_A2A_PROXY } from "../src/lib/a2a-allowlist";
import { coverageDesk } from "../src/lib/fallback";

describe("A2A quote proxy allowlist", () => {
  it("allows the live LP / guardian / yield operators", () => {
    expect(isAllowedA2AUrl("https://bnb-lp.172-104-171-139.nip.io/")).toBe(true);
    expect(isAllowedA2AUrl("https://bnb-guardian.172-104-171-139.nip.io/a2a")).toBe(true);
    expect(isAllowedA2AUrl("https://bnb-yield.172-104-171-139.nip.io/a2a")).toBe(true);
  });

  it("rejects an open proxy", () => {
    expect(isAllowedA2AUrl("https://example.com/")).toBe(false);
    expect(isAllowedA2AUrl("http://bnb-lp.172-104-171-139.nip.io/")).toBe(false);
    expect(isAllowedA2AUrl("not-a-url")).toBe(false);
  });

  it("bakes the Pages-safe proxy host", () => {
    expect(PAGES_A2A_PROXY).toMatch(/^https:\/\/era-a2a-proxy\./);
    expect(a2aProxyBases()).toContain(PAGES_A2A_PROXY);
  });
});

describe("grid desk is not a two-card stub", () => {
  it("includes TradePilot #177310 plus the other two registered grid identities", () => {
    const rows = coverageDesk("grid");
    const ids = rows.map((a) => a.tokenId);
    expect(ids).toEqual(expect.arrayContaining(["266234", "172801", "177310"]));
    expect(ids).not.toContain("267697");
    expect(new Set(ids).size).toBeGreaterThanOrEqual(3);
    const trade = rows.find((a) => a.tokenId === "177310");
    expect(trade?.categories).toContain("grid");
  });
});
