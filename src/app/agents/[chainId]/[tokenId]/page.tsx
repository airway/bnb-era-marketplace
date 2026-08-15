import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentHireButton } from "@/components/AgentHireButton";
import { CATEGORY_BY_ID } from "@/lib/categories";
import { explorerAddress, explorerTx, IDENTITY_REGISTRY, REPUTATION_REGISTRY } from "@/lib/contracts";
import { sourceLabel } from "@/lib/fallback";
import { money, scoreLabel, shortAddr } from "@/lib/format";
import { getMarketplaceAgent } from "@/lib/query";

export const dynamic = "force-dynamic";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ chainId: string; tokenId: string }>;
}) {
  const { chainId, tokenId } = await params;
  const chain = Number(chainId);
  let result: Awaited<ReturnType<typeof getMarketplaceAgent>>;
  try {
    result = await getMarketplaceAgent(chain, decodeURIComponent(tokenId));
  } catch {
    notFound();
  }
  const { agent, warning } = result;
  const cat = CATEGORY_BY_ID[agent.primaryCategory];

  return (
    <section className="wrap detail">
      <div>
        <div className="kicker">Agent identity</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>{agent.name}</h1>
        <p className="lede">{agent.description}</p>
        {warning && <div className="banner">{warning}</div>}
        <div className="pills" style={{ margin: "16px 0 24px" }}>
          {agent.categories.map((c) => (
            <Link key={c} className="pill" href={`/marketplace?category=${c}`}>
              {CATEGORY_BY_ID[c].label}
            </Link>
          ))}
          {agent.protocols.map((p) => (
            <span key={p} className="badge">
              {p}
            </span>
          ))}
          <span className="badge badge-ref">{sourceLabel(agent.source)}</span>
        </div>

        <div className="panel" style={{ marginBottom: 16 }}>
          <h3>ERC-8004 identity</h3>
          <dl className="kv">
            <dt>agentId</dt>
            <dd>{agent.tokenId}</dd>
            <dt>agentRegistry</dt>
            <dd>{agent.agentRegistry}</dd>
            <dt>Owner</dt>
            <dd>
              {agent.owner ? (
                <a href={explorerAddress(agent.chainId, agent.owner)}>{agent.owner}</a>
              ) : (
                "—"
              )}
            </dd>
            <dt>Agent wallet</dt>
            <dd>{agent.agentWallet ?? "not set"}</dd>
            <dt>Identity registry</dt>
            <dd>
              <a href={explorerAddress(agent.chainId, IDENTITY_REGISTRY[agent.chainId] ?? agent.registry)}>
                {IDENTITY_REGISTRY[agent.chainId] ?? agent.registry}
              </a>
            </dd>
            <dt>Reputation registry</dt>
            <dd>
              <a href={explorerAddress(agent.chainId, REPUTATION_REGISTRY[agent.chainId] ?? "")}>
                {REPUTATION_REGISTRY[agent.chainId]}
              </a>
            </dd>
            <dt>Registration tx</dt>
            <dd>
              {agent.createdTxHash ? (
                <a href={explorerTx(agent.chainId, agent.createdTxHash)}>{agent.createdTxHash}</a>
              ) : (
                "—"
              )}
            </dd>
            <dt>Supported trust</dt>
            <dd>{agent.supportedTrust.join(", ") || "—"}</dd>
          </dl>
        </div>

        <div className="panel">
          <h3>Services</h3>
          {agent.services.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No A2A / MCP / HTTP endpoints published on the registration file.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {agent.services.map((s) => (
                  <tr key={s.endpoint}>
                    <td>{s.name}</td>
                    <td className="mono">{s.endpoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <aside>
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="kicker">Hire</div>
          <h2 style={{ fontSize: 28 }}>{money(agent.hirePriceTbnb)}</h2>
          <p style={{ color: "var(--muted)" }}>{agent.hireUnit}</p>
          <p>{cat.blurb}</p>
          <AgentHireButton agent={agent} />
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Mock payment. Wallet optional. See My hires after you confirm.
          </p>
        </div>
        <div className="panel">
          <div className="kicker">Track record</div>
          <h3>{agent.trackRecord.source}</h3>
          <dl className="kv">
            <dt>Feedbacks</dt>
            <dd>{agent.trackRecord.feedbackCount}</dd>
            <dt>Avg score</dt>
            <dd>{scoreLabel(agent.trackRecord.averageScore)}</dd>
            <dt>Validations</dt>
            <dd>
              {agent.trackRecord.successfulValidations}/{agent.trackRecord.validationCount}
            </dd>
            <dt>Jobs (est.)</dt>
            <dd>{agent.trackRecord.jobsCompleted}</dd>
          </dl>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{agent.trackRecord.notes}</p>
          {agent.source !== "reference" && (
            <p>
              <a href={agent.scanUrl}>Open on 8004scan</a>
              {" · "}
              <a href={agent.explorerUrl}>Token on BscScan</a>
            </p>
          )}
          <p>
            Owner {shortAddr(agent.owner)} · {agent.active ? "active" : "inactive"}
          </p>
        </div>
      </aside>
    </section>
  );
}
