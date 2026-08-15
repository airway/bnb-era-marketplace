/** Allowlisted A2A quote proxy for GitHub Pages (operators omit CORS). */

const ALLOWED_HOSTS = new Set([
  "bnb-lp.172-104-171-139.nip.io",
  "bnb-guardian.172-104-171-139.nip.io",
  "bnb-yield.172-104-171-139.nip.io",
]);
const ALLOWED_SUFFIX = ".172-104-171-139.nip.io";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, accept",
  "Access-Control-Max-Age": "86400",
};

function isAllowedA2AUrl(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return ALLOWED_HOSTS.has(u.hostname) || u.hostname.endsWith(ALLOWED_SUFFIX);
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: CORS });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    const path = new URL(request.url).pathname.replace(/\/$/, "") || "/";
    if (request.method !== "POST" || (path !== "/" && path !== "/api/a2a")) {
      return json({ error: "POST /api/a2a with { a2aUrl, payload }" }, 404);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid json" }, 400);
    }
    const a2aUrl = body?.a2aUrl;
    const payload = body?.payload;
    if (typeof a2aUrl !== "string" || payload == null || !isAllowedA2AUrl(a2aUrl)) {
      return json({ error: "a2aUrl is not an allowlisted operator" }, 400);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(a2aUrl, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: {
          ...CORS,
          "content-type": res.headers.get("content-type") || "application/json",
        },
      });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "proxy failed" }, 502);
    } finally {
      clearTimeout(timer);
    }
  },
};
