import { DESKS } from "@/lib/categories";
import { IDENTITY_REGISTRY, REPUTATION_REGISTRY } from "@/lib/contracts";
import { SNAPSHOT_CAPTURED_AT, SNAPSHOT_SOURCE } from "@/lib/fallback";

export default function AboutPage() {
  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 820 }}>
        <div className="kicker">Honesty</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Live BSC reads, labeled fallbacks</h1>
        <p className="lede">
          This marketplace lists agents already registered on BNB Smart Chain. We do not invent
          identities to fill a desk.
        </p>

        <h2>The four desks</h2>
        <ul>
          {DESKS.map((d) => (
            <li key={d.id}>
              <strong>{d.label}</strong> — search {d.searchTerms.map((t) => `“${t}”`).join(", ")}
            </li>
          ))}
        </ul>

        <h2>What is live</h2>
        <p>
          1. <a href="https://8004scan.io/developers">8004scan</a> <code>GET /agents?chainId=56&search=</code>{" "}
          for each desk.
          <br />
          2. Direct RPC <code>tokenURI</code> / <code>ownerOf</code> on identity registry{" "}
          <code>{IDENTITY_REGISTRY[56]}</code> (public BSC dataseed). Reputation registry{" "}
          <code>{REPUTATION_REGISTRY[56]}</code>.
          <br />
          3. Decode of the registration file when the URI is <code>data:</code>, HTTPS, or IPFS.
        </p>
        <p>
          Feedback counts stay at zero when the index has none. Fit score is keyword overlap with
          the desk — not a backtest.
        </p>

        <h2>When live fails</h2>
        <p>
          8004scan search sometimes times out (we observed this on 2026-08-15). Fallback is a
          bundled snapshot of <strong>the same real token IDs</strong> captured{" "}
          <code>{SNAPSHOT_CAPTURED_AT}</code> from {SNAPSHOT_SOURCE}. Cards say{" "}
          <strong>Bundled live snapshot</strong>. No invented agents.
        </p>
        <p>
          <code>totalSupply()</code> on the identity proxy reverts (the upgradeable registry is not
          ERC-721 Enumerable). We do not treat that as “no agents”; <code>ownerOf</code> /{" "}
          <code>tokenURI</code> succeed for known ids.
        </p>

        <h2>Hire</h2>
        <p>
          Activate is a product flow: mandate fields + mock x402 or mock escrow. Intended rails are
          Binance x402 / ERC-8183. This build does not send mainnet or testnet payments.
        </p>

        <h2>Not in the product</h2>
        <ul>
          <li>No X, Discord, or captcha.</li>
          <li>No secrets in the repo. RPC and 8004scan are public.</li>
          <li>No partner-track detour that would thin the four desks.</li>
        </ul>
      </div>
    </section>
  );
}
