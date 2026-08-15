import { encodeFunctionData, erc20Abi } from "viem";
import { PAYMENT_TOKEN } from "./contracts";
import type { UnsignedTx } from "./types";

export interface X402Probe {
  url: string;
  status: number;
  paymentRequired: unknown;
  header: string | null;
}

export interface X402Exact {
  payTo: string;
  amount: string;
  asset: string;
  network: string | null;
  source: "http-402" | "a2a-quote";
}

export async function probeX402(url: string): Promise<X402Probe> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
      redirect: "follow",
    });
    const header =
      res.headers.get("PAYMENT-REQUIRED") ||
      res.headers.get("payment-required") ||
      res.headers.get("x-payment") ||
      null;
    let body: unknown = null;
    const text = await res.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text.slice(0, 500);
    }
    return {
      url,
      status: res.status,
      paymentRequired: res.status === 402 ? body : header ? { header, body } : null,
      header,
    };
  } catch (err) {
    return {
      url,
      status: 0,
      paymentRequired: { error: err instanceof Error ? err.message : "x402 probe failed" },
      header: null,
    };
  } finally {
    clearTimeout(t);
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function firstAccept(body: unknown): Record<string, unknown> | null {
  const rec = asRecord(body);
  if (!rec) return null;
  const accepts = rec.accepts;
  if (Array.isArray(accepts) && accepts[0] && typeof accepts[0] === "object") {
    return accepts[0] as Record<string, unknown>;
  }
  if (rec.payTo || rec.maxAmountRequired || rec.amount) return rec;
  const nested = asRecord(rec.paymentRequired) ?? asRecord(rec.payment_required);
  return nested ? firstAccept(nested) : null;
}

/** Read an x402 PaymentRequired body. Empty fields stay empty — we do not invent a price. */
export function parseX402Exact(probe: X402Probe): X402Exact | null {
  const accept = firstAccept(probe.paymentRequired);
  if (!accept) return null;
  const payTo = String(accept.payTo ?? accept.pay_to ?? accept.recipient ?? "");
  const amount = String(accept.maxAmountRequired ?? accept.amount ?? accept.maxAmount ?? "");
  const asset = String(accept.asset ?? accept.assetAddress ?? accept.token ?? "");
  const network = accept.network != null ? String(accept.network) : null;
  if (!payTo.startsWith("0x") || !amount || amount === "0" || !asset.startsWith("0x")) return null;
  return { payTo, amount, asset, network, source: "http-402" };
}

export function buildX402TransferTx(opts: {
  chainId: number;
  token: string;
  to: string;
  amountRaw: string;
}): UnsignedTx {
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [opts.to as `0x${string}`, BigInt(opts.amountRaw)],
  });
  return {
    to: opts.token,
    data,
    value: "0x0",
    chainId: opts.chainId,
    label: "x402 exact ERC-20 transfer",
  };
}

export function x402ExactFromQuote(opts: {
  chainId: number;
  payTo: string | null | undefined;
  amountRaw: string | null | undefined;
  asset?: string | null;
}): X402Exact | null {
  if (!opts.payTo?.startsWith("0x") || !opts.amountRaw) return null;
  return {
    payTo: opts.payTo,
    amount: opts.amountRaw,
    asset: opts.asset || PAYMENT_TOKEN[opts.chainId] || PAYMENT_TOKEN[56],
    network: `eip155:${opts.chainId}`,
    source: "a2a-quote",
  };
}
