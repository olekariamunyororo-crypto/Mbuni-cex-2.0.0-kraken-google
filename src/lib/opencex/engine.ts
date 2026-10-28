// Mbuni CEX — In-memory matching engine (TypeScript reference impl of the Rust engine)
//
// Implements the responsibilities described in §5 of the spec:
//  - High-performance in-memory order books (per pair)
//  - Price-Time priority matching
//  - Pre-trade risk checks
//  - Publishes trades and order book deltas
//
// Supported order types: LIMIT, MARKET, IOC, FOK, POST_ONLY

import type {
  Order,
  OrderBookLevel,
  OrderBookSnapshot,
  OrderType,
  Side,
  Trade,
  TradingPair,
} from "./types";

interface RestingOrder {
  id: string;
  pair: string;
  side: Side;
  type: OrderType;
  price: number;
  qty: number; // remaining
  userId: string;
  timestamp: number;
}

const uid = (() => {
  let n = 0;
  return (prefix = "id") => `${prefix}_${(n++).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
})();

function round(num: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(num * f) / f;
}

export interface MatchResult {
  order: Order;
  trades: Trade[];
  // events for the NATS bus
  events: Array<{ subject: "orders.placed" | "orders.cancelled" | "orders.filled" | "trades.executed" | "balances.updated"; payload: unknown }>;
}

export class MatchingEngine {
  // Per pair: bids (price → FIFO queue), asks (price → FIFO queue)
  private bids = new Map<number, RestingOrder[]>(); // best = highest
  private asks = new Map<number, RestingOrder[]>(); // best = lowest
  private lastPrice: number;
  private nextSeq = 1;
  public readonly pair: TradingPair;

  // Bookkeeping callbacks
  onTrade?: (t: Trade) => void;
  onOrderUpdate?: (o: Order) => void;
  onBookUpdate?: (snapshot: OrderBookSnapshot) => void;

  constructor(pair: TradingPair, initialPrice: number) {
    this.pair = pair;
    this.lastPrice = initialPrice;
  }

  private priceKey(price: number): number {
    return round(price, this.pair.priceDecimals);
  }

  private bookFor(side: Side): Map<number, RestingOrder[]> {
    return side === "BUY" ? this.bids : this.asks;
  }

  private bestPrice(side: Side): number | null {
    const book = this.bookFor(side);
    if (book.size === 0) return null;
    const prices = Array.from(book.keys());
    return side === "BUY" ? Math.max(...prices) : Math.min(...prices);
  }

  /**
   * Compute the total qty available on the opposite book that an aggressor
   * order of `aggressorSide` could match, optionally constrained by a max
   * price (for FOK LIMIT). Used for the FOK pre-flight check.
   *
   * A BUY aggressor walks the ASK book (ascending prices, stops at price).
   * A SELL aggressor walks the BID book (descending prices, stops at price).
   */
  private availableLiquidity(aggressorSide: Side, maxPrice: number | null): number {
    const restingSide: Side = aggressorSide === "BUY" ? "SELL" : "BUY";
    const book = this.bookFor(restingSide);
    let total = 0;
    for (const [price, queue] of book) {
      if (maxPrice !== null && !this.crossable(restingSide, price, maxPrice)) continue;
      for (const resting of queue) {
        total += resting.qty;
      }
    }
    return round(total, this.pair.baseDecimals);
  }

  private crossable(restingSide: Side, restingPrice: number, aggressorPrice: number | null): boolean {
    if (aggressorPrice === null) return true; // market
    if (restingSide === "SELL") return aggressorPrice >= restingPrice; // aggressor BUY
    return aggressorPrice <= restingPrice; // aggressor SELL, resting BUY
  }

  placeOrder(params: {
    pair: string;
    side: Side;
    type: OrderType;
    price: number | null;
    qty: number;
    userId: string;
  }): MatchResult {
    const { side, type, price, qty, userId, pair } = params;
    const trades: Trade[] = [];
    const events: MatchResult["events"] = [];

    // Pre-trade risk checks
    if (qty <= 0) {
      const o = this.makeOrder({ pair, side, type, price, qty, userId, status: "REJECTED", filledQty: 0 });
      return { order: o, trades, events };
    }
    if (type !== "MARKET" && (price === null || price <= 0)) {
      const o = this.makeOrder({ pair, side, type, price, qty, userId, status: "REJECTED", filledQty: 0 });
      return { order: o, trades, events };
    }
    if (type === "POST_ONLY" && price !== null) {
      // Post-Only would cross → reject
      const oppositeBest = this.bestPrice(side === "BUY" ? "SELL" : "BUY");
      if (oppositeBest !== null && this.crossable(side === "BUY" ? "SELL" : "BUY", oppositeBest, price)) {
        const o = this.makeOrder({ pair, side, type, price, qty, userId, status: "REJECTED", filledQty: 0 });
        return { order: o, trades, events };
      }
    }

    // FOK (Fill-or-Kill): pre-flight liquidity check.
    // The order must fill ENTIRELY or not at all — so verify the book has
    // enough qty at acceptable prices BEFORE touching anything. If it can't
    // fill, reject immediately and leave the book untouched.
    if (type === "FOK") {
      const available = this.availableLiquidity(side, price);
      if (available < qty) {
        const o = this.makeOrder({ pair, side, type, price, qty, userId, status: "CANCELLED", filledQty: 0 });
        o.remainingQty = 0; // nothing rests on the book — remainder is killed
        events.push({ subject: "orders.cancelled", payload: { id: o.id, reason: "FOK_NOT_FILLABLE" } });
        return { order: o, trades, events };
      }
    }

    const order = this.makeOrder({ pair, side, type, price, qty, userId, status: "NEW", filledQty: 0 });
    events.push({ subject: "orders.placed", payload: order });

    let remaining = qty;
    let filledQty = 0;
    let totalCost = 0;
    const aggressorSide = side;
    const oppositeSide: Side = side === "BUY" ? "SELL" : "BUY";

    // Match against the opposite book (price-time priority)
    if (type !== "POST_ONLY") {
      while (remaining > 0) {
        const best = this.bestPrice(oppositeSide);
        if (best === null) break;
        if (!this.crossable(oppositeSide, best, price)) break;

        const queue = this.bookFor(oppositeSide).get(best)!;
        while (queue.length > 0 && remaining > 0) {
          const resting = queue[0];
          const fillQty = Math.min(remaining, resting.qty);
          const fillPrice = resting.price;
          const trade: Trade = {
            id: uid("t"),
            pair,
            price: fillPrice,
            qty: round(fillQty, this.pair.baseDecimals),
            side: aggressorSide,
            buyerOrderId: aggressorSide === "BUY" ? order.id : resting.id,
            sellerOrderId: aggressorSide === "SELL" ? order.id : resting.id,
            timestamp: Date.now(),
          };
          trades.push(trade);
          this.lastPrice = fillPrice;

          remaining = round(remaining - fillQty, this.pair.baseDecimals);
          filledQty = round(filledQty + fillQty, this.pair.baseDecimals);
          totalCost += fillQty * fillPrice;

          resting.qty = round(resting.qty - fillQty, this.pair.baseDecimals);
          if (resting.qty <= 0) {
            queue.shift();
            events.push({
              subject: "orders.filled",
              payload: { id: resting.id, status: "FILLED", pair },
            });
          } else {
            events.push({
              subject: "orders.filled",
              payload: { id: resting.id, status: "PARTIALLY_FILLED", pair, remaining: resting.qty },
            });
          }
          events.push({ subject: "trades.executed", payload: trade });
          events.push({
            subject: "balances.updated",
            payload: { pair, tradeId: trade.id, price: fillPrice, qty: fillQty },
          });
        }
        if (queue.length === 0) {
          this.bookFor(oppositeSide).delete(best);
        }
      }
    }

    // IOC: cancel remainder (FOK is handled by the pre-flight check above —
    // if we reach here, FOK is guaranteed to fully fill)
    if (type === "IOC" && remaining > 0) {
      order.status = filledQty > 0 ? "PARTIALLY_FILLED" : "CANCELLED";
      order.remainingQty = 0;
    } else if (remaining > 0 && (type === "LIMIT" || type === "POST_ONLY")) {
      // Rest on book
      const resting: RestingOrder = {
        id: order.id,
        pair,
        side,
        type,
        price: price!,
        qty: remaining,
        userId,
        timestamp: Date.now(),
      };
      const key = this.priceKey(price!);
      const book = this.bookFor(side);
      if (!book.has(key)) book.set(key, []);
      book.get(key)!.push(resting);
      order.status = filledQty > 0 ? "PARTIALLY_FILLED" : "NEW";
      order.remainingQty = remaining;
    } else if (remaining === 0) {
      order.status = "FILLED";
      order.remainingQty = 0;
    } else {
      // MARKET with leftover (no liquidity) → cancel remainder
      order.status = filledQty > 0 ? "PARTIALLY_FILLED" : "CANCELLED";
      order.remainingQty = 0;
    }

    order.filledQty = filledQty;
    order.avgFillPrice = filledQty > 0 ? round(totalCost / filledQty, this.pair.priceDecimals) : null;

    events.push({ subject: "orders.filled", payload: order });

    // Notify
    this.onOrderUpdate?.(order);
    trades.forEach((t) => this.onTrade?.(t));
    this.emitBookSnapshot();

    return { order, trades, events };
  }

  cancel(orderId: string): boolean {
    for (const book of [this.bids, this.asks]) {
      for (const [price, queue] of book) {
        const idx = queue.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          queue.splice(idx, 1);
          if (queue.length === 0) book.delete(price);
          this.onOrderUpdate?.({
            id: orderId,
            pair: this.pair.symbol,
            side: "BUY", // placeholder, real impl tracks
            type: "LIMIT",
            price,
            qty: 0,
            filledQty: 0,
            remainingQty: 0,
            status: "CANCELLED",
            userId: "",
            timestamp: Date.now(),
            avgFillPrice: null,
          });
          this.emitBookSnapshot();
          return true;
        }
      }
    }
    return false;
  }

  getSnapshot(): OrderBookSnapshot {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    let bidTotal = 0;
    let askTotal = 0;

    const bidPrices = Array.from(this.bids.keys()).sort((a, b) => b - a).slice(0, 20);
    for (const p of bidPrices) {
      const queue = this.bids.get(p)!;
      const qty = queue.reduce((s, o) => s + o.qty, 0);
      bidTotal += qty;
      bids.push({ price: p, qty: round(qty, this.pair.baseDecimals), total: round(bidTotal, this.pair.baseDecimals), orderCount: queue.length });
    }
    const askPrices = Array.from(this.asks.keys()).sort((a, b) => a - b).slice(0, 20);
    for (const p of askPrices) {
      const queue = this.asks.get(p)!;
      const qty = queue.reduce((s, o) => s + o.qty, 0);
      askTotal += qty;
      asks.push({ price: p, qty: round(qty, this.pair.baseDecimals), total: round(askTotal, this.pair.baseDecimals), orderCount: queue.length });
    }

    const bestBid = bidPrices.length ? bidPrices[0] : 0;
    const bestAsk = askPrices.length ? askPrices[0] : 0;
    const spread = bestBid && bestAsk ? round(bestAsk - bestBid, this.pair.priceDecimals) : 0;
    const midPrice = bestBid && bestAsk ? round((bestBid + bestAsk) / 2, this.pair.priceDecimals) : this.lastPrice;

    return {
      pair: this.pair.symbol,
      bids,
      asks,
      spread,
      midPrice,
      lastPrice: this.lastPrice,
      timestamp: Date.now(),
    };
  }

  private emitBookSnapshot() {
    this.onBookUpdate?.(this.getSnapshot());
  }

  private makeOrder(p: {
    pair: string;
    side: Side;
    type: OrderType;
    price: number | null;
    qty: number;
    userId: string;
    status: Order["status"];
    filledQty: number;
  }): Order {
    return {
      id: uid("o"),
      pair: p.pair,
      side: p.side,
      type: p.type,
      price: p.price,
      qty: p.qty,
      filledQty: p.filledQty,
      remainingQty: p.qty - p.filledQty,
      status: p.status,
      userId: p.userId,
      timestamp: Date.now(),
      avgFillPrice: null,
    };
  }

  // Seed the book with random market-makers (used to bootstrap a lively order book)
  seedBook(midPrice: number, levels = 12, qtyEach = 0.5) {
    for (let i = 1; i <= levels; i++) {
      const bidPrice = round(midPrice - i * this.pair.tickSize, this.pair.priceDecimals);
      const askPrice = round(midPrice + i * this.pair.tickSize, this.pair.priceDecimals);
      const bidQty = round(qtyEach * (1 + Math.random()), this.pair.baseDecimals);
      const askQty = round(qtyEach * (1 + Math.random()), this.pair.baseDecimals);
      const bidKey = this.priceKey(bidPrice);
      const askKey = this.priceKey(askPrice);
      if (!this.bids.has(bidKey)) this.bids.set(bidKey, []);
      if (!this.asks.has(askKey)) this.asks.set(askKey, []);
      this.bids.get(bidKey)!.push({
        id: uid("mm"),
        pair: this.pair.symbol,
        side: "BUY",
        type: "LIMIT",
        price: bidPrice,
        qty: bidQty,
        userId: "market-maker",
        timestamp: Date.now() - (levels - i) * 1000,
      });
      this.asks.get(askKey)!.push({
        id: uid("mm"),
        pair: this.pair.symbol,
        side: "SELL",
        type: "LIMIT",
        price: askPrice,
        qty: askQty,
        userId: "market-maker",
        timestamp: Date.now() - (levels - i) * 1000,
      });
    }
    this.lastPrice = midPrice;
    this.emitBookSnapshot();
  }

  // Simulated bot activity (random MM rebalancing + taker orders) — drives the live feel
  tick() {
    const snap = this.getSnapshot();
    if (snap.bids.length === 0 || snap.asks.length === 0) return;

    // 70% chance: MM cancels + re-quotes a level
    // 30% chance: a taker crosses the spread → real trade
    const roll = Math.random();
    if (roll < 0.7) {
      const side: Side = Math.random() < 0.5 ? "BUY" : "SELL";
      const book = side === "BUY" ? this.bids : this.asks;
      const prices = Array.from(book.keys());
      if (prices.length > 4) {
        // cancel a random deep level
        const idx = 2 + Math.floor(Math.random() * (prices.length - 3));
        const p = prices[idx];
        const queue = book.get(p);
        if (queue && queue.length > 0) {
          queue.pop();
          if (queue.length === 0) book.delete(p);
        }
        // re-quote at a slightly different price near the mid
        const mid = snap.midPrice;
        const offset = (Math.floor(Math.random() * 6) + 2) * this.pair.tickSize;
        const newPrice = round(side === "BUY" ? mid - offset : mid + offset, this.pair.priceDecimals);
        const key = this.priceKey(newPrice);
        if (!book.has(key)) book.set(key, []);
        book.get(key)!.push({
          id: uid("mm"),
          pair: this.pair.symbol,
          side,
          type: "LIMIT",
          price: newPrice,
          qty: round(0.2 + Math.random() * 1.5, this.pair.baseDecimals),
          userId: "market-maker",
          timestamp: Date.now(),
        });
      }
    } else {
      // Taker crosses spread
      const side: Side = Math.random() < 0.5 ? "BUY" : "SELL";
      const qty = round(0.05 + Math.random() * 0.6, this.pair.baseDecimals);
      this.placeOrder({
        pair: this.pair.symbol,
        side,
        type: "MARKET",
        price: null,
        qty,
        userId: "bot-taker",
      });
    }
    this.emitBookSnapshot();
  }
}
