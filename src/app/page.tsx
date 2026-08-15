import Link from "next/link";
import { DESKS } from "@/lib/categories";
import { listAllDesks } from "@/lib/query";
import { HireableCard } from "@/components/HireableCard";

const STEPS = [
  { n: "1", t: "Land on a desk", d: "Pick one job: rebalancing, grid, yield, or health factor." },
  { n: "2", t: "Find a live identity", d: "Every card is an ERC-8004 token on BNB Smart Chain." },
  { n: "3", t: "Understand the record", d: "Read registration, on-chain owner, and feedback — empty stays empty." },
  { n: "4", t: "Activate a hire", d: "Live A2A quote, then you sign createJob → registerJob → setBudget → approve → fund." },
];

export default async function HomePage() {
  const desks = await listAllDesks();

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="kicker">BNB Smart Chain · ERC-8004 · Build the Era</div>
          <h1>Four jobs. Live identities. One hire path.</h1>
          <p className="lede">
            ERA is the marketplace, not a portfolio of agents we run. You pick a job, we search the
            BSC registry, you read the record, you activate. If you have never used Agent Studio,
            start with a desk — there is no account wall. Home cards are the last successful live
            capture of real token IDs; open a desk to query 8004scan now.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-gold" href="/desks/rebalancing">
              Start with rebalancing
            </Link>
            <Link className="btn" href="/about">
              How live data works
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="kicker">First time here</div>
          <h2>Land → find → understand → activate</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {STEPS.map((s) => (
              <div key={s.n} className="card" style={{ minHeight: 0 }}>
                <span className="badge badge-gold">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <div className="kicker">Equal-depth desks</div>
              <h2>The four jobs the rubric scores</h2>
            </div>
          </div>
          <div className="grid">
            {DESKS.map((d) => {
              const result = desks[d.id];
              return (
                <Link key={d.id} href={`/desks/${d.id}`} className="card">
                  <span className="badge badge-gold">{d.label}</span>
                  <h3>{d.short}</h3>
                  <p>{d.blurb}</p>
                  <div className="meta">
                    <span>{result.agents.length} listed now</span>
                    <span>{result.source}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {DESKS.map((d) => {
        const result = desks[d.id];
        return (
          <section key={d.id} className="section">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <div className="kicker">{d.label}</div>
                  <h2>{d.short}</h2>
                  <p className="lede">{d.youGet}</p>
                </div>
                <Link className="btn" href={`/desks/${d.id}`}>
                  Open desk
                </Link>
              </div>
              {result.warning && <div className="banner">{result.warning}</div>}
              <div className="grid">
                {result.agents.slice(0, 4).map((agent) => (
                  <HireableCard key={agent.id} agent={agent} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
