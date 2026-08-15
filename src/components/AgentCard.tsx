"use client";

import Link from "next/link";
import { CATEGORY_BY_ID } from "@/lib/categories";
import { money, scoreLabel, shortAddr } from "@/lib/format";
import { sourceLabel } from "@/lib/fallback";
import type { MarketplaceAgent } from "@/lib/types";

function deskLabel(id: MarketplaceAgent["primaryCategory"]) {
  return id === "other" ? "Unclassified" : CATEGORY_BY_ID[id].label;
}

export function AgentCard({
  agent,
  compared,
  onCompare,
  onHire,
}: {
  agent: MarketplaceAgent;
  compared?: boolean;
  onCompare?: (agent: MarketplaceAgent) => void;
  onHire?: (agent: MarketplaceAgent) => void;
}) {
  const catLabel = deskLabel(agent.primaryCategory);
  const fit = agent.fit?.find((f) => f.category === agent.primaryCategory);
  return (
    <article className="card">
      <div className="card-top">
        <div className="avatar">
          {agent.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.imageUrl} alt="" width={40} height={40} />
          ) : (
            agent.name.slice(0, 1)
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span className="badge">{catLabel}</span>
          {agent.source !== "live" && <span className="badge badge-ref">{sourceLabel(agent.source)}</span>}
          {agent.healthStatus?.status && (
            <span className="badge" title={agent.healthStatus.message ?? undefined}>
              {agent.healthStatus.status}
              {agent.healthStatus.score != null ? ` ${agent.healthStatus.score}` : ""}
            </span>
          )}
          {agent.a2aUrl && <span className="badge">A2A</span>}
        </div>
      </div>
      <h3>{agent.name}</h3>
      <p>{agent.description}</p>
      <div className="meta">
        <span>#{agent.tokenId}</span>
        <span>{shortAddr(agent.owner)}</span>
      </div>
      <div className="meta">
        <span>{agent.hirePriceTbnb == null ? "Price on quote" : money(agent.hirePriceTbnb)}</span>
        <span>
          fit {fit?.score ?? 0} · fb {scoreLabel(agent.trackRecord.averageScore)}
        </span>
      </div>
      {agent.strategy?.available ? (
        <div className="meta" style={{ color: "var(--green)" }}>
          {agent.strategy.facts
            .filter((f) => !f.empty)
            .slice(0, 2)
            .map((f) => `${f.label} ${f.value}`)
            .join(" · ") || "Live /status"}
        </div>
      ) : (
        <div className="meta">
          <span>{agent.strategy?.error ? "Live feed empty" : "No operator /status"}</span>
        </div>
      )}
      <div className="card-actions">
        <Link className="btn" href={`/agents/${agent.chainId}/${agent.tokenId}`}>
          Identity
        </Link>
        {onCompare && (
          <button className="btn" data-on={compared} onClick={() => onCompare(agent)}>
            {compared ? "Compared" : "Compare"}
          </button>
        )}
        {onHire && (
          <button className="btn btn-gold" onClick={() => onHire(agent)}>
            Hire
          </button>
        )}
      </div>
    </article>
  );
}
