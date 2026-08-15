import { isAllowedA2AUrl } from "@/lib/a2a-allowlist";
import { corsJson, corsOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request) {
  let body: { a2aUrl?: string; payload?: unknown };
  try {
    body = (await req.json()) as { a2aUrl?: string; payload?: unknown };
  } catch {
    return corsJson({ error: "invalid json" }, { status: 400 });
  }
  const a2aUrl = body.a2aUrl;
  const payload = body.payload;
  if (typeof a2aUrl !== "string" || payload == null || !isAllowedA2AUrl(a2aUrl)) {
    return corsJson({ error: "a2aUrl is not an allowlisted operator" }, { status: 400 });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(a2aUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = text;
    try {
      json = JSON.parse(text);
    } catch {
      json = { text: text.slice(0, 400) };
    }
    return corsJson(json, { status: res.status });
  } catch (err) {
    return corsJson(
      { error: err instanceof Error ? err.message : "A2A proxy failed" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
