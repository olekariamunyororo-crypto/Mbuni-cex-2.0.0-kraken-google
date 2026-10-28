// Mbuni CEX — formatting helpers

export function fmtPrice(n: number | undefined | null, decimals = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) < 0.0001) return n.toExponential(2);
  if (Math.abs(n) < 1) return n.toFixed(Math.min(6, decimals + 2));
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtQty(n: number | undefined | null, decimals = 4): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n === 0) return "0";
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (Math.abs(n) >= 1) return n.toFixed(decimals);
  return n.toFixed(Math.min(6, decimals + 2));
}

export function fmtUSD(n: number | undefined | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export function fmtCompact(n: number | undefined | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

export function fmtPct(n: number | undefined | null, withSign = true): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

export function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", { hour12: false });
}

export function shortAddr(addr: string, head = 8, tail = 6): string {
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function shortHash(h: string, head = 10, tail = 6): string {
  return shortAddr(h, head, tail);
}
