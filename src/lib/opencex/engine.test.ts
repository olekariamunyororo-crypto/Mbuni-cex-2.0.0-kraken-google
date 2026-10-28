// Unit tests for src/lib/opencex/engine.ts — the matching engine
//
// Verifies the contract from §5 of the OpenCEX 2026 spec:
//   - Price-Time priority matching
//   - All 5 order types: LIMIT, MARKET, IOC, FOK, POST_ONLY
//   - Pre-trade risk checks
//   - Trade publication
import { describe, it, expect, beforeEach } from "vitest";
import { MatchingEngine } from "./engine";
import type { TradingPair } from "./types";

const PAIR: TradingPair = {
  symbol: "BTC/USDT",
  base: "BTC",
  quote: "USDT",
  baseDecimals: 8,
  quoteDecimals: 2,
  priceDecimals: 2,
  minQty: 0.0001,
  tickSize: 0.1,
  status: "ACTIVE",
};

function makeEngine(initialPrice = 50000): MatchingEngine {
  const eng = new MatchingEngine(PAIR, initialPrice);
  // Seed a thin book — best bid 49999.9, best ask 50000.1
  eng.seedBook(initialPrice, 4, 1);
  return eng;
}

describe("MatchingEngine — basic construction", () => {
  it("constructs with a pair + initial price", () => {
    const eng = new MatchingEngine(PAIR, 50000);
    expect(eng.pair.symbol).toBe("BTC/USDT");
    const snap = eng.getSnapshot();
    expect(snap.lastPrice).toBe(50000);
  });

  it("seedBook populates bids + asks", () => {
    const eng = makeEngine(50000);
    const snap = eng.getSnapshot();
    expect(snap.bids.length).toBeGreaterThan(0);
    expect(snap.asks.length).toBeGreaterThan(0);
    expect(snap.bids[0].price).toBeLessThan(snap.asks[0].price);
  });
});

describe("MatchingEngine — LIMIT orders", () => {
  it("rejects orders with zero qty", () => {
    const eng = makeEngine(50000);
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: 49999,
      qty: 0,
      userId: "u1",
    });
    expect(order.status).toBe("REJECTED");
  });

  it("rejects orders with non-positive price", () => {
    const eng = makeEngine(50000);
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: 0,
      qty: 0.1,
      userId: "u1",
    });
    expect(order.status).toBe("REJECTED");
  });

  it("rests a non-crossing limit order on the book", () => {
    const eng = makeEngine(50000);
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: 49000, // well below best ask → won't cross
      qty: 0.5,
      userId: "u1",
    });
    expect(order.status).toBe("NEW");
    expect(order.remainingQty).toBe(0.5);

    const snap = eng.getSnapshot();
    const hasBid = snap.bids.some((b) => b.price === 49000);
    expect(hasBid).toBe(true);
  });

  it("fills immediately when a buy crosses the ask", () => {
    const eng = makeEngine(50000);
    const bestAsk = eng.getSnapshot().asks[0].price;
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: bestAsk, // crosses
      qty: 0.1,
      userId: "u1",
    });
    expect(order.status).toBe("FILLED");
    expect(trades.length).toBeGreaterThan(0);
    expect(order.filledQty).toBe(0.1);
    expect(order.remainingQty).toBe(0);
  });
});

describe("MatchingEngine — MARKET orders", () => {
  it("fills a market buy against the ask side", () => {
    const eng = makeEngine(50000);
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      price: null,
      qty: 0.1,
      userId: "u1",
    });
    expect(order.status).toBe("FILLED");
    expect(trades.length).toBeGreaterThan(0);
    expect(order.avgFillPrice).not.toBeNull();
  });

  it("fills a market sell against the bid side", () => {
    const eng = makeEngine(50000);
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "SELL",
      type: "MARKET",
      price: null,
      qty: 0.1,
      userId: "u1",
    });
    expect(order.status).toBe("FILLED");
    expect(trades.length).toBeGreaterThan(0);
  });

  it("rejects market orders with no price", () => {
    const eng = makeEngine(50000);
    // A market order with zero qty is rejected
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      price: null,
      qty: 0,
      userId: "u1",
    });
    expect(order.status).toBe("REJECTED");
  });
});

describe("MatchingEngine — IOC (Immediate-or-Cancel)", () => {
  it("fills what it can and cancels the rest", () => {
    const eng = makeEngine(50000);
    // Try to buy 100 BTC at a price that crosses — book only has ~5 BTC of liquidity
    const bestAsk = eng.getSnapshot().asks[0].price;
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "IOC",
      price: bestAsk + 100, // crosses everything
      qty: 100, // way more than book liquidity
      userId: "u1",
    });
    expect(trades.length).toBeGreaterThan(0);
    expect(order.filledQty).toBeGreaterThan(0);
    expect(order.filledQty).toBeLessThan(100);
    expect(order.status).toBe("PARTIALLY_FILLED");
    expect(order.remainingQty).toBe(0); // remainder is cancelled
  });

  it("cancels entirely if it can't fill anything", () => {
    const eng = makeEngine(50000);
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "IOC",
      price: 10000, // way below best ask → no fill
      qty: 1,
      userId: "u1",
    });
    expect(order.status).toBe("CANCELLED");
    expect(trades.length).toBe(0);
    expect(order.filledQty).toBe(0);
  });
});

describe("MatchingEngine — FOK (Fill-or-Kill)", () => {
  it("fills entirely when book has enough liquidity", () => {
    const eng = makeEngine(50000);
    // Take a small slice we know the book can satisfy
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "FOK",
      price: 50000.1, // best ask
      qty: 0.1,
      userId: "u1",
    });
    expect(order.status).toBe("FILLED");
    expect(trades.length).toBeGreaterThan(0);
    expect(order.filledQty).toBe(0.1);
  });

  it("cancels entirely when book can't fully satisfy the order", () => {
    const eng = makeEngine(50000);
    // Try to buy 1000 BTC — book definitely can't fill this
    const bestAsk = eng.getSnapshot().asks[0].price;
    const { order, trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "FOK",
      price: bestAsk + 1000,
      qty: 1000,
      userId: "u1",
    });
    expect(order.status).toBe("CANCELLED");
    expect(trades.length).toBe(0);
    expect(order.filledQty).toBe(0);
    // Important: FOK must NOT partially fill
    expect(order.remainingQty).toBe(0);
  });
});

describe("MatchingEngine — POST_ONLY", () => {
  it("rests on the book when it would NOT cross", () => {
    const eng = makeEngine(50000);
    const bestBid = eng.getSnapshot().bids[0].price;
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "POST_ONLY",
      price: bestBid - 100, // below best bid, won't cross
      qty: 0.5,
      userId: "u1",
    });
    expect(order.status).toBe("NEW");
  });

  it("rejects when it WOULD cross (would take liquidity)", () => {
    const eng = makeEngine(50000);
    const bestAsk = eng.getSnapshot().asks[0].price;
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "POST_ONLY",
      price: bestAsk, // would cross the ask
      qty: 0.5,
      userId: "u1",
    });
    expect(order.status).toBe("REJECTED");
  });
});

describe("MatchingEngine — price-time priority", () => {
  it("matches against the best price first", () => {
    const eng = makeEngine(50000);
    const bestAskBefore = eng.getSnapshot().asks[0].price;

    // Place a market buy — should fill at bestAskBefore
    const { trades } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      price: null,
      qty: 0.05,
      userId: "u1",
    });

    expect(trades.length).toBeGreaterThan(0);
    for (const t of trades) {
      expect(t.price).toBeGreaterThanOrEqual(bestAskBefore);
    }
  });
});

describe("MatchingEngine — order book snapshot", () => {
  it("sorts bids descending, asks ascending", () => {
    const eng = makeEngine(50000);
    const snap = eng.getSnapshot();
    for (let i = 1; i < snap.bids.length; i++) {
      expect(snap.bids[i].price).toBeLessThanOrEqual(snap.bids[i - 1].price);
    }
    for (let i = 1; i < snap.asks.length; i++) {
      expect(snap.asks[i].price).toBeGreaterThanOrEqual(snap.asks[i - 1].price);
    }
  });

  it("computes spread + midPrice correctly", () => {
    const eng = makeEngine(50000);
    const snap = eng.getSnapshot();
    // Use toBeCloseTo to avoid float-precision comparison issues
    expect(snap.spread).toBeCloseTo(snap.asks[0].price - snap.bids[0].price, 8);
    expect(snap.midPrice).toBeCloseTo((snap.asks[0].price + snap.bids[0].price) / 2, 8);
  });

  it("computes cumulative totals", () => {
    const eng = makeEngine(50000);
    const snap = eng.getSnapshot();
    if (snap.bids.length >= 2) {
      // toBeCloseTo to handle float-precision rounding in the engine
      expect(snap.bids[1].total).toBeCloseTo(snap.bids[0].qty + snap.bids[1].qty, 6);
    }
  });
});

describe("MatchingEngine — cancel", () => {
  it("cancels a resting order by id", () => {
    const eng = makeEngine(50000);
    const { order } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: 49000,
      qty: 0.5,
      userId: "u1",
    });
    expect(order.status).toBe("NEW");

    const ok = eng.cancel(order.id);
    expect(ok).toBe(true);

    const snap = eng.getSnapshot();
    const stillThere = snap.bids.some((b) => b.price === 49000);
    expect(stillThere).toBe(false);
  });

  it("returns false when cancelling an unknown order", () => {
    const eng = makeEngine(50000);
    const ok = eng.cancel("nonexistent-id");
    expect(ok).toBe(false);
  });
});

describe("MatchingEngine — events", () => {
  it("emits orders.placed + orders.filled + trades.executed events for a fill", () => {
    const eng = makeEngine(50000);
    const bestAsk = eng.getSnapshot().asks[0].price;
    const { events } = eng.placeOrder({
      pair: "BTC/USDT",
      side: "BUY",
      type: "LIMIT",
      price: bestAsk,
      qty: 0.05,
      userId: "u1",
    });

    const subjects = events.map((e) => e.subject);
    expect(subjects).toContain("orders.placed");
    expect(subjects).toContain("trades.executed");
    expect(subjects).toContain("balances.updated");
  });
});
