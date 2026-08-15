import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { snapshotPagination } from "@/lib/fallback";
import { listMarketplaceAgents } from "@/lib/query";
import { AgentCard } from "@/components/AgentCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await listMarketplaceAgents({
    includeReference: true,
    preferLive: true,
    hideSpam: true,
    limit: 8,
    page: 1,
  });
  const liveTotal = snapshotPagination().total;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="kicker">BNB Smart Chain · ERC-8004 · Build the Era</div>
          <h1>Find an agent. See the record. Hire it.</h1>
          <p className="lede">
            ERA is a marketplace for agents already registered on BNB Smart Chain — not a
            portfolio of demos. Identity comes from the ERC-8004 registry. Performance is
            on-chain when it exists, and labeled when it does not.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" href="/marketplace">
              Browse the registry
            </Link>
            <Link className="btn" href="/about">
              How data works
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <b>{liveTotal.toLocaleString()}</b>
              <span>BSC identities in last live snapshot</span>
            </div>
            <div className="stat">
              <b>{featured.source === "live" ? "Live" : "Fallback"}</b>
              <span>Index used for this page</span>
            </div>
            <div className="stat">
              <b>56</b>
              <span>BNB Smart Chain id</span>
            </div>
            <div className="stat">
              <b>Mock</b>
              <span>x402 / escrow hire rail</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">Categories the brief asked for</div>
              <h2>Search by the job, not the thread.</h2>
            </div>
          </div>
          <div className="grid">
            {CATEGORIES.filter((c) =>
              ["monitoring", "grid", "health-factor", "yield", "trading", "research", "security", "payments"].includes(
                c.id,
              ),
            ).map((c) => (
              <Link key={c.id} href={`/marketplace?category=${c.id}`} className="card">
                <span className="badge badge-gold">{c.label}</span>
                <h3>{c.short}</h3>
                <p>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">On the floor now</div>
              <h2>A slice of the index</h2>
            </div>
            <Link className="btn" href="/marketplace">
              Open full browse
            </Link>
          </div>
          {featured.warning && <div className="banner">{featured.warning}</div>}
          <div className="grid">
            {featured.agents.slice(0, 8).map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
