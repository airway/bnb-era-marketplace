import { describe, expect, it } from "vitest";
import { buildCreateJobTx, formatU } from "../src/lib/erc8183";
import { COMMERCE } from "../src/lib/contracts";
import { isCloneNoise } from "../src/lib/dedup";
import { coverageDesk } from "../src/lib/fallback";

describe("erc-8183 encoding", () => {
  it("builds createJob against the official mainnet kernel", () => {
    const tx = buildCreateJobTx({
      chainId: 56,
      provider: "0xd16faAa91F77397Bb84c69FBb89D11011bE11212",
      description: "Guard a health factor venue=Venus floor=1.20",
    });
    expect(tx.to.toLowerCase()).toBe(COMMERCE[56].toLowerCase());
    expect(tx.data.startsWith("0x")).toBe(true);
    expect(tx.data.length).toBeGreaterThan(10);
    expect(tx.label).toMatch(/createJob/);
  });

  it("formats U without inventing a win rate", () => {
    expect(formatU("1000000000000000000")).toBe("1.00 U");
    expect(formatU(null)).toBe("—");
  });
});

describe("coverage desks stay real", () => {
  it("rebalancing desk includes the live LP rebalancer", () => {
    const rows = coverageDesk("rebalancing");
    expect(rows.some((a) => a.tokenId === "265375")).toBe(true);
    expect(rows.every((a) => /^\d+$/.test(a.tokenId))).toBe(true);
  });
});

describe("clone filter", () => {
  it("drops Ave.ai / Q402 / example-agent noise", () => {
    expect(isCloneNoise({ name: "Ave.ai Bot", description: "q402 clone", services: [] })).toBe(true);
    expect(
      isCloneNoise({
        name: "FluxAgent",
        description: "demo",
        services: [{ name: "api", endpoint: "https://api.example-agent.ai/v1" }],
      }),
    ).toBe(true);
    expect(
      isCloneNoise({
        name: "BNB LP Range Rebalancer",
        description: "Pancake V3 range",
        services: [],
      }),
    ).toBe(false);
  });
});
