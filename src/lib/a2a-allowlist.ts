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

export function isStaticPages(): boolean {
  return process.env.NEXT_PUBLIC_STATIC === "1";
}

/**
 * Allowlisted A2A quote proxy we control (temporary CF account).
 * GitHub Pages has no /api/a2a — do not use same-origin there.
 */
export const PAGES_A2A_PROXY = "https://era-a2a-proxy.splendid-entree.workers.dev";

export function a2aProxyBases(): string[] {
  const configured = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");
  if (isStaticPages()) {
    const bases = [PAGES_A2A_PROXY, configured];
    return [...new Set(bases.filter(Boolean))];
  }
  const raw = ["", configured, PAGES_A2A_PROXY];
  const out: string[] = [];
  for (const b of raw) {
    if (!out.includes(b)) out.push(b);
  }
  return out;
}
