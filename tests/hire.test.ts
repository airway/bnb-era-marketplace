import { describe, expect, it } from "vitest";
import {
  buildCreateJobTx,
  buildFundSequence,
  formatU,
  JOB_CREATED_TOPIC,
  parseJobCreatedId,
} from "../src/lib/erc8183";
import { COMMERCE, EVALUATOR_ROUTER, OPTIMISTIC_POLICY } from "../src/lib/contracts";
import { defaultHirePrice } from "../src/lib/classify";
import { isCloneNoise } from "../src/lib/dedup";
import { money } from "../src/lib/format";
import { FEATURED_BY_DESK } from "../src/lib/featured";
import { coverageDesk } from "../src/lib/fallback";
import { confirmHire, fundHire, rememberHire } from "../src/lib/hire";
import type { HireRecord } from "../src/lib/types";

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

  it("builds registerJob → setBudget → approve → fund after jobId is known", () => {
    const txs = buildFundSequence(56, "42", "100000000000000000");
    expect(txs.map((t) => t.label)).toEqual([
      "ERC-8183 registerJob",
      "ERC-8183 setBudget",
      "Approve U for escrow",
      "ERC-8183 fund",
    ]);
    expect(txs[0].to.toLowerCase()).toBe(EVALUATOR_ROUTER[56].toLowerCase());
    expect(txs[1].to.toLowerCase()).toBe(COMMERCE[56].toLowerCase());
    expect(txs[3].to.toLowerCase()).toBe(COMMERCE[56].toLowerCase());
    expect(OPTIMISTIC_POLICY[56]).toMatch(/^0x/);
    expect(txs.every((t) => t.data.startsWith("0x") && t.value === "0x0")).toBe(true);
  });

  it("reads jobId from JobCreated without a typed field", () => {
    const jobId = 99n;
    const logs = [
      {
        address: COMMERCE[56],
        topics: [JOB_CREATED_TOPIC, `0x${jobId.toString(16).padStart(64, "0")}`],
      },
    ];
    expect(parseJobCreatedId(logs, COMMERCE[56])).toBe("99");
    expect(parseJobCreatedId([], COMMERCE[56])).toBeNull();
  });

  it("formats U without inventing a win rate", () => {
    expect(formatU("1000000000000000000")).toBe("1.00 U");
    expect(formatU(null)).toBe("—");
  });
});

describe("hire status is honest", () => {
  const base: HireRecord = {
    hireId: "hire_test",
    agentId: "56:x:265375",
    agentName: "BNB LP Range Rebalancer",
    tokenId: "265375",
    chainId: 56,
    mandateId: "rebalance-range",
    mandateLabel: "Rebalance",
    budgetTbnb: 0.05,
    budgetRaw: "100000000000000000",
    currency: null,
    paymentRail: "erc-8183",
    payer: "0x1",
    status: "quoted",
    createdAt: new Date().toISOString(),
    note: "",
  };

  it("confirmHire stays created — not funded — until fund()", async () => {
    rememberHire(base);
    const created = await confirmHire({
      hireId: "hire_test",
      createTxHash: "0xabc",
      jobId: "7",
    });
    expect(created.status).toBe("created");
    expect(created.jobId).toBe("7");
    expect(created.note.toLowerCase()).toContain("not funded");
  });

  it("fundHire marks funded only with a fund hash", async () => {
    rememberHire({ ...base, status: "created", jobId: "7", createTxHash: "0xabc" });
    const funded = await fundHire({
      hireId: "hire_test",
      jobId: "7",
      fundTxHash: "0xfund",
    });
    expect(funded.status === "funded" || funded.status === "working").toBe(true);
    expect(funded.fundTxHash).toBe("0xfund");
  });
});

describe("coverage desks stay real", () => {
  it("rebalancing desk includes the live LP rebalancer", () => {
    const rows = coverageDesk("rebalancing");
    expect(rows.some((a) => a.tokenId === "265375")).toBe(true);
    expect(rows.every((a) => /^\d+$/.test(a.tokenId))).toBe(true);
  });

  it("does not lead desks with Agent Studio /launch stubs", () => {
    expect(FEATURED_BY_DESK.grid[0]).toBe("266234");
    expect(FEATURED_BY_DESK.yield[0]).toBe("265876");
    expect(FEATURED_BY_DESK.rebalancing[0]).toBe("265375");
    expect(FEATURED_BY_DESK["health-factor"][0]).toBe("266933");
    expect(FEATURED_BY_DESK.grid).not.toContain("267697");
    expect(FEATURED_BY_DESK.yield).not.toContain("267698");
  });
});

describe("clone filter", () => {
  it("drops Ave.ai / Q402 / example-agent / Agent Studio launch stubs", () => {
    expect(isCloneNoise({ name: "Ave.ai Bot", description: "q402 clone", services: [] })).toBe(true);
    expect(
      isCloneNoise({
        name: "GridMaster Ops (Agent Studio)",
        description: "grid",
        services: [{ name: "marketplace", endpoint: "https://bsc-hackathon-ia-marketplace.vercel.app/launch" }],
      }),
    ).toBe(true);
    expect(
      isCloneNoise({
        name: "FluxAgent_6E44E0",
        description: "demo",
        services: [{ name: "api", endpoint: "https://api.example-agent.ai/v1" }],
      }),
    ).toBe(true);
    expect(
      isCloneNoise({
        name: "NovaHub_040431",
        description: "demo",
        services: [],
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

  it("does not invent a list hire price", () => {
    expect(defaultHirePrice("rebalancing", true)).toBeNull();
    expect(money(null)).toBe("No published price");
  });
});
