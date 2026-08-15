import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap">
        <h1>Not in the index</h1>
        <p className="lede">That agent id is not live, not in the snapshot, and not a reference listing.</p>
        <Link className="btn btn-gold" href="/marketplace">
          Back to browse
        </Link>
      </div>
    </section>
  );
}
