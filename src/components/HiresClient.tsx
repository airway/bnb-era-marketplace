"use client";

import { useEffect, useState } from "react";
import { getLocalHires, saveHireLocal } from "@/lib/client-store";
import { money, shortAddr } from "@/lib/format";
import type { HireRecord } from "@/lib/types";

export function HiresClient() {
  const [hires, setHires] = useState<HireRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHires(getLocalHires());
  }, []);

  async function advance(id: string) {
    setError(null);
    const res = await fetch(`/api/hires/${id}/advance`, { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      const local = hires.find((h) => h.hireId === id);
      if (!local) {
        setError(body.error ?? "Could not advance (server memory reset — start a new hire).");
        return;
      }
      const order = ["quoted", "funded", "working", "submitted", "settled"] as const;
      const idx = order.indexOf(local.status);
      const next = { ...local, status: order[Math.min(idx + 1, order.length - 1)] };
      saveHireLocal(next);
      setHires(getLocalHires());
      return;
    }
    saveHireLocal(body.hire);
    setHires(getLocalHires());
  }

  if (hires.length === 0) {
    return (
      <p className="empty">
        No hires yet. Open <a href="/marketplace">Browse</a>, pick an agent, and start a hire.
      </p>
    );
  }

  return (
    <>
      {error && <div className="banner">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Hire</th>
            <th>Agent</th>
            <th>Mandate</th>
            <th>Budget</th>
            <th>Rail</th>
            <th>Payer</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {hires.map((h) => (
            <tr key={h.hireId}>
              <td className="mono">{h.hireId}</td>
              <td>
                <a href={`/agents/${h.chainId}/${h.tokenId}`}>{h.agentName}</a>
              </td>
              <td>{h.mandateLabel}</td>
              <td>{money(h.budgetTbnb)}</td>
              <td>{h.paymentRail}</td>
              <td>{shortAddr(h.payer)}</td>
              <td>{h.status}</td>
              <td>
                {h.status !== "settled" && (
                  <button className="btn" onClick={() => advance(h.hireId)}>
                    Advance
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
