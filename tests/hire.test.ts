import { describe, expect, it } from "vitest";
import { createHire, getHire, advanceHire } from "../src/lib/hire";

describe("hire flow", () => {
  it("opens a mock x402 hire as funded", async () => {
    const hire = await createHire({
      agentId: "ref:watchtower",
      mandateId: "watch-wallet",
      budgetTbnb: 0.02,
      paymentRail: "mock-x402",
    });
    expect(hire.status).toBe("funded");
    expect(getHire(hire.hireId)?.agentName).toBe("Watchtower");
    const next = advanceHire(hire.hireId);
    expect(next.status).toBe("working");
  });

  it("rejects a bad mandate", async () => {
    await expect(
      createHire({
        agentId: "ref:watchtower",
        mandateId: "nope",
        budgetTbnb: 0.02,
        paymentRail: "mock-x402",
      }),
    ).rejects.toThrow(/mandate/i);
  });
});
