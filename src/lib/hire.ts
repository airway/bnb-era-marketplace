import { MANDATES } from "./categories";
import { allFallbackAgents } from "./fallback";
import { getMarketplaceAgent } from "./query";
import type { HireRecord, HireRequest, HireStatus } from "./types";

const hires = new Map<string, HireRecord>();

function hireId(): string {
  return `hire_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listHires(): HireRecord[] {
  return [...hires.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getHire(id: string): HireRecord | undefined {
  return hires.get(id);
}

export async function createHire(req: HireRequest): Promise<HireRecord> {
  const mandate = MANDATES.find((m) => m.id === req.mandateId);
  if (!mandate) throw new Error("Unknown mandate");
  if (!Number.isFinite(req.budgetTbnb) || req.budgetTbnb <= 0) {
    throw new Error("Budget must be a positive number");
  }
  if (req.paymentRail !== "mock-x402" && req.paymentRail !== "mock-escrow") {
    throw new Error("Unsupported payment rail");
  }

  const local = allFallbackAgents().find((a) => a.id === req.agentId || a.tokenId === req.agentId);
  const tokenId = req.agentId.includes(":") ? req.agentId.split(":").pop()! : req.agentId;
  const chainGuess = Number(req.agentId.split(":")[0]) || 56;
  const agent = local ?? (await getMarketplaceAgent(Number.isFinite(chainGuess) ? chainGuess : 56, tokenId)).agent;

  const record: HireRecord = {
    hireId: hireId(),
    agentId: agent.id,
    agentName: agent.name,
    tokenId: agent.tokenId,
    chainId: agent.chainId,
    mandateId: mandate.id,
    mandateLabel: mandate.label,
    budgetTbnb: req.budgetTbnb,
    paymentRail: req.paymentRail,
    payer: req.payer?.trim() || "0xDEMO000000000000000000000000000000000001",
    status: req.paymentRail === "mock-x402" ? "funded" : "quoted",
    createdAt: new Date().toISOString(),
    note:
      req.paymentRail === "mock-x402"
        ? "Mock x402 payment accepted. No on-chain transfer. Job marked funded so you can walk the hire flow."
        : "Mock ERC-8183-style escrow opened. No testnet funds moved. Advance the status from My hires.",
  };
  hires.set(record.hireId, record);
  return record;
}

const NEXT: Record<HireStatus, HireStatus | null> = {
  quoted: "funded",
  funded: "working",
  working: "submitted",
  submitted: "settled",
  settled: null,
};

export function advanceHire(id: string): HireRecord {
  const rec = hires.get(id);
  if (!rec) throw new Error("Hire not found");
  const next = NEXT[rec.status];
  if (!next) return rec;
  rec.status = next;
  rec.note = `Status advanced to ${next} (demo clock, not an on-chain settle).`;
  hires.set(id, rec);
  return rec;
}
