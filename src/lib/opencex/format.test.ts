// Unit tests for src/lib/opencex/format.ts
import { describe, it, expect } from "vitest";
import {
  fmtPrice,
  fmtQty,
  fmtUSD,
  fmtCompact,
  fmtPct,
  fmtTime,
  fmtDateTime,
  shortAddr,
  shortHash,
} from "./format";

describe("fmtPrice", () => {
  it("formats a 2-decimal price correctly", () => {
    expect(fmtPrice(67250.5, 2)).toBe("67,250.50");
  });

  it("handles null and undefined gracefully", () => {
    expect(fmtPrice(null, 2)).toBe("—");
    expect(fmtPrice(undefined, 2)).toBe("—");
    expect(fmtPrice(NaN, 2)).toBe("—");
  });

  it("returns '0' for zero", () => {
    expect(fmtPrice(0, 2)).toBe("0");
  });

  it("uses exponential notation for very small numbers", () => {
    expect(fmtPrice(0.00001, 2)).toMatch(/e/);
  });

  it("extends decimals for sub-1 prices", () => {
    // For sub-1 prices, fmtPrice uses Math.min(6, decimals+2) decimal places
    // so fmtPrice(0.5234, 2) → toFixed(4) → "0.5234"
    expect(fmtPrice(0.5234, 2)).toBe("0.5234");
  });

  it("truncates large numbers with commas", () => {
    expect(fmtPrice(1234567.89, 2)).toBe("1,234,567.89");
  });
});

describe("fmtQty", () => {
  it("formats thousands with commas", () => {
    expect(fmtQty(12500, 4)).toBe("12,500");
  });

  it("formats a typical BTC quantity", () => {
    // For sub-1 qtys, fmtQty uses Math.min(6, decimals+2) decimal places
    // so fmtQty(0.4521, 8) → toFixed(6) → "0.452100"
    expect(fmtQty(0.4521, 8)).toBe("0.452100");
  });

  it("handles null and undefined", () => {
    expect(fmtQty(null, 4)).toBe("—");
    expect(fmtQty(undefined, 4)).toBe("—");
  });

  it("returns '0' for zero", () => {
    expect(fmtQty(0, 4)).toBe("0");
  });
});

describe("fmtUSD", () => {
  it("formats USD with $ and commas", () => {
    expect(fmtUSD(245680.42)).toBe("$245,680.42");
  });

  it("handles null and undefined", () => {
    expect(fmtUSD(null)).toBe("—");
    expect(fmtUSD(undefined)).toBe("—");
  });

  it("formats zero as $0.00", () => {
    expect(fmtUSD(0)).toBe("$0.00");
  });
});

describe("fmtCompact", () => {
  it("formats thousands with K suffix", () => {
    expect(fmtCompact(6160)).toBe("6.16K");
  });

  it("formats millions with M suffix", () => {
    expect(fmtCompact(385_100_000)).toBe("385.1M");
  });

  it("handles null and undefined", () => {
    expect(fmtCompact(null)).toBe("—");
    expect(fmtCompact(undefined)).toBe("—");
  });
});

describe("fmtPct", () => {
  it("formats positive percentage with + sign", () => {
    expect(fmtPct(3.09)).toBe("+3.09%");
  });

  it("formats negative percentage with - sign", () => {
    expect(fmtPct(-2.5)).toBe("-2.50%");
  });

  it("does not add + for zero", () => {
    expect(fmtPct(0)).toBe("0.00%");
  });

  it("can suppress the sign", () => {
    expect(fmtPct(3.09, false)).toBe("3.09%");
  });

  it("handles null and undefined", () => {
    expect(fmtPct(null)).toBe("—");
    expect(fmtPct(undefined)).toBe("—");
  });
});

describe("fmtTime / fmtDateTime", () => {
  it("fmtTime returns HH:MM:SS", () => {
    const ts = new Date("2026-10-24T14:30:45Z").getTime();
    expect(fmtTime(ts)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("fmtDateTime returns a date+time string", () => {
    const ts = new Date("2026-10-24T14:30:45Z").getTime();
    expect(fmtDateTime(ts)).toContain("2026");
  });
});

describe("shortAddr / shortHash", () => {
  it("shortens a long Ethereum address", () => {
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
    expect(shortAddr(addr)).toBe("0x742d35…f0bEb1");
  });

  it("leaves short addresses unchanged", () => {
    expect(shortAddr("0x1234")).toBe("0x1234");
  });

  it("shortens a transaction hash", () => {
    const hash = "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16";
    expect(shortHash(hash)).toBe("f4184fc596…1e9e16");
  });
});
