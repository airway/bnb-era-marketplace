/** Registration endpoints that still contain a `{agentId}` template. */

export function resolveAgentPlaceholder(url: string, tokenId: string): string {
  if (!url.includes("{agentId}")) return url;
  if (!/^\d+$/.test(tokenId)) return url;
  return url.split("{agentId}").join(tokenId);
}

/** Termix catalog card / services URL — live JSON, not a negotiable A2A. */
export function isTermixCatalogUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === "platform-backend.prod.termix.live" && u.pathname.includes("/a2a/agents/");
  } catch {
    return false;
  }
}
