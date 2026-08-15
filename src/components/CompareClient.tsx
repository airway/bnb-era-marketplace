"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCompareIds, recallAgent } from "@/lib/client-store";
import { money, scoreLabel, shortAddr } from "@/lib/format";
import { sourceLabel } from "@/lib/fallback";
import type { MarketplaceAgent } from "@/lib/types";

async function loadOne(id: string): Promise<MarketplaceAgent | null> {
  const cached = recallAgent(id);
  if (cached) return cached;
  const token = id.includes(":") ? id.split(":").pop()! : id;
  const chain = id.startsWith("56:") || id.startsWith("ref") ? 56 : 56;
  const res = await fetch(`/api/agents/${chain}/${encodeURIComponent(token)}`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.agent as MarketplaceAgent;
}

export function CompareClient() {
  const params = useSearchParams();
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);

  useEffect(() => {
    const fromQuery = (params.get("ids") ?? "").split(",").filter(Boolean);
    const ids = fromQuery.length ? fromQuery : getCompareIds();
    Promise.all(ids.map(loadOne)).then((rows) => setAgents(rows.filter(Boolean) as MarketplaceAgent[]));
  }, [params]);

  if (agents.length === 0) {
    return (
      <p className="empty">
        Nothing selected. Open <a href="/marketplace">Browse</a> and tap Compare on two or three cards.
      </p>
    );
  }

  const rows: { label: string; render: (a: MarketplaceAgent) => string }[] = [
    { label: "Category", render: (a) => a.primaryCategory },
    { label: "Source", render: (a) => sourceLabel(a.source) },
    { label: "Token", render: (a) => a.tokenId },
    { label: "Owner", render: (a) => shortAddr(a.owner) },
    { label: "x402", render: (a) => (a.x402 ? "yes" : "no") },
    { label: "Protocols", render: (a) => a.protocols.join(", ") || "—" },
    { label: "Hire quote", render: (a) => money(a.hirePriceTbnb) },
    { label: "Feedbacks", render: (a) => String(a.trackRecord.feedbackCount) },
    { label: "Score", render: (a) => scoreLabel(a.trackRecord.averageScore) },
    { label: "Validations", render: (a) => String(a.trackRecord.validationCount) },
    { label: "Track record", render: (a) => a.trackRecord.source },
    { label: "Trust", render: (a) => a.supportedTrust.join(", ") || "—" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Field</th>
            {agents.map((a) => (
              <th key={a.id}>
                <a href={`/agents/${a.chainId}/${a.tokenId}`}>{a.name}</a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>What they do</td>
            {agents.map((a) => (
              <td key={a.id}>{a.description}</td>
            ))}
          </tr>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              {agents.map((a) => (
                <td key={a.id}>{row.render(a)}</td>
              ))}
            </tr>
          ))}
          <tr>
            <td>Hire</td>
            {agents.map((a) => (
              <td key={a.id}>
                <a className="btn btn-gold" href={`/agents/${a.chainId}/${a.tokenId}`}>
                  Open
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
