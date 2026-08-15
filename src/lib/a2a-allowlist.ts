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

/** Only browser A2A URL for the GitHub Pages export. No fallbacks. */
export const PAGES_A2A_URL = "https://era-a2a-proxy.iceline.workers.dev/api/a2a";
