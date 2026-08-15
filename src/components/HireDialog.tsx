"use client";

import { useMemo, useState } from "react";
import { MANDATES } from "@/lib/categories";
import { COMMERCE, explorerTx } from "@/lib/contracts";
import { notifyFunded } from "@/lib/a2a";
import { buildFundSequence, formatU, parseJobCreatedId } from "@/lib/erc8183";
import { saveHireLocal } from "@/lib/client-store";
import { quoteHireLocal } from "@/lib/hire-client";
import type { HireRecord, MarketplaceAgent, PaymentRail, UnsignedTx } from "@/lib/types";

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

async function sendTx(eth: Eth, from: string, tx: UnsignedTx): Promise<string> {
  const hash = await eth.request({
    method: "eth_sendTransaction",
    params: [{ from, to: tx.to, data: tx.data, value: tx.value }],
  });
  return String(hash);
}

async function waitReceipt(eth: Eth, hash: string): Promise<{ status?: string; logs?: { address?: string; topics?: string[] }[] }> {
  for (let i = 0; i < 90; i++) {
    const r = (await eth.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    })) as { status?: string; logs?: { address?: string; topics?: string[] }[] } | null;
    if (r && r.status) {
      if (r.status === "0x0") throw new Error(`Transaction reverted: ${hash}`);
      return r;
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  throw new Error(`Timed out waiting for ${hash}`);
}

async function jobIdFromCreate(eth: Eth, hash: string, chainId: number, commerce: string): Promise<string> {
  const receipt = await waitReceipt(eth, hash);
  const fromLogs = parseJobCreatedId(receipt.logs, commerce);
  if (fromLogs) return fromLogs;
  try {
    const res = await fetch("/api/hire/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash: hash, chainId }),
    });
    const body = (await res.json()) as { jobId?: string | null; error?: string };
    if (body.jobId) return body.jobId;
    if (body.error) throw new Error(body.error);
  } catch (err) {
    if (err instanceof Error && err.message !== "Failed to fetch") throw err;
  }
  throw new Error("createJob confirmed but JobCreated was not in the receipt. Try again — we will not ask you to type a job id.");
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
  const [stepLabel, setStepLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hire, setHire] = useState<HireRecord | null>(null);

  function changeMandate(id: string) {
    setMandateId(id);
    const next = MANDATES.find((m) => m.id === id);
    setInputs(Object.fromEntries((next?.fields ?? []).map((f) => [f.id, f.defaultValue])));
  }

  async function connect(): Promise<string | undefined> {
    const eth = (window as unknown as { ethereum?: Eth }).ethereum;
    if (!eth) {
      setError("No injected wallet. You can still request a live quote and copy the createJob calldata.");
      return;
    }
    const accs = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    if (accs[0]) setPayer(accs[0]);
    return accs[0];
  }

  async function ensureChain(eth: Eth) {
    const chain = await eth.request({ method: "eth_chainId" });
    if (String(chain) !== "0x38") {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }],
      });
    }
  }

  async function quote(): Promise<HireRecord> {
    const payload = {
      agentId: agent.id,
      mandateId,
        budgetTbnb: agent.hirePriceTbnb ?? 0,
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
    return next;
  }

  async function requestQuote() {
    setBusy(true);
    setError(null);
    try {
      await quote();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quote failed");
    } finally {
      setBusy(false);
    }
  }

  async function persist(path: string, body: unknown, fallback: HireRecord): Promise<HireRecord> {
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok && json.hire) return json.hire as HireRecord;
    } catch {
      /* Worker or static host — keep the local record */
    }
    return fallback;
  }

  async function startHire() {
    const eth = (window as unknown as { ethereum?: Eth }).ethereum;
    if (!eth) {
      setError("Connect a wallet on BNB Smart Chain (56) to create and fund the job.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const from = payer || (await connect());
      if (!from) throw new Error("Connect a wallet first.");
      await ensureChain(eth);

      setStepLabel("Requesting live A2A quote…");
      const quoted = hire?.txs?.length ? hire : await quote();
      if (rail !== "erc-8183") {
        setHire(quoted);
        return;
      }
      if (!quoted.txs?.[0] && !quoted.jobId) throw new Error("No unsigned createJob — the agent has no provider address.");
      const amount = quoted.quote?.priceRaw ?? quoted.budgetRaw;
      if (!amount) throw new Error("Quote has no price. We will not invent a budget.");

      let next: HireRecord = { ...quoted, payer: from };
      let jobId = quoted.jobId ?? null;
      if (!jobId) {
        setStepLabel("Sign 1/5: createJob");
        const createHash = await sendTx(eth, from, quoted.txs![0]);
        setStepLabel("Waiting for JobCreated…");
        const commerce = quoted.quote?.verifyingContract || COMMERCE[quoted.chainId] || COMMERCE[56];
        jobId = await jobIdFromCreate(eth, createHash, quoted.chainId, commerce);
        next = {
          ...next,
          createTxHash: createHash,
          jobId,
          status: "created",
          note: `createJob confirmed. Job ${jobId}. Not funded until fund() confirms.`,
        };
        next = await persist("/api/hire/confirm", { hire: next, createTxHash: createHash, payer: from, jobId }, next);
        saveHireLocal(next);
        setHire(next);
      }

      if (!jobId) throw new Error("Job id missing after createJob.");
      const sequence = buildFundSequence(quoted.chainId, jobId, amount);
      const labels = ["Sign 2/5: registerJob", "Sign 3/5: setBudget", "Sign 4/5: approve U", "Sign 5/5: fund"];
      const hashes: (string | undefined)[] = [
        next.registerTxHash ?? undefined,
        next.budgetTxHash ?? undefined,
        next.approveTxHash ?? undefined,
        next.fundTxHash ?? undefined,
      ];
      for (let i = 0; i < sequence.length; i++) {
        if (hashes[i]) continue;
        setStepLabel(labels[i]);
        const hash = await sendTx(eth, from, sequence[i]);
        await waitReceipt(eth, hash);
        hashes[i] = hash;
        next = {
          ...next,
          registerTxHash: hashes[0] ?? null,
          budgetTxHash: hashes[1] ?? null,
          approveTxHash: hashes[2] ?? null,
          fundTxHash: hashes[3] ?? null,
          status: "created",
          note: `${sequence[i].label} confirmed. Job ${jobId} is not funded until fund() confirms.`,
        };
        saveHireLocal(next);
        setHire(next);
      }

      const fundTxHash = hashes[3];
      if (!fundTxHash) throw new Error("fund() was not submitted.");
      next = {
        ...next,
        fundTxHash,
        status: "funded",
        note: `fund() confirmed ${fundTxHash} for job ${jobId}. U is in AgenticCommerce escrow.`,
      };
      setStepLabel("Notifying the agent…");
      if (next.quote?.a2aUrl) {
        next.notifyResult = await notifyFunded(next.quote.a2aUrl, jobId);
        next.status = "working";
        next.note = `Funded job ${jobId}. notify_funded sent to the live A2A endpoint.`;
      }
      next = await persist(
        "/api/hire/fund",
        {
          hire: next,
          jobId,
          fundTxHash,
          registerTxHash: hashes[0],
          budgetTxHash: hashes[1],
          approveTxHash: hashes[2],
          payer: from,
        },
        next,
      );
      saveHireLocal(next);
      setHire(next);
      onHired(next);
      setStepLabel(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hire failed");
      setStepLabel(null);
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
  const funded = hire?.status === "funded" || hire?.status === "working";

  return (
    <div className="modal-back" role="dialog" aria-modal="true">
      <div className="modal" style={{ width: "min(640px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div className="kicker">Activate a live hire</div>
        <h2 style={{ marginTop: 8 }}>{agent.name}</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Official ERC-8183 sequence on BNB Smart Chain: A2A quote → createJob → registerJob →
          setBudget → approve U → fund(). A hire is not funded until fund() confirms. Job id is
          read from JobCreated — you do not type it.
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
                <option value="erc-8183">ERC-8183 escrow (createJob → fund() moves U on-chain)</option>
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
              <button type="button" className="btn" onClick={() => void connect()}>
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
              <dt>Job id</dt>
              <dd>{hire.jobId ?? "read from JobCreated after createJob"}</dd>
              <dt>createJob</dt>
              <dd>
                {hire.createTxHash ? (
                  <a href={explorerTx(hire.chainId, hire.createTxHash)}>{hire.createTxHash}</a>
                ) : (
                  "not sent"
                )}
              </dd>
              <dt>fund</dt>
              <dd>
                {hire.fundTxHash ? (
                  <a href={explorerTx(hire.chainId, hire.fundTxHash)}>{hire.fundTxHash}</a>
                ) : (
                  "not funded"
                )}
              </dd>
            </dl>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>{hire.note}</p>
            {hire.quote?.error && <p style={{ color: "var(--red)" }}>{hire.quote.error}</p>}
            {hire.notifyResult && (
              <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 11, color: "var(--muted)" }}>
                {hire.notifyResult}
              </pre>
            )}
          </div>
        )}
        {stepLabel && <p style={{ color: "var(--gold, #c9a227)" }}>{stepLabel}</p>}
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="card-actions">
          {!hire && (
            <button className="btn" disabled={busy} onClick={() => void requestQuote()}>
              {busy ? "Negotiating…" : "Request live quote"}
            </button>
          )}
          {rail === "erc-8183" && !funded && (
            <button className="btn btn-gold" disabled={busy} onClick={() => void startHire()}>
              {busy ? stepLabel ?? "Waiting for wallet…" : hire?.jobId ? "Resume fund sequence" : "Start hire"}
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
