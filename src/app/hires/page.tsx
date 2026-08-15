import { HiresClient } from "@/components/HiresClient";

export default function HiresPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">My hires</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Jobs you started</h1>
        <p className="lede">
          Hires persist in this browser. Advance the demo clock from quoted → funded → working →
          submitted → settled. No on-chain settle happens.
        </p>
        <HiresClient />
      </div>
    </section>
  );
}
