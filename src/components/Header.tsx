"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/desks/rebalancing", label: "Desks" },
  { href: "/marketplace", label: "Browse" },
  { href: "/compare", label: "Compare" },
  { href: "/hires", label: "My hires" },
  { href: "/about", label: "Data" },
];

export function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          ERA Marketplace
        </Link>
        <nav className="nav">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} data-active={path.startsWith(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href="/marketplace" className="btn btn-gold">
          Find an agent
        </Link>
      </div>
    </header>
  );
}
