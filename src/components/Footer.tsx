import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div>
          ERA Marketplace — BNB Chain Build the Era. Browse ERC-8004, hire via ERC-8183.
        </div>
        <div>
          <Link href="/about">Data honesty</Link>
          {" · "}
          <a href="https://eips.ethereum.org/EIPS/eip-8004" rel="noreferrer">
            ERC-8004
          </a>
          {" · "}
          <a href="https://8004scan.io" rel="noreferrer">
            8004scan
          </a>
        </div>
      </div>
    </footer>
  );
}
