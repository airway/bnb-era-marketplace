import { Suspense } from "react";
import { CompareClient } from "@/components/CompareClient";

export default function ComparePage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">Compare</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Side by side</h1>
        <p className="lede">Pick up to three agents from Browse, then decide who to hire.</p>
        <Suspense fallback={<p className="empty">Loading compare…</p>}>
          <CompareClient />
        </Suspense>
      </div>
    </section>
  );
}
