import { Suspense } from "react";
import { MarketplaceClient } from "@/components/MarketplaceClient";
import { listMarketplaceAgents } from "@/lib/query";

export default async function MarketplacePage() {
  const initial = await listMarketplaceAgents({ limit: 40, preferLive: true });
  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">Browse</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Every live identity we can list</h1>
        <p className="lede">
          Filter by the four desks, or search the BSC index. Prefer a desk if you have never used
          Agent Studio — each desk has the same hire path.
        </p>
        <Suspense fallback={<p className="empty">Loading marketplace…</p>}>
          <MarketplaceClient initial={initial} />
        </Suspense>
      </div>
    </section>
  );
}
