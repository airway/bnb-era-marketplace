import { a2aProxyBases } from "./a2a-allowlist";
import { COMMERCE, PAYMENT_TOKEN } from "./contracts";
import type { CommerceQuote, MarketplaceAgent } from "./types";

async function postA2A(a2aUrl: string, payload: unknown, signal: AbortSignal): Promise<Response> {
  const direct = () =>
    fetch(a2aUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal,
      cache: "no-store" as RequestCache,
    });
  if (typeof window === "undefined") return direct();
  const staticPages = process.env.NEXT_PUBLIC_STATIC === "1";
  const errors: string[] = [];
  for (const base of a2aProxyBases()) {
    if (staticPages && !base) continue;
    const url = base ? `${base}/api/a2a` : "/api/a2a";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ a2aUrl, payload }),
        signal,
        cache: "no-store",
      });
      if (res.ok) return res;
      errors.push(`${url} HTTP ${res.status}`);
    } catch (err) {
      errors.push(`${url} ${err instanceof Error ? err.message : "fetch failed"}`);
    }
  }
  if (staticPages) {
    throw new Error(
      `Quote proxy failed (${errors.join("; ") || "no proxy URL"}). This static host cannot POST to the operator.`,
    );
  }
  return direct();
}

function rid(): string {
  const c = globalThis.crypto;
  if (c && "randomUUID" in c) return c.randomUUID();
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function extractData(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.parts && Array.isArray(r.parts)) {
    for (const p of r.parts) {
      if (p && typeof p === "object" && "data" in p) return (p as { data: Record<string, unknown> }).data;
    }
  }
  if (Array.isArray(r.artifacts)) {
    for (const art of r.artifacts as Record<string, unknown>[]) {
      const parts = art.parts;
      if (Array.isArray(parts)) {
        for (const p of parts) {
          if (p && typeof p === "object" && "data" in p) return (p as { data: Record<string, unknown> }).data;
        }
      }
    }
  }
  return r;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export async function negotiateA2A(
  a2aUrl: string,
  task: { description: string; deliverables: string; quality: string; extra?: Record<string, unknown> },
  chainId: number,
): Promise<CommerceQuote> {
  const messageId = rid();
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "message/send",
    params: {
      message: {
        messageId,
        role: "user",
        parts: [
          {
            kind: "data",
            data: {
              skill: "negotiate",
              task_description: task.description,
              description: task.description,
              terms: {
                deliverables: task.deliverables,
                quality_standards: task.quality,
              },
              ...task.extra,
            },
          },
        ],
      },
    },
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await postA2A(a2aUrl, payload, ctrl.signal);
    const body = (await res.json()) as { result?: unknown; error?: { message?: string } };
    if (body.error) {
      return {
        accepted: false,
        provider: null,
        priceRaw: null,
        currency: null,
        currencyLabel: "U",
        negotiationHash: null,
        providerSig: null,
        verifyingContract: COMMERCE[chainId] ?? COMMERCE[56],
        expiresAt: null,
        estimatedSeconds: null,
        instructions: null,
        a2aUrl,
        raw: body,
        error: body.error.message ?? "A2A negotiate rejected",
      };
    }
    const data = extractData(body.result) ?? {};
    const response = asRecord(data.response);
    const terms = asRecord(response.terms);
    const nested = asRecord(data);
    const price =
      (terms.price as string | undefined) ??
      (nested.price as string | undefined) ??
      null;
    const currency =
      (terms.currency as string | undefined) ??
      (nested.currency as string | undefined) ??
      PAYMENT_TOKEN[chainId] ??
      PAYMENT_TOKEN[56];
    const accepted = response.accepted !== false && !data.error;
    return {
      accepted,
      provider: (nested.provider as string) ?? null,
      priceRaw: price != null ? String(price) : null,
      currency: currency ? String(currency) : null,
      currencyLabel: String(currency).startsWith("0x") ? "U" : String(currency ?? "U"),
      negotiationHash: (nested.negotiation_hash as string) ?? null,
      providerSig: (nested.provider_sig as string) ?? null,
      verifyingContract: (nested.verifying_contract as string) ?? COMMERCE[chainId] ?? COMMERCE[56],
      expiresAt: typeof response.quote_expires_at === "number" ? response.quote_expires_at : null,
      estimatedSeconds:
        typeof response.estimated_completion_seconds === "number"
          ? response.estimated_completion_seconds
          : typeof nested.estimated_completion_seconds === "number"
            ? nested.estimated_completion_seconds
            : null,
      instructions: (nested.instructions as string) ?? null,
      a2aUrl,
      raw: body.result,
    };
  } catch (err) {
    return {
      accepted: false,
      provider: null,
      priceRaw: null,
      currency: null,
      currencyLabel: "U",
      negotiationHash: null,
      providerSig: null,
      verifyingContract: COMMERCE[chainId] ?? COMMERCE[56],
      expiresAt: null,
      estimatedSeconds: null,
      instructions: null,
      a2aUrl,
      raw: null,
      error: err instanceof Error ? err.message : "A2A negotiate failed",
    };
  } finally {
    clearTimeout(t);
  }
}

export async function notifyFunded(a2aUrl: string, jobId: string): Promise<string> {
  const messageId = rid();
  const payload = {
    jsonrpc: "2.0",
    id: 2,
    method: "message/send",
    params: {
      message: {
        messageId,
        role: "user",
        parts: [{ kind: "data", data: { skill: "notify_funded", job_id: Number(jobId) || jobId } }],
      },
    },
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await postA2A(a2aUrl, payload, ctrl.signal);
    const body = await res.json();
    return JSON.stringify(body).slice(0, 1500);
  } catch (err) {
    return err instanceof Error ? err.message : "notify_funded failed";
  } finally {
    clearTimeout(t);
  }
}

export function mandateTask(
  agent: MarketplaceAgent,
  mandateLabel: string,
  inputs: Record<string, string> | undefined,
): { description: string; deliverables: string; quality: string; extra?: Record<string, unknown> } {
  const fields = Object.entries(inputs ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  const description = `${mandateLabel} for ERC-8004 agent #${agent.tokenId} (${agent.name}). ${fields}`.trim();
  return {
    description,
    deliverables: `JSON report for ${agent.primaryCategory} with live params; empty fields stay empty.`,
    quality: "Do not invent PnL, fills, APR, or health-factor. If unread, say unread.",
    extra: agent.primaryCategory === "health-factor" ? { description } : undefined,
  };
}
