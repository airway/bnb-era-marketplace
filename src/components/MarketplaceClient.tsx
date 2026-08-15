"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AgentCard } from "./AgentCard";
import { HireDialog } from "./HireDialog";
import { DESKS } from "@/lib/categories";
import { getCompareIds, rememberAgents, toggleCompare } from "@/lib/client-store";
import type { AgentListResult, CategoryId, HireRecord, MarketplaceAgent } from "@/lib/types";

export function MarketplaceClient({
  initial,
  lockedCategory,
}: {
  initial?: AgentListResult;
  lockedCategory?: CategoryId;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<CategoryId | "all">(
    lockedCategory || (params.get("category") as CategoryId) || "all",
  );
  const [x402, setX402] = useState(params.get("x402") === "1");
  const [hideSpam, setHideSpam] = useState(params.get("spam") !== "0");
  const [sort, setSort] = useState(params.get("sort") ?? (lockedCategory ? "fit" : "newest"));
  const [data, setData] = useState<AgentListResult | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [compare, setCompare] = useState<string[]>([]);
  const [hiring, setHiring] = useState<MarketplaceAgent | null>(null);
  const [hired, setHired] = useState<HireRecord | null>(null);

  useEffect(() => {
    setCompare(getCompareIds());
  }, []);

  useEffect(() => {
    if (lockedCategory) return;
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category !== "all") next.set("category", category);
    if (x402) next.set("x402", "1");
    if (!hideSpam) next.set("spam", "0");
    if (sort !== "newest") next.set("sort", sort);
    router.replace(`/marketplace?${next.toString()}`, { scroll: false });
  }, [q, category, x402, hideSpam, sort, router, lockedCategory]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({
      q,
      category: lockedCategory || category,
      x402: x402 ? "1" : "0",
      hideSpam: hideSpam ? "1" : "0",
      sort,
      preferLive: "1",
    });
    fetch(`/api/agents?${qs}`)
      .then((r) => {
        if (!r.ok) throw new Error("api");
        return r.json();
      })
      .then((body: AgentListResult) => {
        if (cancelled) return;
        setData(body);
        rememberAgents(body.agents);
      })
      .catch(() => {
        if (cancelled) return;
        if (initial) {
          setData(initial);
          rememberAgents(initial.agents);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, category, x402, hideSpam, sort, lockedCategory]);

  const agents = data?.agents ?? [];
  const comparedAgents = useMemo(
    () => agents.filter((a) => compare.includes(a.id)),
    [agents, compare],
  );

  return (
    <div>
      {data?.warning && <div className="banner">{data.warning}</div>}
      {!data?.warning && data?.source === "live" && (
        <div className="banner">
          Live 8004scan on BNB Smart Chain. Fit score is inferred from the registration text, then
          you can confirm on-chain <code>tokenURI</code> on the identity page.
        </div>
      )}

      {!lockedCategory && (
        <div className="pills" style={{ marginBottom: 16 }}>
          <button className="pill" data-on={category === "all"} onClick={() => setCategory("all")}>
            All
          </button>
          {DESKS.map((c) => (
            <button
              key={c.id}
              className="pill"
              data-on={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="filters">
        <input
          className="search"
          placeholder="Search name, description, token, owner…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="search" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="fit">Fit to desk</option>
          <option value="newest">Newest</option>
          <option value="score">On-chain feedback</option>
          <option value="price">Hire price</option>
          <option value="name">Name</option>
        </select>
        <button className="pill" data-on={x402} onClick={() => setX402((v) => !v)}>
          x402 only
        </button>
        <button className="pill" data-on={hideSpam} onClick={() => setHideSpam((v) => !v)}>
          Hide mash names
        </button>
      </div>

      {loading && <p className="empty">Searching the live index…</p>}
      {!loading && agents.length === 0 && (
        <p className="empty">
          No live identities matched this filter. Open another desk or clear search — do not invent
          an agent.
        </p>
      )}

      <div className="grid">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            compared={compare.includes(agent.id)}
            onCompare={(a) => setCompare(toggleCompare(a.id))}
            onHire={setHiring}
          />
        ))}
      </div>

      {compare.length > 0 && (
        <div className="compare-bar">
          <div>
            {compare.length} selected
            {comparedAgents.length > 0 && (
              <span style={{ color: "var(--muted)" }}>
                {" "}
                — {comparedAgents.map((a) => a.name).join(", ")}
              </span>
            )}
          </div>
          <a className="btn btn-gold" href={`/compare?ids=${compare.join(",")}`}>
            Open compare
          </a>
        </div>
      )}

      {hiring && !hired && (
        <HireDialog agent={hiring} onClose={() => setHiring(null)} onHired={setHired} />
      )}
      {hired && (
        <div className="modal-back">
          <div className="modal">
            <div className="kicker">Hire opened</div>
            <h2>{hired.hireId}</h2>
            <p>
              {hired.agentName} · {hired.mandateLabel} · {hired.status}
            </p>
            <p style={{ color: "var(--muted)" }}>{hired.note}</p>
            <div className="card-actions">
              <a className="btn btn-gold" href="/hires">
                Go to my hires
              </a>
              <button
                className="btn"
                onClick={() => {
                  setHired(null);
                  setHiring(null);
                }}
              >
                Keep browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
