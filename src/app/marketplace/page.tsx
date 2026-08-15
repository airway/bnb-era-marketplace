import { Suspense } from "react";
import { MarketplaceClient } from "@/components/MarketplaceClient";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">Marketplace</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Browse ERC-8004 agents</h1>
        <p className="lede">
          Filter by monitoring, grid trading, health factor, yield, and more. Compare up to three.
          Start a hire on a mock x402 or escrow rail.
        </p>
        <Suspense fallback={<p className="empty">Loading marketplace…</p>}>
          <MarketplaceClient />
        </Suspense>
      </div>
    </section>
  );
}
