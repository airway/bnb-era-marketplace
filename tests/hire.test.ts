import { describe, expect, it } from "vitest";
import { createHire, getHire, advanceHire } from "../src/lib/hire";
import { coverageDesk } from "../src/lib/fallback";

describe("hire flow", () => {
  it("opens a mock x402 hire against a real coverage identity", async () => {
    const agent = coverageDesk("rebalancing")[0];
    const hire = await createHire({
      agentId: agent.id,
      mandateId: "rebalance-range",
      budgetTbnb: 0.05,
      paymentRail: "mock-x402",
      inputs: { pair: "WBNB/USDT", deviation: "8%" },
    });
    expect(hire.status).toBe("funded");
    expect(getHire(hire.hireId)?.tokenId).toBe(agent.tokenId);
    expect(advanceHire(hire.hireId).status).toBe("working");
  });

  it("rejects a bad mandate", async () => {
    const agent = coverageDesk("grid")[0];
    await expect(
      createHire({
        agentId: agent.id,
        mandateId: "nope",
        budgetTbnb: 0.02,
        paymentRail: "mock-x402",
      }),
    ).rejects.toThrow(/mandate/i);
  });
});
