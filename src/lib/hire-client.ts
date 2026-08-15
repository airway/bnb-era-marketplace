import { negotiateA2A, mandateTask } from "./a2a";
import { MANDATES } from "./categories";
import { COMMERCE, PAYMENT_TOKEN } from "./contracts";
import { buildCreateJobTx } from "./erc8183";
import { discoverA2A } from "./strategy";
import type { CommerceQuote, HireRecord, MarketplaceAgent, PaymentRail, UnsignedTx } from "./types";
import { probeX402 } from "./x402";

export async function quoteHireLocal(
  agent: MarketplaceAgent,
  opts: { mandateId: string; paymentRail: PaymentRail; payer?: string; inputs?: Record<string, string> },
): Promise<HireRecord> {
  const mandate = MANDATES.find((m) => m.id === opts.mandateId);
  if (!mandate) throw new Error("Unknown mandate");
  const a2aUrl = agent.a2aUrl || discoverA2A(agent);
  const task = mandateTask(agent, mandate.label, opts.inputs);
  const provider = agent.agentWallet || agent.owner || agent.chainOwner;
  const txs: UnsignedTx[] = [];
  let quote: CommerceQuote | undefined;
  let x402 = null;
  let note = "";

  if (opts.paymentRail === "x402-probe") {
    const target = agent.services[0]?.endpoint || a2aUrl;
    if (!target) throw new Error("No HTTP endpoint to probe for x402");
    x402 = await probeX402(target);
    note =
      x402.status === 402
        ? "Live HTTP 402 from the agent endpoint."
        : `Probed ${target} → HTTP ${x402.status}.`;
  } else if (a2aUrl) {
    quote = await negotiateA2A(a2aUrl, task, agent.chainId);
    note = quote.accepted
      ? "Live A2A negotiate succeeded (browser). Start hire to createJob → registerJob → setBudget → approve → fund."
      : `A2A negotiate: ${quote.error ?? "not accepted"}. createJob calldata is still the official ERC-8183 path.`;
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
      instructions: "No A2A URL. Sign createJob on the official kernel.",
      a2aUrl: null,
      raw: null,
      error: "No A2A endpoint",
    };
    note = quote.instructions ?? "";
  }

  const payTo = quote?.provider || provider;
  if (opts.paymentRail === "erc-8183" && payTo && payTo.startsWith("0x")) {
    txs.push(
      buildCreateJobTx({
        chainId: agent.chainId,
        provider: payTo,
        description: `${task.description}${quote?.negotiationHash ? ` negotiation=${quote.negotiationHash}` : ""}`,
        quote,
      }),
    );
  }

  return {
    hireId: `hire_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    agentId: agent.id,
    agentName: agent.name,
    tokenId: agent.tokenId,
    chainId: agent.chainId,
    mandateId: mandate.id,
    mandateLabel: mandate.label,
    budgetTbnb: agent.hirePriceTbnb,
    budgetRaw: quote?.priceRaw ?? null,
    currency: quote?.currency ?? null,
    paymentRail: opts.paymentRail,
    payer: opts.payer?.trim() || "",
    status: "quoted",
    createdAt: new Date().toISOString(),
    inputs: opts.inputs,
    note,
    quote,
    txs,
    x402,
  };
}
