"use client";

import { useMemo, useState } from "react";
import { MANDATES } from "@/lib/categories";
import { explorerTx } from "@/lib/contracts";
import { formatU } from "@/lib/erc8183";
import { saveHireLocal } from "@/lib/client-store";
import { quoteHireLocal } from "@/lib/hire-client";
import type { HireRecord, MarketplaceAgent, PaymentRail, UnsignedTx } from "@/lib/types";

async function sendTx(
  eth: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> },
  from: string,
  tx: UnsignedTx,
): Promise<string> {
  const hash = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: tx.to, data: tx.data, value: tx.value }],
  });
  return String(hash);
}

export function HireDialog({
  agent,
  onClose,
  onHired,
}: {
  agent: MarketplaceAgent;
  onClose: () => void;
  onHired: (hire: HireRecord) => void;
}) {
  const mandates = useMemo(
    () =>
      MANDATES.filter((m) => agent.categories.includes(m.category)).concat(
        MANDATES.filter((m) => !agent.categories.includes(m.category)),
      ),
    [agent.categories],
  );
  const [mandateId, setMandateId] = useState(mandates[0]?.id ?? "rebalance-range");
  const mandate = mandates.find((m) => m.id === mandateId) ?? mandates[0];
  const [rail, setRail] = useState<PaymentRail>("erc-8183");
  const [payer, setPayer] = useState("");
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((mandate?.fields ?? []).map((f) => [f.id, f.defaultValue])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hire, setHire] = useState<HireRecord | null>(null);
  const [jobId, setJobId] = useState("");

  function changeMandate(id: string) {
    setMandateId(id);
    const next = MANDATES.find((m) => m.id === id);
    setInputs(Object.fromEntries((next?.fields ?? []).map((f) => [f.id, f.defaultValue])));
  }

  async function connect() {
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } })
      .ethereum;
    if (!eth) {
      setError("No injected wallet. You can still request a live quote and copy the createJob calldata.");
      return;
    }
    const accs = await eth.request({ method: "eth_requestAccounts" });
    if (accs[0]) setPayer(accs[0]);
  }

  async function quote() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        agentId: agent.id,
        mandateId,
        budgetTbnb: agent.hirePriceTbnb,
        paymentRail: rail,
        payer,
        inputs,
      };
      let next: HireRecord | null = null;
      try {
        const res = await fetch("/api/hire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json();
        if (res.ok) next = body.hire;
      } catch {
        next = null;
      }
      if (!next) next = await quoteHireLocal(agent, { mandateId, paymentRail: rail, payer, inputs });
      saveHireLocal(next);
      setHire(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setBusy(false);
    }
  }

  async function signCreate() {
    if (!hire?.txs?.length) {
      setError("No unsigned createJob — the agent has no provider address.");
      return;
    }
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } })
      .ethereum;
    if (!eth) {
      setError("Connect a wallet on BNB Smart Chain (56) to submit createJob.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!payer) await connect();
      const from = payer || ((await eth.request({ method: "eth_requestAccounts" })) as string[])[0];
      const chain = await eth.request({ method: "eth_chainId" });
      if (String(chain) !== "0x38") {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x38" }],
        });
      }
      const hash = await sendTx(eth, from, hire.txs[0]);
      let next: HireRecord = {
        ...hire,
        createTxHash: hash,
        payer: from,
        jobId: jobId || hire.jobId,
        status: "funded",
        note: `createJob submitted ${hash} on BNB Smart Chain.`,
      };
      try {
        const res = await fetch("/api/hire/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hire, createTxHash: hash, payer: from, jobId: jobId || undefined }),
        });
        const body = await res.json();
        if (res.ok) next = body.hire;
      } catch {
        /* local record still has the tx hash */
      }
      saveHireLocal(next);
      setHire(next);
      onHired(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "createJob failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendNotify() {
    if (!hire || !jobId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hire/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hire, jobId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "notify failed");
      saveHireLocal(body.hire);
      setHire(body.hire);
      onHired(body.hire);
    } catch (err) {
      setError(err instanceof Error ? err.message : "notify_funded failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = agent.readiness;
  const missing = ready
    ? [
        !ready.hasFeedback && "no on-chain feedback yet",
        !ready.hasA2A && "no A2A URL",
        !ready.hasLiveStrategy && "no live /status feed",
        !ready.hasWallet && "agent wallet unset",
      ].filter(Boolean)
    : [];

  return (
    <div className="modal-back" role="dialog" aria-modal="true">
      <div className="modal" style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div className="kicker">Activate a live hire</div>
        <h2 style={{ marginTop: 8 }}>{agent.name}</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          ERC-8183 on BNB Smart Chain (AgenticCommerce {agent.chainId === 56 ? "mainnet" : "testnet"}).
          We request a live A2A quote, then you sign createJob. No mock clock.
        </p>
        {missing.length > 0 && (
          <div className="banner">Before you hire: {missing.join(" · ")}. Quote still runs if an endpoint exists.</div>
        )}
        {!hire && (
          <>
            <div className="field">
              <label htmlFor="mandate">Mandate</label>
              <select id="mandate" className="search" value={mandateId} onChange={(e) => changeMandate(e.target.value)}>
                {mandates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <small style={{ color: "var(--muted)" }}>{mandate?.description}</small>
            </div>
            {mandate?.fields.map((f) => (
              <div className="field" key={f.id}>
                <label htmlFor={f.id}>{f.label}</label>
                <input
                  id={f.id}
                  placeholder={f.placeholder}
                  value={inputs[f.id] ?? ""}
                  onChange={(e) => setInputs((cur) => ({ ...cur, [f.id]: e.target.value }))}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="rail">Rail</label>
              <select id="rail" className="search" value={rail} onChange={(e) => setRail(e.target.value as PaymentRail)}>
                <option value="erc-8183">ERC-8183 (A2A negotiate → createJob)</option>
                <option value="x402-probe">x402 probe (live HTTP 402 if the endpoint asks)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="payer">Payer</label>
              <input
                id="payer"
                placeholder="0x… from your wallet"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
              />
              <button type="button" className="btn" onClick={connect}>
                Connect wallet
              </button>
            </div>
          </>
        )}
        {hire && (
          <div className="panel" style={{ margin: "12px 0" }}>
            <h3>Live quote</h3>
            <dl className="kv">
              <dt>Status</dt>
              <dd>{hire.status}</dd>
              <dt>Accepted</dt>
              <dd>{hire.quote ? String(hire.quote.accepted) : "—"}</dd>
              <dt>Price</dt>
              <dd>{formatU(hire.quote?.priceRaw)}</dd>
              <dt>Provider</dt>
              <dd>{hire.quote?.provider ?? "—"}</dd>
              <dt>Commerce</dt>
              <dd>{hire.quote?.verifyingContract ?? "—"}</dd>
              <dt>Negotiation</dt>
              <dd>{hire.quote?.negotiationHash ?? "—"}</dd>
              <dt>createJob tx</dt>
              <dd>
                {hire.createTxHash ? (
                  <a href={explorerTx(hire.chainId, hire.createTxHash)}>{hire.createTxHash}</a>
                ) : (
                  "not sent"
                )}
              </dd>
            </dl>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{hire.note}</p>
            {hire.quote?.error && <p style={{ color: "var(--red)" }}>{hire.quote.error}</p>}
            {hire.txs?.[0] && (
              <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "var(--muted)" }}>
                {`to: ${hire.txs[0].to}\ndata: ${hire.txs[0].data.slice(0, 220)}…`}
              </pre>
            )}
            {hire.x402 && (
              <p style={{ fontSize: 13 }}>
                x402 probe HTTP {hire.x402.status} on {hire.x402.url}
              </p>
            )}
            <div className="field">
              <label htmlFor="jobId">On-chain job id (from JobCreated, after you fund)</label>
              <input id="jobId" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="e.g. 42" />
            </div>
          </div>
        )}
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="card-actions">
          {!hire && (
            <button className="btn btn-gold" disabled={busy} onClick={quote}>
              {busy ? "Negotiating…" : "Request live quote"}
            </button>
          )}
          {hire && !hire.createTxHash && (
            <button className="btn btn-gold" disabled={busy} onClick={signCreate}>
              {busy ? "Waiting for wallet…" : "Sign createJob"}
            </button>
          )}
          {hire && hire.createTxHash && (
            <button className="btn btn-gold" disabled={busy || !jobId} onClick={sendNotify}>
              notify_funded
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
