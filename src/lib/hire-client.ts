import { negotiateA2A, mandateTask } from "./a2a";
import { MANDATES } from "./categories";
import { COMMERCE, PAYMENT_TOKEN } from "./contracts";
import { buildCreateJobTx } from "./erc8183";
import { normalizePaymentRail } from "./rails";
import { discoverA2A } from "./strategy";
import type { CommerceQuote, HireRecord, MarketplaceAgent, PaymentRail, UnsignedTx } from "./types";
import { buildX402TransferTx, parseX402Exact, probeX402, x402ExactFromQuote } from "./x402";

export async function quoteHireLocal(
  agent: MarketplaceAgent,
  opts: { mandateId: string; paymentRail: PaymentRail | string; payer?: string; inputs?: Record<string, string> },
): Promise<HireRecord> {
  const mandate = MANDATES.find((m) => m.id === opts.mandateId);
  if (!mandate) throw new Error("Unknown mandate");
  const paymentRail = normalizePaymentRail(opts.paymentRail);
  const a2aUrl = agent.a2aUrl || discoverA2A(agent);
  const task = mandateTask(agent, mandate.label, opts.inputs);
  const provider = agent.agentWallet || agent.owner || agent.chainOwner;
  const txs: UnsignedTx[] = [];
  let quote: CommerceQuote | undefined;
  let x402 = null;
  let note = "";

  if (paymentRail === "x402") {
    const target = agent.services[0]?.endpoint || a2aUrl;
    if (target) x402 = await probeX402(target);
    if (a2aUrl) quote = await negotiateA2A(a2aUrl, task, agent.chainId);
    const exact =
      (x402 ? parseX402Exact(x402) : null) ??
      x402ExactFromQuote({
        chainId: agent.chainId,
        payTo: quote?.provider || provider,
        amountRaw: quote?.priceRaw ?? null,
        asset: quote?.currency?.startsWith("0x") ? quote.currency : null,
      });
    if (exact) {
      txs.push(
        buildX402TransferTx({
          chainId: agent.chainId,
          token: exact.asset,
          to: exact.payTo,
          amountRaw: exact.amount,
        }),
      );
      note =
        exact.source === "http-402"
          ? "Live HTTP 402. Sign the ERC-20 transfer — tokens move on-chain."
          : "x402 exact transfer from the live A2A price. Not a mock.";
    } else {
      note = "No 402 payTo/amount and no A2A price. We will not invent an x402 budget.";
    }
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
  if (paymentRail === "erc-8183" && payTo && payTo.startsWith("0x")) {
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
    budgetTbnb: agent.hirePriceTbnb ?? 0,
    budgetRaw: quote?.priceRaw ?? null,
    currency: quote?.currency ?? null,
    paymentRail,
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
