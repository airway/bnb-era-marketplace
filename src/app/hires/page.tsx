import { HiresClient } from "@/components/HiresClient";

export default function HiresPage() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="kicker">My hires</div>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>Jobs you started</h1>
        <p className="lede">
          Quotes and transaction hashes persist in this browser. Status moves when you submit
          createJob / notify_funded — not a demo clock.
        </p>
        <HiresClient />
      </div>
    </section>
  );
}
