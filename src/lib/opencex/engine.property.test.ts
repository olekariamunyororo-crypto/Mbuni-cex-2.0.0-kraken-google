// =============================================================================
// Mbuni CEX — Property-based tests for the matching engine
//
// Uses `fast-check` to generate thousands of random inputs and verify that
// mathematical invariants hold. This is the "property-based tests" mitigation
// called out in §16 of the OpenCEX 2026 spec (Risks & Mitigations).
//
// Invariants tested:
//   1. Conservation of quantity: filledQty + remainingQty ≤ qty (never over-fill)
//   2. FOK all-or-nothing: status is either FILLED (filledQty === qty)
//      or CANCELLED (filledQty === 0, no partial)
//   3. POST_ONLY maker-only: status is either NEW (rested) or REJECTED — never FILLED
//   4. No crossed book: after any operation, best bid < best ask (or one side empty)
//   5. IOC never rests: status is FILLED, PARTIALLY_FILLED, or CANCELLED — never NEW
//   6. Trades have positive qty + positive price
//   7. Order side matches aggressor: a BUY order's trades have aggressor side BUY
// =============================================================================

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { MatchingEngine } from "./engine";
import type { OrderType, Side, TradingPair } from "./types";

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

// Build a fresh engine with a randomly-seeded book.
function freshEngine(midPrice = 50000, levels = 6): MatchingEngine {
  const eng = new MatchingEngine(PAIR, midPrice);
  eng.seedBook(midPrice, levels, 1);
  return eng;
}

// Reasonable price + qty generators (avoid pathological values)
const priceArb = fc.integer({ min: 100, max: 100000 }).map((n) => n);
const qtyArb = fc.float({
  min: Math.fround(0.001),
  max: Math.fround(10),
  noNaN: true,
}).map((n) => Math.round(n * 1000) / 1000);
const sideArb: fc.Arbitrary<Side> = fc.constantFrom("BUY", "SELL");
const orderTypeArb: fc.Arbitrary<OrderType> = fc.constantFrom("LIMIT", "MARKET", "IOC", "FOK", "POST_ONLY");

// =============================================================================
// Property 1: Conservation of quantity
// filledQty + remainingQty ≤ qty (engine can never fill more than was requested)
// =============================================================================
describe("Property: quantity conservation", () => {
  it("filledQty + remainingQty never exceeds the requested qty", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          type: orderTypeArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, type, price, qty }) => {
          const eng = freshEngine();
          const { order } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type,
            // MARKET orders don't take a price
            price: type === "MARKET" ? null : price,
            qty,
            userId: "test",
          });
          // Total accounted-for qty must never exceed the original
          expect(order.filledQty + order.remainingQty).toBeLessThanOrEqual(qty + 1e-9);
          // Filled qty is non-negative
          expect(order.filledQty).toBeGreaterThanOrEqual(0);
          // Remaining is non-negative
          expect(order.remainingQty).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 2: FOK all-or-nothing
// A FOK order is either FULLY FILLED or entirely CANCELLED — no partial fills.
// =============================================================================
describe("Property: FOK is all-or-nothing", () => {
  it("FOK status is either FILLED (filledQty === qty) or CANCELLED (filledQty === 0)", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          price: priceArb,
          qty: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
        }),
        ({ side, price, qty }) => {
          const eng = freshEngine();
          const { order } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type: "FOK",
            price,
            qty,
            userId: "test",
          });
          // Two valid outcomes only. Use 1e-6 tolerance to account for the
          // engine's 8-decimal rounding on filledQty.
          const isFilled = order.status === "FILLED" && Math.abs(order.filledQty - qty) < 1e-6;
          const isCancelled = order.status === "CANCELLED" && order.filledQty === 0;
          expect(isFilled || isCancelled).toBe(true);
          // No partial fills ever
          if (order.status === "CANCELLED") {
            expect(order.filledQty).toBe(0);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 3: POST_ONLY is maker-only
// A POST_ONLY order never takes liquidity — it either rests (NEW) or is REJECTED.
// =============================================================================
describe("Property: POST_ONLY never fills immediately", () => {
  it("POST_ONLY status is NEW or REJECTED — never FILLED or PARTIALLY_FILLED", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, price, qty }) => {
          const eng = freshEngine();
          const { order, trades } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type: "POST_ONLY",
            price,
            qty,
            userId: "test",
          });
          // POST_ONLY must never produce trades (it never crosses)
          expect(trades.length).toBe(0);
          // Status is one of NEW (rested) or REJECTED (would have crossed)
          expect(["NEW", "REJECTED"]).toContain(order.status);
          // If NEW, the order rests on the book with full remaining qty
          if (order.status === "NEW") {
            expect(order.remainingQty).toBe(qty);
            expect(order.filledQty).toBe(0);
          }
          // If REJECTED, nothing was filled
          if (order.status === "REJECTED") {
            expect(order.filledQty).toBe(0);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 4: No crossed book
// After any order placement, the best bid is always strictly less than the best
// ask (or one side is empty). A crossed book would be a critical bug.
// =============================================================================
describe("Property: book is never crossed", () => {
  it("best bid < best ask after any order placement", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            side: sideArb,
            type: orderTypeArb,
            price: priceArb,
            qty: qtyArb,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (orders) => {
          const eng = freshEngine();
          for (const o of orders) {
            eng.placeOrder({
              pair: "BTC/USDT",
              side: o.side,
              type: o.type,
              price: o.type === "MARKET" ? null : o.price,
              qty: o.qty,
              userId: "test",
            });
            const snap = eng.getSnapshot();
            // If both sides have liquidity, the bid must be below the ask.
            if (snap.bids.length > 0 && snap.asks.length > 0) {
              expect(snap.bids[0].price).toBeLessThan(snap.asks[0].price);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 5: IOC never rests on the book
// An IOC order either fills (fully or partially) or is cancelled — it never
// has status NEW with remaining qty on the book.
// =============================================================================
describe("Property: IOC never rests", () => {
  it("IOC status is FILLED, PARTIALLY_FILLED, or CANCELLED — never NEW", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, price, qty }) => {
          const eng = freshEngine();
          const { order } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type: "IOC",
            price,
            qty,
            userId: "test",
          });
          expect(["FILLED", "PARTIALLY_FILLED", "CANCELLED"]).toContain(order.status);
          // IOC never rests → remaining must be 0 (whatever didn't fill was killed)
          expect(order.remainingQty).toBe(0);
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 6: Trades have positive qty + positive price
// No zero-qty or negative-qty trades should ever be produced.
// =============================================================================
describe("Property: trades are well-formed", () => {
  it("every trade has qty > 0 and price > 0", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          type: orderTypeArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, type, price, qty }) => {
          const eng = freshEngine();
          const { trades } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type,
            price: type === "MARKET" ? null : price,
            qty,
            userId: "test",
          });
          for (const t of trades) {
            expect(t.qty).toBeGreaterThan(0);
            expect(t.price).toBeGreaterThan(0);
            expect(Number.isFinite(t.qty)).toBe(true);
            expect(Number.isFinite(t.price)).toBe(true);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 7: Trade aggressor side matches order side
// A BUY order produces trades with side === "BUY"; a SELL with side === "SELL".
// =============================================================================
describe("Property: trade aggressor side matches order side", () => {
  it("a BUY order's trades all have side=BUY; a SELL order's all have side=SELL", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          type: orderTypeArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, type, price, qty }) => {
          const eng = freshEngine();
          const { trades } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type,
            price: type === "MARKET" ? null : price,
            qty,
            userId: "test",
          });
          for (const t of trades) {
            expect(t.side).toBe(side);
          }
        }
      ),
      { numRuns: 500 }
    );
  });
});

// =============================================================================
// Property 8: Idempotent snapshot — calling getSnapshot twice returns
// equivalent data (no mutation side-effect from reading)
// =============================================================================
describe("Property: snapshot is read-only", () => {
  it("calling getSnapshot twice doesn't mutate the book", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          price: priceArb,
          qty: qtyArb,
        }),
        ({ side, price, qty }) => {
          const eng = freshEngine();
          eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type: "LIMIT",
            price,
            qty,
            userId: "test",
          });
          const snap1 = eng.getSnapshot();
          const snap2 = eng.getSnapshot();
          expect(snap2.bids.length).toBe(snap1.bids.length);
          expect(snap2.asks.length).toBe(snap1.asks.length);
          expect(snap2.lastPrice).toBe(snap1.lastPrice);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 9: Cancel preserves book integrity
// After cancelling a resting order, the book's total qty decreases by exactly
// that order's remaining qty (no more, no less).
// =============================================================================
describe("Property: cancel preserves book integrity", () => {
  it("cancelling a resting order removes exactly its qty from the book", () => {
    fc.assert(
      fc.property(
        fc.record({
          side: sideArb,
          // Side-aware price: BUY must be below best bid (49999.9), SELL must
          // be above best ask (50000.1). Otherwise the order would cross and
          // fill instead of resting — the test assumes resting.
          price: fc.integer({ min: 1, max: 49900 }),
          qty: qtyArb,
        }),
        ({ side, price, qty }) => {
          const eng = freshEngine();
          // For SELL orders, mirror the price above the ask so it rests.
          const restingPrice = side === "BUY" ? price : 100000 - price + 50000;
          const before = eng.getSnapshot();
          const totalBefore = side === "BUY"
            ? before.bids.reduce((s, l) => s + l.qty, 0)
            : before.asks.reduce((s, l) => s + l.qty, 0);

          const { order } = eng.placeOrder({
            pair: "BTC/USDT",
            side,
            type: "LIMIT",
            price: restingPrice,
            qty,
            userId: "test",
          });
          // Confirm it rested
          expect(order.status).toBe("NEW");

          const ok = eng.cancel(order.id);
          expect(ok).toBe(true);

          const after = eng.getSnapshot();
          const totalAfter = side === "BUY"
            ? after.bids.reduce((s, l) => s + l.qty, 0)
            : after.asks.reduce((s, l) => s + l.qty, 0);

          // After cancel, total should equal the pre-order total (the order's
          // qty was added then removed). 1e-6 tolerance for engine rounding.
          expect(Math.abs(totalAfter - totalBefore)).toBeLessThan(1e-6);
        }
      ),
      { numRuns: 200 }
    );
  });
});
