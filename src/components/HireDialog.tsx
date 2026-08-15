"use client";

import { useMemo, useState } from "react";
import { MANDATES } from "@/lib/categories";
import { money } from "@/lib/format";
import { saveHireLocal } from "@/lib/client-store";
import type { HireRecord, MarketplaceAgent, PaymentRail } from "@/lib/types";

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
  const [mandateId, setMandateId] = useState(mandates[0]?.id ?? "watch-wallet");
  const mandate = mandates.find((m) => m.id === mandateId) ?? mandates[0];
  const [budget, setBudget] = useState(String(agent.hirePriceTbnb || mandate?.defaultBudget || 0.02));
  const [rail, setRail] = useState<PaymentRail>("mock-x402");
  const [payer, setPayer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } })
      .ethereum;
    if (!eth) {
      setPayer("0xDEMO000000000000000000000000000000000001");
      return;
    }
    const accs = await eth.request({ method: "eth_requestAccounts" });
    if (accs[0]) setPayer(accs[0]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          mandateId,
          budgetTbnb: Number(budget),
          paymentRail: rail,
          payer,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Hire failed");
      saveHireLocal(body.hire);
      onHired(body.hire);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hire failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-back" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="kicker">Start a hire</div>
        <h2 style={{ marginTop: 8 }}>{agent.name}</h2>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Testnet / mock payments only. Nothing leaves this browser except the hire record on the
          local API.
        </p>
        <div className="field">
          <label htmlFor="mandate">Mandate</label>
          <select id="mandate" className="search" value={mandateId} onChange={(e) => setMandateId(e.target.value)}>
            {mandates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <small style={{ color: "var(--muted)" }}>{mandate?.description}</small>
        </div>
        <div className="field">
          <label htmlFor="budget">Budget</label>
          <input id="budget" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="rail">Payment rail</label>
          <select id="rail" className="search" value={rail} onChange={(e) => setRail(e.target.value as PaymentRail)}>
            <option value="mock-x402">Mock x402 (instant fund)</option>
            <option value="mock-escrow">Mock ERC-8183 escrow</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="payer">Payer</label>
          <input
            id="payer"
            placeholder="0x… or leave blank for demo address"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
          />
          <button type="button" className="btn" onClick={connect}>
            Use wallet if present
          </button>
        </div>
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="card-actions">
          <button className="btn btn-gold" disabled={busy} onClick={submit}>
            {busy ? "Hiring…" : `Pay ${money(Number(budget) || 0)}`}
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
