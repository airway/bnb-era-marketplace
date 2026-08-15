"use client";

import { useEffect, useState } from "react";
import { getLocalHires } from "@/lib/client-store";
import { explorerTx } from "@/lib/contracts";
import { formatU } from "@/lib/erc8183";
import { shortAddr } from "@/lib/format";
import type { HireRecord } from "@/lib/types";

export function HiresClient() {
  const [hires, setHires] = useState<HireRecord[]>([]);

  useEffect(() => {
    setHires(getLocalHires());
  }, []);

  if (hires.length === 0) {
    return (
      <p className="empty">
        No hires yet. Open a desk, pick a live identity, request a quote, and sign createJob.
      </p>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Hire</th>
          <th>Agent</th>
          <th>Mandate</th>
          <th>Quote</th>
          <th>Rail</th>
          <th>Payer</th>
          <th>Status</th>
          <th>On-chain</th>
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
            <td>{formatU(h.budgetRaw)}</td>
            <td>{h.paymentRail}</td>
            <td>{shortAddr(h.payer)}</td>
            <td>{h.status}</td>
            <td>
              {h.fundTxHash ? (
                <a href={explorerTx(h.chainId, h.fundTxHash)}>fund {shortAddr(h.fundTxHash)}</a>
              ) : h.createTxHash ? (
                <a href={explorerTx(h.chainId, h.createTxHash)}>
                  createJob {shortAddr(h.createTxHash)}
                  {h.jobId ? ` · job ${h.jobId}` : ""} — not funded
                </a>
              ) : (
                "quote only"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
