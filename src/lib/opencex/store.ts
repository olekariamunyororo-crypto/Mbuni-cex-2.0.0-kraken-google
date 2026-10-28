// Mbuni CEX — Central client store
//
// Ties together:
//  - Per-pair matching engines (Rust engine — TS reference impl)
//  - User balances (with reservation / release on order placement)
//  - Live trade tape
//  - Kline history + 24h ticker
//  - NATS-style event log (spec §8)
//
// All updates flow through here so every view stays consistent.

"use client";

import { create } from "zustand";
import { MatchingEngine } from "./engine";
import {
  CHAINS,
  DEPOSITS,
  FEE_SCHEDULES,
  INITIAL_BALANCES,
  INITIAL_PRICES,
  SAMPLE_USERS,
  TRADING_PAIRS,
  WHITELISTED_ADDRESSES,
  WITHDRAWALS,
  generateKlines,
} from "./seed";
import type {
  Balance,
  Deposit,
  FeeSchedule,
  Kline,
  Order,
  OrderBookSnapshot,
  Side,
  SystemEvent,
  Trade,
  Ticker24h,
  User,
  WhitelistedAddress,
  Withdrawal,
} from "./types";

const CURRENT_USER_ID = "u_self";

interface MbuniCEXState {
  // Static / reference data
  pairs: typeof TRADING_PAIRS;
  feeSchedules: FeeSchedule[];
  chains: typeof CHAINS;
  users: User[];

  // Live data
  activePair: string;
  balances: Balance[];
  orders: Order[]; // current user's orders
  trades: Trade[]; // global trade tape (most recent)
  tickers: Record<string, Ticker24h>;
  books: Record<string, OrderBookSnapshot>;
  klines: Record<string, Kline[]>;
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  whitelist: WhitelistedAddress[];
  events: SystemEvent[];

  // Internal engines (not serializable, kept outside react tree)
  engines: Record<string, MatchingEngine>;
  engineInterval: ReturnType<typeof setInterval> | null;
  started: boolean;

  // Live data (Binance WebSocket feed)
  liveMode: boolean;       // true = real Binance data, false = simulated bots
  feedConnected: boolean;  // WebSocket connection status
  feed: unknown;           // BinanceFeed instance (not serializable)

  // Actions
  init: () => void;
  setActivePair: (symbol: string) => void;
  setLiveMode: (enabled: boolean) => void;
  setFeedConnected: (connected: boolean) => void;
  setFeed: (feed: unknown) => void;
  updateBookFromBinance: (pair: string, bids: Array<[number, number]>, asks: Array<[number, number]>) => void;
  updateTradeFromBinance: (pair: string, price: number, qty: number, side: "BUY" | "SELL", timestamp: number) => void;
  updateTickerFromBinance: (pair: string, lastPrice: number, priceChangePct: number, high: number, low: number, volume: number, quoteVolume: number) => void;
  updateKlineFromBinance: (pair: string, openTime: number, open: number, high: number, low: number, close: number, volume: number, isClosed: boolean) => void;
  placeOrder: (params: { pair: string; side: Side; type: Order["type"]; price: number | null; qty: number }) => { ok: boolean; reason?: string; order?: Order };
  cancelOrder: (orderId: string) => void;
  requestWithdrawal: (params: { asset: string; chain: string; amount: number; address: string }) => { ok: boolean; reason?: string };
  addWhitelist: (params: { asset: string; chain: string; address: string; label: string }) => void;
  pushEvent: (subject: SystemEvent["subject"], payload: unknown) => void;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function findPair(pairs: typeof TRADING_PAIRS, symbol: string) {
  return pairs.find((p) => p.symbol === symbol)!;
}

function buildTicker(pair: string, lastPrice: number, klines: Kline[]): Ticker24h {
  const last24 = klines.slice(-1440); // 24h of 1m klines
  const high = last24.length ? Math.max(...last24.map((k) => k.high)) : lastPrice;
  const low = last24.length ? Math.min(...last24.map((k) => k.low)) : lastPrice;
  const open = last24.length ? last24[0].open : lastPrice;
  const volume = last24.reduce((s, k) => s + k.volume, 0);
  const quoteVolume = last24.reduce((s, k) => s + k.volume * k.close, 0);
  const priceChange = lastPrice - open;
  return {
    pair,
    lastPrice,
    priceChange,
    priceChangePct: open ? (priceChange / open) * 100 : 0,
    high,
    low,
    volume,
    quoteVolume,
  };
}

export const useOpenCEX = create<MbuniCEXState>((set, get) => ({
  pairs: TRADING_PAIRS,
  feeSchedules: FEE_SCHEDULES,
  chains: CHAINS,
  users: SAMPLE_USERS,

  activePair: "BTC/USDT",
  balances: INITIAL_BALANCES,
  orders: [],
  trades: [],
  tickers: {},
  books: {},
  klines: {},
  deposits: DEPOSITS,
  withdrawals: WITHDRAWALS,
  whitelist: WHITELISTED_ADDRESSES,
  events: [],

  engines: {},
  engineInterval: null,
  started: false,

  // Live data defaults
  liveMode: false,
  feedConnected: false,
  feed: null,

  init: () => {
    if (get().started) return;
    const engines: Record<string, MatchingEngine> = {};
    const books: Record<string, OrderBookSnapshot> = {};
    const tickers: Record<string, Ticker24h> = {};
    const klines: Record<string, Kline[]> = {};

    for (const pair of TRADING_PAIRS) {
      const initial = INITIAL_PRICES[pair.symbol] ?? 100;
      const eng = new MatchingEngine(pair, initial);
      eng.seedBook(initial, 14, pair.base === "BTC" ? 0.4 : pair.base === "ETH" ? 1.2 : 50);
      engines[pair.symbol] = eng;
      books[pair.symbol] = eng.getSnapshot();
      const ks = generateKlines(pair.symbol, initial, 360);
      klines[pair.symbol] = ks;
      tickers[pair.symbol] = buildTicker(pair.symbol, initial, ks);

      eng.onTrade = (t) => {
        // Append to global trade tape
        set((s) => ({ trades: [t, ...s.trades].slice(0, 100) }));
        // Update ticker lastPrice
        set((s) => {
          const tk = s.tickers[pair.symbol];
          if (!tk) return {};
          return {
            tickers: {
              ...s.tickers,
              [pair.symbol]: { ...tk, lastPrice: t.price, priceChange: t.price - tk.lastPrice + tk.priceChange },
            },
          };
        });
        // Push kline update (last candle)
        set((s) => {
          const ks = s.klines[pair.symbol] ? [...s.klines[pair.symbol]] : [];
          if (ks.length === 0) return {};
          const last = { ...ks[ks.length - 1] };
          last.close = t.price;
          last.high = Math.max(last.high, t.price);
          last.low = Math.min(last.low, t.price);
          last.volume = round(last.volume + t.qty, 6);
          ks[ks.length - 1] = last;
          return { klines: { ...s.klines, [pair.symbol]: ks } };
        });
      };
      eng.onBookUpdate = (snap) => {
        set((s) => ({ books: { ...s.books, [pair.symbol]: snap } }));
      };
      eng.onOrderUpdate = (o) => {
        if (o.userId === CURRENT_USER_ID) {
          set((s) => {
            const idx = s.orders.findIndex((x) => x.id === o.id);
            const next = [...s.orders];
            if (idx >= 0) {
              next[idx] = { ...next[idx], ...o };
            } else {
              next.unshift(o);
            }
            return { orders: next };
          });
        }
      };
    }

    // Seed some initial bot trades
    const initialTrades: Trade[] = [];
    for (let i = 0; i < 30; i++) {
      const pair = TRADING_PAIRS[Math.floor(Math.random() * TRADING_PAIRS.length)];
      const base = INITIAL_PRICES[pair.symbol];
      const price = base * (1 + (Math.random() - 0.5) * 0.001);
      initialTrades.push({
        id: uid("t"),
        pair: pair.symbol,
        price: round(price, pair.priceDecimals),
        qty: round(Math.random() * (pair.base === "BTC" ? 0.3 : pair.base === "ETH" ? 2 : 100), pair.baseDecimals),
        side: Math.random() < 0.5 ? "BUY" : "SELL",
        buyerOrderId: uid("o"),
        sellerOrderId: uid("o"),
        timestamp: Date.now() - (30 - i) * 1500,
      });
    }
    initialTrades.sort((a, b) => b.timestamp - a.timestamp);

    set({
      engines,
      books,
      tickers,
      klines,
      started: true,
      trades: initialTrades,
    });

    // Drive live activity on all engines (bots)
    const interval = setInterval(() => {
      const state = get();
      // Each tick: nudge a few engines
      const targets = Object.values(state.engines).slice(0, 6);
      for (const eng of targets) {
        eng.tick();
      }
      // Occasionally refresh tickers (simulate 24h calc)
      // (handled in onTrade)
    }, 1200);
    set({ engineInterval: interval });
  },

  setActivePair: (symbol) => set({ activePair: symbol }),

  // ----- Live data (Binance WebSocket) -----

  setLiveMode: (enabled) => {
    const state = get();
    if (enabled === state.liveMode) return;
    set({ liveMode: enabled });
    // When entering live mode, stop the simulated bot interval
    // (real data will drive the display instead)
    if (enabled && state.engineInterval) {
      clearInterval(state.engineInterval);
      set({ engineInterval: null });
    }
    // When leaving live mode, restart the bot interval
    if (!enabled && !state.engineInterval && state.started) {
      const interval = setInterval(() => {
        const s = get();
        const targets = Object.values(s.engines).slice(0, 6);
        for (const eng of targets) {
          eng.tick();
        }
      }, 1200);
      set({ engineInterval: interval });
    }
  },

  setFeedConnected: (connected) => set({ feedConnected: connected }),
  setFeed: (feed) => set({ feed }),

  updateBookFromBinance: (pair, bids, asks) => {
    const state = get();
    const p = findPair(state.pairs, pair);
    // Convert Binance depth to OrderBookSnapshot format
    const bookBids = bids.slice(0, 20).map(([price, qty]) => ({ price, qty, total: 0, orderCount: 1 }));
    const bookAsks = asks.slice(0, 20).map(([price, qty]) => ({ price, qty, total: 0, orderCount: 1 }));
    // Compute cumulative totals
    let bidTotal = 0;
    for (const b of bookBids) { bidTotal += b.qty; b.total = round(bidTotal, p.baseDecimals); }
    let askTotal = 0;
    for (const a of bookAsks) { askTotal += a.qty; a.total = round(askTotal, p.baseDecimals); }

    const bestBid = bookBids.length ? bookBids[0].price : 0;
    const bestAsk = bookAsks.length ? bookAsks[0].price : 0;
    const spread = bestBid && bestAsk ? round(bestAsk - bestBid, p.priceDecimals) : 0;
    const midPrice = bestBid && bestAsk ? round((bestBid + bestAsk) / 2, p.priceDecimals) : 0;
    const lastPrice = state.books[pair]?.lastPrice ?? midPrice;

    set((s) => ({
      books: {
        ...s.books,
        [pair]: { pair, bids: bookBids, asks: bookAsks, spread, midPrice, lastPrice, timestamp: Date.now() },
      },
    }));
  },

  updateTradeFromBinance: (pair, price, qty, side, timestamp) => {
    const state = get();
    const p = findPair(state.pairs, pair);
    const trade: Trade = {
      id: `binance_${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
      pair,
      price: round(price, p.priceDecimals),
      qty: round(qty, p.baseDecimals),
      side,
      buyerOrderId: "binance",
      sellerOrderId: "binance",
      timestamp,
    };
    // Add to trade tape + update lastPrice on the book
    set((s) => {
      const trades = [trade, ...s.trades].slice(0, 100);
      const book = s.books[pair];
      const books = book
        ? { ...s.books, [pair]: { ...book, lastPrice: price } }
        : s.books;
      return { trades, books };
    });
    // Also update the engine's lastPrice so user orders fill at realistic prices
    const eng = state.engines[pair];
    if (eng) {
      (eng as any).lastPrice = price;
    }
  },

  updateTickerFromBinance: (pair, lastPrice, priceChangePct, high, low, volume, quoteVolume) => {
    const state = get();
    const existing = state.tickers[pair];
    const priceChange = existing ? lastPrice - (lastPrice - (lastPrice * priceChangePct / 100)) : 0;
    set((s) => ({
      tickers: {
        ...s.tickers,
        [pair]: {
          pair,
          lastPrice,
          priceChange: priceChange || (lastPrice * priceChangePct / 100),
          priceChangePct,
          high,
          low,
          volume,
          quoteVolume,
        },
      },
    }));
  },

  updateKlineFromBinance: (pair, openTime, open, high, low, close, volume, isClosed) => {
    set((s) => {
      const ks = s.klines[pair] ? [...s.klines[pair]] : [];
      if (ks.length === 0) {
        // No history — just add this candle
        ks.push({ openTime, open, high, low, close, volume });
        return { klines: { ...s.klines, [pair]: ks } };
      }
      const last = ks[ks.length - 1];
      // If the candle is for the same time period, update it
      if (last.openTime === openTime) {
        ks[ks.length - 1] = { openTime, open, high, low, close, volume };
      } else if (openTime > last.openTime) {
        // New candle — add it
        ks.push({ openTime, open, high, low, close, volume });
        // Keep max 500 candles
        if (ks.length > 500) ks.shift();
      }
      return { klines: { ...s.klines, [pair]: ks } };
    });
  },

  placeOrder: ({ pair, side, type, price, qty }) => {
    const state = get();
    const eng = state.engines[pair];
    if (!eng) return { ok: false, reason: "Unknown pair" };
    const p = findPair(state.pairs, pair);

    // Balance reservation check
    const baseAsset = p.base;
    const quoteAsset = p.quote;
    const isBuy = side === "BUY";

    if (type === "LIMIT" || type === "POST_ONLY") {
      const cost = (price ?? 0) * qty;
      const bal = state.balances.find((b) => b.asset === (isBuy ? quoteAsset : baseAsset));
      if (!bal || bal.free < (isBuy ? cost : qty)) {
        return { ok: false, reason: `Insufficient ${isBuy ? quoteAsset : baseAsset} balance` };
      }
    } else {
      // MARKET / IOC / FOK — estimate worst-case cost using best ask (BUY) or just check qty (SELL)
      if (isBuy) {
        const snap = state.books[pair];
        const bestAsk = snap.asks[0]?.price ?? 0;
        const est = bestAsk * qty;
        const bal = state.balances.find((b) => b.asset === quoteAsset);
        if (!bal || bal.free < est) return { ok: false, reason: `Insufficient ${quoteAsset} for market buy` };
      } else {
        const bal = state.balances.find((b) => b.asset === baseAsset);
        if (!bal || bal.free < qty) return { ok: false, reason: `Insufficient ${baseAsset} balance` };
      }
    }

    const result = eng.placeOrder({ pair, side, type, price, qty, userId: CURRENT_USER_ID });

    // Reserve / settle balances (simplified)
    if (result.order.status !== "REJECTED") {
      set((s) => {
        const balances = s.balances.map((b) => {
          if (b.asset === (isBuy ? quoteAsset : baseAsset)) {
            const reserved = isBuy ? (price ?? 0) * qty : qty;
            if (result.order.status === "FILLED") {
              // settled: subtract, and credit the other side
              return { ...b, free: round(b.free - reserved, 8) };
            }
            if (result.order.status === "PARTIALLY_FILLED") {
              const filled = result.order.filledQty;
              const settled = isBuy ? filled * (price ?? result.order.avgFillPrice ?? 0) : filled;
              return { ...b, free: round(b.free - settled, 8), locked: round(b.locked + (reserved - settled), 8) };
            }
            // resting on book
            return { ...b, free: round(b.free - reserved, 8), locked: round(b.locked + reserved, 8) };
          }
          return b;
        });
        // Credit counter-asset for filled trades
        const trades = result.trades;
        if (trades.length > 0) {
          const filledQty = trades.reduce((s, t) => s + t.qty, 0);
          const filledCost = trades.reduce((s, t) => s + t.qty * t.price, 0);
          balances.forEach((b, i) => {
            if (b.asset === (isBuy ? baseAsset : quoteAsset)) {
              const credit = isBuy ? filledQty : filledCost;
              balances[i] = { ...b, free: round(b.free + credit, 8) };
            }
          });
        }
        return { balances };
      });
    }

    // Push events
    for (const ev of result.events) {
      get().pushEvent(ev.subject, ev.payload);
    }

    return { ok: true, order: result.order };
  },

  cancelOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    const eng = state.engines[order.pair];
    if (!eng) return;
    const ok = eng.cancel(orderId);
    if (ok) {
      // Release locked balance
      set((s) => {
        const p = findPair(s.pairs, order.pair);
        const isBuy = order.side === "BUY";
        const reserved = isBuy ? (order.price ?? 0) * order.remainingQty : order.remainingQty;
        const balances = s.balances.map((b) => {
          if (b.asset === (isBuy ? p.quote : p.base)) {
            return { ...b, free: round(b.free + reserved, 8), locked: round(Math.max(0, b.locked - reserved), 8) };
          }
          return b;
        });
        const orders = s.orders.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" as const, remainingQty: 0 } : o));
        return { balances, orders };
      });
      get().pushEvent("orders.cancelled", { id: orderId });
    }
  },

  requestWithdrawal: ({ asset, chain, amount }) => {
    const state = get();
    const bal = state.balances.find((b) => b.asset === asset);
    if (!bal || bal.free < amount) return { ok: false, reason: "Insufficient balance" };
    const chainInfo = state.chains.find((c) => c.name === chain);
    const fee = chainInfo ? chainInfo.withdrawalFeeUSD / (INITIAL_PRICES[`${asset}/USDT`] ?? 1) : 0;
    const w: Withdrawal = {
      id: uid("w"),
      asset,
      chain,
      amount,
      fee: round(fee, 6),
      address: state.whitelist[0]?.address ?? "",
      txHash: null,
      status: "PENDING",
      timestamp: Date.now(),
    };
    set((s) => ({
      withdrawals: [w, ...s.withdrawals],
      balances: s.balances.map((b) => (b.asset === asset ? { ...b, free: round(b.free - amount, 8), locked: round(b.locked + amount, 8) } : b)),
    }));
    get().pushEvent("withdrawals.completed", w);
    return { ok: true };
  },

  addWhitelist: ({ asset, chain, address, label }) => {
    const item: WhitelistedAddress = {
      id: uid("wa"),
      asset,
      chain,
      address,
      label,
      addedAt: Date.now(),
      timeLockHours: 24,
    };
    set((s) => ({ whitelist: [item, ...s.whitelist] }));
  },

  pushEvent: (subject, payload) => {
    const ev: SystemEvent = {
      id: uid("ev"),
      subject,
      payload,
      timestamp: Date.now(),
    };
    set((s) => ({ events: [ev, ...s.events].slice(0, 200) }));
  },
}));

function round(n: number, d: number) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
