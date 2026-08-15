import { IDENTITY_REGISTRY, REPUTATION_REGISTRY } from "@/lib/contracts";
import { SNAPSHOT_CAPTURED_AT, SNAPSHOT_SOURCE } from "@/lib/fallback";

export default function AboutPage() {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="kicker">Honesty</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>What is live, what is labeled</h1>
        <p className="lede">
          Judges should be able to tell on-chain identity from a fallback card. This page is the
          contract for that.
        </p>

        <h2>What this product is</h2>
        <p>
          A marketplace for ERC-8004 agents on BNB Smart Chain: browse, filter, compare identity
          and track record, start a hire. It is not a portfolio of agents we operate.
        </p>

        <h2>Live data</h2>
        <p>
          Primary index:{" "}
          <a href="https://8004scan.io/developers">8004scan public API</a> filtered to{" "}
          <code>chainId=56</code>. Identity registry{" "}
          <code>{IDENTITY_REGISTRY[56]}</code>, reputation registry{" "}
          <code>{REPUTATION_REGISTRY[56]}</code>. When the index answers, cards are{" "}
          <strong>Live 8004scan</strong>.
        </p>
        <p>
          The public index is noisy (many near-duplicate trading agents, mash names). Hide mash
          names is on by default. Search on 8004scan is often slow or errors; we filter the live
          page plus a bundled snapshot in-process.
        </p>

        <h2>Fallback</h2>
        <p>
          If 8004scan times out (8s) or errors, we serve a bundled snapshot captured{" "}
          <code>{SNAPSHOT_CAPTURED_AT}</code> from <code>{SNAPSHOT_SOURCE}</code>. Those cards are
          labeled <strong>Bundled 8004scan snapshot</strong> and keep real token IDs.
        </p>
        <p>
          Category coverage for the brief (monitoring, grid, health-factor, yield, plus research,
          security, payments) uses a small <strong>Reference listing</strong> catalog. Those are
          not claimed as live token IDs. Track records on them are{" "}
          <code>reference-estimated</code>.
        </p>

        <h2>Hire</h2>
        <p>
          Hire is a product flow, not a mainnet payment. Mock x402 marks the job funded. Mock
          escrow starts at quoted. Advance the status on My hires. Optional wallet connect only
          reads an address — no transaction is sent.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>No Twitter, Discord, or captcha in the product.</li>
          <li>No secrets in the repo. 8004scan works anonymously.</li>
          <li>We do not invent on-chain feedback for live identities that have none.</li>
        </ul>
      </div>
    </section>
  );
}
