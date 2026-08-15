import { IDENTITY_REGISTRY } from "./contracts";
import { FETCH_CACHE } from "./fetch-cache";

const RPCS = [
  process.env.BSC_RPC_URL,
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.bnbchain.org",
].filter(Boolean) as string[];

async function ethCall(to: string, data: string): Promise<string> {
  let last = "no rpc";
  for (const url of RPCS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to, data }, "latest"],
        }),
        signal: ctrl.signal,
        cache: FETCH_CACHE,
      });
      clearTimeout(t);
      const body = (await res.json()) as { result?: string; error?: { message?: string } };
      if (body.error) {
        last = body.error.message ?? "rpc error";
        continue;
      }
      if (body.result) return body.result;
      last = "empty result";
    } catch (err) {
      last = err instanceof Error ? err.message : "rpc failed";
    }
  }
  throw new Error(last);
}

function padUint(n: number | string): string {
  return BigInt(n).toString(16).padStart(64, "0");
}

function decodeAbiString(hex: string): string | null {
  if (!hex || hex === "0x") return null;
  const raw = Buffer.from(hex.slice(2), "hex");
  if (raw.length < 64) return raw.toString("utf8").replace(/\0/g, "") || null;
  const offset = Number(raw.readBigUInt64BE(24));
  const start = offset > 0 && offset < raw.length ? offset : 32;
  if (start + 32 > raw.length) return null;
  const len = Number(raw.readBigUInt64BE(start + 24));
  return raw.subarray(start + 32, start + 32 + len).toString("utf8");
}

export interface ChainIdentity {
  tokenUri: string | null;
  owner: string | null;
  readAt: string;
  error?: string;
}

export async function readIdentityOnchain(chainId: number, tokenId: string): Promise<ChainIdentity> {
  const registry = IDENTITY_REGISTRY[chainId] ?? IDENTITY_REGISTRY[56];
  const readAt = new Date().toISOString();
  try {
    const [uriHex, ownerHex] = await Promise.all([
      ethCall(registry, `0xc87b56dd${padUint(tokenId)}`),
      ethCall(registry, `0x6352211e${padUint(tokenId)}`),
    ]);
    const owner = ownerHex && ownerHex !== "0x" ? `0x${ownerHex.slice(-40)}` : null;
    return { tokenUri: decodeAbiString(uriHex), owner, readAt };
  } catch (err) {
    return {
      tokenUri: null,
      owner: null,
      readAt,
      error: err instanceof Error ? err.message : "on-chain read failed",
    };
  }
}

export async function fetchTxReceipt(txHash: string): Promise<{
  status: string | null;
  logs: { address?: string; topics?: string[] }[];
} | null> {
  let last = "no rpc";
  for (const url of RPCS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
        signal: ctrl.signal,
        cache: "no-store" as RequestCache,
      });
      clearTimeout(t);
      const body = (await res.json()) as {
        result?: { status?: string; logs?: { address?: string; topics?: string[] }[] } | null;
        error?: { message?: string };
      };
      if (body.error) {
        last = body.error.message ?? "rpc error";
        continue;
      }
      if (!body.result) return null;
      return { status: body.result.status ?? null, logs: body.result.logs ?? [] };
    } catch (err) {
      last = err instanceof Error ? err.message : "rpc failed";
    }
  }
  throw new Error(last);
}

export async function resolveRegistration(uri: string | null): Promise<Record<string, unknown> | null> {
  if (!uri) return null;
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const json = Buffer.from(uri.slice("data:application/json;base64,".length), "base64").toString("utf8");
      return JSON.parse(json) as Record<string, unknown>;
    }
    if (uri.startsWith("data:application/json,")) {
      return JSON.parse(decodeURIComponent(uri.slice("data:application/json,".length))) as Record<string, unknown>;
    }
    let url = uri;
    if (uri.startsWith("ipfs://")) url = `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`;
    if (!url.startsWith("http")) return null;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal, cache: FETCH_CACHE });
    clearTimeout(t);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
