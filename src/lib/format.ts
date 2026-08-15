export function shortAddr(addr?: string | null): string {
  if (!addr) return "—";
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function money(n: number): string {
  return `${n.toFixed(3)} tBNB`;
}

export function scoreLabel(n: number): string {
  if (!n) return "—";
  return n > 5 ? n.toFixed(0) : n.toFixed(1);
}
