import type { Kline } from "@/lib/opencex/types";

/** Aggregate 1m candles into `minutes`-wide buckets aligned to wall-clock boundaries. Does not mutate input. */
export function aggregateKlines(klines: Kline[], minutes: number): Kline[] {
  if (!klines.length) return [];
  if (minutes <= 1) return klines;
  const ms = minutes * 60_000;
  const out: Kline[] = [];
  for (const k of klines) {
    const bucket = Math.floor(k.openTime / ms) * ms;
    const cur = out[out.length - 1];
    if (cur && cur.openTime === bucket) {
      cur.high = Math.max(cur.high, k.high);
      cur.low = Math.min(cur.low, k.low);
      cur.close = k.close;
      cur.volume += k.volume;
    } else {
      out.push({ openTime: bucket, open: k.open, high: k.high, low: k.low, close: k.close, volume: k.volume });
    }
  }
  return out;
}
