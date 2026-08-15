import { negotiateA2A, notifyFunded, mandateTask } from "./a2a";
import { MANDATES } from "./categories";
import { COMMERCE, PAYMENT_TOKEN } from "./contracts";
import { buildCreateJobTx } from "./erc8183";
import { findCoverageAgent } from "./fallback";
import { getMarketplaceAgent } from "./query";
import { discoverA2A } from "./strategy";
import type { HireRecord, HireRequest, MarketplaceAgent, UnsignedTx } from "./types";
import { probeX402 } from "./x402";

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

export function rememberHire(record: HireRecord): HireRecord {
  hires.set(record.hireId, record);
  return record;
}

async function resolveAgent(req: HireRequest): Promise<MarketplaceAgent> {
  const local = findCoverageAgent(req.agentId);
  const tokenId = req.agentId.includes(":") ? req.agentId.split(":").pop()! : req.agentId;
  const chainGuess = Number(req.agentId.split(":")[0]);
  if (local && !req.agentId.includes(":")) return local;
  const { agent } = await getMarketplaceAgent(
    Number.isFinite(chainGuess) && chainGuess > 0 ? chainGuess : 56,
    tokenId,
  );
  return agent;
}

export async function createHire(req: HireRequest): Promise<HireRecord> {
  const mandate = MANDATES.find((m) => m.id === req.mandateId);
  if (!mandate) throw new Error("Unknown mandate");
  if (req.paymentRail !== "erc-8183" && req.paymentRail !== "x402-probe") {
    throw new Error("Unsupported payment rail — mock x402 / mock escrow were removed");
  }

  const agent = await resolveAgent(req);
  const a2aUrl = agent.a2aUrl || discoverA2A(agent);
  const task = mandateTask(agent, mandate.label, req.inputs);
  const provider = agent.agentWallet || agent.owner || agent.chainOwner;

  let quote = undefined;
  let x402 = null;
  const txs: UnsignedTx[] = [];
  let note = "";

  if (req.paymentRail === "x402-probe") {
    const target = agent.services[0]?.endpoint || a2aUrl;
    if (!target) throw new Error("No HTTP endpoint to probe for x402");
    x402 = await probeX402(target);
    note =
      x402.status === 402
        ? "Live HTTP 402 from the agent endpoint. Pay the requirement, then retry the resource — this is not a mock."
        : `Probed ${target} → HTTP ${x402.status}. No PAYMENT-REQUIRED challenge on this call.`;
  } else {
    if (a2aUrl) {
      quote = await negotiateA2A(a2aUrl, task, agent.chainId);
    } else {
      quote = {
        accepted: false,
        provider: provider ?? null,
        priceRaw: null,
        currency: PAYMENT_TOKEN[agent.chainId] ?? PAYMENT_TOKEN[56],
        currencyLabel: "U",
        negotiationHash: null,
        providerSig: null,
        verifyingContract: COMMERCE[agent.chainId] ?? COMMERCE[56],
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
        estimatedSeconds: null,
        instructions: "No A2A URL in the registration. createJob still targets the official ERC-8183 kernel.",
        a2aUrl: null,
        raw: null,
        error: "No A2A endpoint to negotiate with",
      };
    }
    const payTo = quote.provider || provider;
    if (payTo && payTo.startsWith("0x")) {
      txs.push(
        buildCreateJobTx({
          chainId: agent.chainId,
          provider: payTo,
          description: `${task.description}${quote.negotiationHash ? ` negotiation=${quote.negotiationHash}` : ""}`,
          quote,
        }),
      );
    }
    note = quote.accepted
      ? `Live A2A negotiate succeeded. Start hire to createJob → registerJob → setBudget → approve → fund on ${quote.verifyingContract}.`
      : quote.error
        ? `A2A negotiate did not complete (${quote.error}). Unsigned createJob is still the official ERC-8183 path if a provider address exists.`
        : "Quote returned without acceptance. Read the payload before signing.";
  }

  const record: HireRecord = {
    hireId: hireId(),
    agentId: agent.id,
    agentName: agent.name,
    tokenId: agent.tokenId,
    chainId: agent.chainId,
    mandateId: mandate.id,
    mandateLabel: mandate.label,
    budgetTbnb: req.budgetTbnb || 0,
    budgetRaw: quote?.priceRaw ?? null,
    currency: quote?.currency ?? null,
    paymentRail: req.paymentRail,
    payer: req.payer?.trim() || "",
    status: "quoted",
    createdAt: new Date().toISOString(),
    inputs: req.inputs,
    note,
    quote,
    txs,
    x402,
  };
  hires.set(record.hireId, record);
  return record;
}

export async function confirmHire(opts: {
  hireId?: string;
  hire?: HireRecord;
  createTxHash: string;
  jobId?: string;
  payer?: string;
}): Promise<HireRecord> {
  const rec = opts.hire ?? (opts.hireId ? hires.get(opts.hireId) : undefined);
  if (!rec) throw new Error("Hire not found — pass the hire body if the server restarted");
  rec.createTxHash = opts.createTxHash;
  rec.jobId = opts.jobId ?? rec.jobId ?? null;
  if (opts.payer) rec.payer = opts.payer;
  rec.status = "created";
  rec.note = rec.jobId
    ? `createJob confirmed. On-chain job ${rec.jobId}. Not funded until fund() confirms.`
    : `createJob submitted ${opts.createTxHash}. Waiting for JobCreated so we can fund.`;
  hires.set(rec.hireId, rec);
  return rec;
}

export async function fundHire(opts: {
  hireId?: string;
  hire?: HireRecord;
  jobId: string;
  fundTxHash: string;
  registerTxHash?: string;
  budgetTxHash?: string;
  approveTxHash?: string;
  payer?: string;
}): Promise<HireRecord> {
  const rec = opts.hire ?? (opts.hireId ? hires.get(opts.hireId) : undefined);
  if (!rec) throw new Error("Hire not found — pass the hire body if the server restarted");
  if (!opts.fundTxHash) throw new Error("fundTxHash required — a hire is not funded until fund() lands");
  if (!opts.jobId) throw new Error("jobId required");
  rec.jobId = opts.jobId;
  rec.fundTxHash = opts.fundTxHash;
  if (opts.registerTxHash) rec.registerTxHash = opts.registerTxHash;
  if (opts.budgetTxHash) rec.budgetTxHash = opts.budgetTxHash;
  if (opts.approveTxHash) rec.approveTxHash = opts.approveTxHash;
  if (opts.payer) rec.payer = opts.payer;
  rec.status = "funded";
  rec.note = `fund() confirmed ${opts.fundTxHash} for job ${opts.jobId}.`;
  const url = rec.quote?.a2aUrl;
  if (url) {
    rec.notifyResult = await notifyFunded(url, opts.jobId);
    rec.status = "working";
    rec.note = `Funded job ${opts.jobId}. notify_funded sent to the live A2A endpoint.`;
  } else {
    rec.note = `Funded job ${opts.jobId} on-chain. No A2A URL — the provider must notice the FUNDED job.`;
  }
  hires.set(rec.hireId, rec);
  return rec;
}

export async function notifyHire(opts: { hireId?: string; hire?: HireRecord; jobId: string }): Promise<HireRecord> {
  const rec = opts.hire ?? (opts.hireId ? hires.get(opts.hireId) : undefined);
  if (!rec) throw new Error("Hire not found");
  rec.jobId = opts.jobId;
  const url = rec.quote?.a2aUrl;
  if (!url) {
    rec.note = "No A2A URL — the agent must notice the funded job on-chain (BNBAgent funded-job poll).";
    rec.status = "funded";
    hires.set(rec.hireId, rec);
    return rec;
  }
  rec.notifyResult = await notifyFunded(url, opts.jobId);
  rec.status = "working";
  rec.note = `notify_funded(${opts.jobId}) → ${rec.notifyResult?.slice(0, 180)}`;
  hires.set(rec.hireId, rec);
  return rec;
}
