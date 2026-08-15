import Link from "next/link";
import { notFound } from "next/navigation";
import { DESKS, MANDATES } from "@/lib/categories";
import { listMarketplaceAgents } from "@/lib/query";
import { MarketplaceClient } from "@/components/MarketplaceClient";
import type { CategoryId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DeskPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const desk = DESKS.find((d) => d.id === category);
  if (!desk) notFound();
  const mandate = MANDATES.find((m) => m.category === desk.id);
  const initial = await listMarketplaceAgents({
    category: desk.id as CategoryId,
    limit: 24,
    sort: "fit",
  });

  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">Desk · {desk.label}</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>{desk.short}</h1>
        <p className="lede">{desk.blurb}</p>

        <div className="grid" style={{ margin: "24px 0" }}>
          <div className="panel">
            <h3>You provide</h3>
            <p>{desk.youProvide}</p>
          </div>
          <div className="panel">
            <h3>You get</h3>
            <p>{desk.youGet}</p>
          </div>
          <div className="panel">
            <h3>Risk</h3>
            <p>{desk.risk}</p>
          </div>
          <div className="panel">
            <h3>Activate</h3>
            <p>{mandate?.description}</p>
            <p className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>
              Mandate {mandate?.id} · default {mandate?.defaultBudget} tBNB
            </p>
          </div>
        </div>

        <p style={{ color: "var(--muted)" }}>
          Live search terms: {desk.searchTerms.map((t) => `“${t}”`).join(", ")} on 8004scan
          (chain 56), then an on-chain <code>tokenURI</code> / <code>ownerOf</code> read when you
          open a card. Weak keyword hits are dropped.
        </p>

        <div className="pills" style={{ margin: "16px 0 24px" }}>
          {DESKS.map((d) => (
            <Link key={d.id} href={`/desks/${d.id}`} className="pill" data-on={d.id === desk.id}>
              {d.label}
            </Link>
          ))}
          <Link className="pill" href="/marketplace">
            All live
          </Link>
        </div>

        <MarketplaceClient initial={initial} lockedCategory={desk.id} />
      </div>
    </section>
  );
}
