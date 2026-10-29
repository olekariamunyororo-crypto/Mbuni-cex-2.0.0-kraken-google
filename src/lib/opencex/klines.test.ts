import { describe, expect, it } from "vitest";
import { aggregateKlines } from "@/lib/opencex/klines";

const k = (m: number, o: number, h: number, l: number, c: number, v = 1) => ({ openTime: m * 60_000, open: o, high: h, low: l, close: c, volume: v });

describe("aggregateKlines", () => {
  it("buckets by wall-clock boundary, not array position", () => {
    // 5m buckets: minutes 3,4 | 5..9 | 10
    const out = aggregateKlines([k(3, 1, 2, 1, 2), k(4, 2, 3, 2, 3), k(5, 3, 5, 3, 4), k(9, 4, 6, 1, 5), k(10, 5, 5, 5, 5)], 5);
    expect(out.map((c) => c.openTime / 60_000)).toEqual([0, 5, 10]);
    expect(out[1]).toMatchObject({ open: 3, high: 6, low: 1, close: 5, volume: 2 });
  });
  it("is stable when a new candle is appended (older buckets don't shift)", () => {
    const base = [k(0, 1, 1, 1, 1), k(1, 1, 2, 1, 2), k(5, 2, 2, 2, 2)];
    const a = aggregateKlines(base, 5);
    const b = aggregateKlines([...base, k(6, 2, 3, 2, 3)], 5);
    expect(b[0]).toEqual(a[0]);
  });
  it("does not mutate the input", () => {
    const input = [k(0, 1, 2, 1, 2), k(1, 2, 3, 2, 3)];
    aggregateKlines(input, 5);
    expect(input[0].high).toBe(2);
  });
});
