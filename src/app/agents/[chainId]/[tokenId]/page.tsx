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
  const { agent, warning, registration } = result;
  const deskHref =
    agent.primaryCategory === "other" ? "/marketplace" : `/desks/${agent.primaryCategory}`;
  const ready = agent.readiness;

  return (
    <section className="wrap detail">
      <div>
        <div className="kicker">Understand this identity</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>{agent.name}</h1>
        <p className="lede">{agent.description}</p>
        {warning && <div className="banner">{warning}</div>}
        <div className="pills" style={{ margin: "16px 0 24px" }}>
          {agent.categories
            .filter((c) => c !== "other")
            .map((c) => (
              <Link key={c} className="pill" href={`/desks/${c}`}>
                {CATEGORY_BY_ID[c].label}
                {agent.fit?.find((f) => f.category === c)
                  ? ` · fit ${agent.fit.find((f) => f.category === c)!.score}`
                  : ""}
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
          <h3>Can you hire this?</h3>
          <dl className="kv">
            <dt>On-chain id</dt>
            <dd>{ready?.hasIdentity ? `yes · #${agent.tokenId}` : "missing"}</dd>
            <dt>Owner</dt>
            <dd>{ready?.hasOwner ? shortAddr(agent.owner) : "unset"}</dd>
            <dt>Agent wallet</dt>
            <dd>{ready?.hasWallet ? shortAddr(agent.agentWallet) : "not set on registration"}</dd>
            <dt>Endpoint</dt>
            <dd>{ready?.hasEndpoint ? "published" : "none in registration file"}</dd>
            <dt>x402</dt>
            <dd>{ready?.hasX402 ? "declared" : "not declared"}</dd>
            <dt>Feedback</dt>
            <dd>{ready?.hasFeedback ? `${agent.trackRecord.feedbackCount} events` : "none yet — identity only"}</dd>
            <dt>On-chain URI</dt>
            <dd>{ready?.hasOnchainUri ? "read" : "not resolved"}</dd>
          </dl>
        </div>

        <div className="panel" style={{ marginBottom: 16 }}>
          <h3>ERC-8004 identity (BSC)</h3>
          <dl className="kv">
            <dt>agentId</dt>
            <dd>{agent.tokenId}</dd>
            <dt>agentRegistry</dt>
            <dd>{agent.agentRegistry}</dd>
            <dt>Index owner</dt>
            <dd>
              {agent.owner ? (
                <a href={explorerAddress(agent.chainId, agent.owner)}>{agent.owner}</a>
              ) : (
                "—"
              )}
            </dd>
            <dt>ownerOf (RPC)</dt>
            <dd>
              {agent.chainOwner ? (
                <a href={explorerAddress(agent.chainId, agent.chainOwner)}>{agent.chainOwner}</a>
              ) : (
                agent.chainReadError ?? "—"
              )}
            </dd>
            <dt>tokenURI</dt>
            <dd>{agent.tokenUri ?? "—"}</dd>
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
            <dt>RPC read at</dt>
            <dd>{agent.chainReadAt ?? "—"}</dd>
          </dl>
        </div>

        <div className="panel" style={{ marginBottom: 16 }}>
          <h3>Registration file</h3>
          {registration ? (
            <pre className="mono" style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "var(--muted)" }}>
              {JSON.stringify(registration, null, 2).slice(0, 4000)}
            </pre>
          ) : (
            <p style={{ color: "var(--muted)" }}>
              Could not decode tokenURI as JSON (ipfs/https timeout or non-JSON). Identity still
              exists on-chain.
            </p>
          )}
        </div>

        <div className="panel">
          <h3>Services</h3>
          {agent.services.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No A2A / MCP / HTTP endpoints in the registration file.</p>
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
          <div className="kicker">Activate</div>
          <h2 style={{ fontSize: 28 }}>{money(agent.hirePriceTbnb)}</h2>
          <p style={{ color: "var(--muted)" }}>{agent.hireUnit}</p>
          <p>
            <Link href={deskHref}>Back to the desk</Link> if you want a different identity for the
            same job.
          </p>
          <AgentHireButton agent={agent} />
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            Mock x402 / escrow. No captcha. Advance the job on My hires.
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
          </dl>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{agent.trackRecord.notes}</p>
          <p>
            <a href={agent.scanUrl}>8004scan</a>
            {" · "}
            <a href={agent.explorerUrl}>BscScan token</a>
          </p>
        </div>
      </aside>
    </section>
  );
}
