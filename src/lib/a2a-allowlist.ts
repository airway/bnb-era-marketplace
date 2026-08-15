/** Live operator hosts from ERC-8004 registration — not an open proxy. */
const ALLOWED_HOSTS = new Set([
  "bnb-lp.172-104-171-139.nip.io",
  "bnb-guardian.172-104-171-139.nip.io",
  "bnb-yield.172-104-171-139.nip.io",
]);

const ALLOWED_SUFFIX = ".172-104-171-139.nip.io";

export function isAllowedA2AUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_HOSTS.has(u.hostname) || u.hostname.endsWith(ALLOWED_SUFFIX);
  } catch {
    return false;
  }
}

/** Pages-safe quote proxy. Same-origin /api/a2a works on the Worker after republish. */
export const PAGES_A2A_PROXY = "https://era-a2a-proxy.sedate-socks.workers.dev";

export function a2aProxyBases(): string[] {
  const raw = [
    "",
    process.env.NEXT_PUBLIC_API_BASE ?? "",
    PAGES_A2A_PROXY,
    "https://bnb-era-marketplace.iceline.workers.dev",
  ];
  const out: string[] = [];
  for (const b of raw) {
    const n = b.replace(/\/$/, "");
    if (!out.includes(n)) out.push(n);
  }
  return out;
}
