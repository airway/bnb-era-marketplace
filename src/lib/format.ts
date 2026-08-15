export function shortAddr(addr?: string | null): string {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function money(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "No published price";
  return `${n.toFixed(3)} quoted`;
}

export function scoreLabel(n: number): string {
  if (!n) return "—";
  return n > 5 ? n.toFixed(0) : n.toFixed(1);
}
