export interface X402Probe {
  url: string;
  status: number;
  paymentRequired: unknown;
  header: string | null;
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
