// =============================================================================
// Mbuni CEX — Binance real-time market data feed
//
// Connects to Binance's public WebSocket API (no API key needed, no CORS
// issues for WebSocket). Streams real trades, order book depth, klines, and
// 24h tickers for the active trading pair.
//
// The matching engine stays in the browser for user orders — but the DISPLAYED
// order book, trade tape, chart, and ticker are now real Binance data.
//
// Binance WebSocket docs:
//   https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
// =============================================================================

export interface BinanceTrade {
  pair: string;
  price: number;
  qty: number;
  side: "BUY" | "SELL"; // aggressor side: m=true means seller is maker → buyer is aggressor → BUY
  timestamp: number;
}

export interface BinanceDepth {
  pair: string;
  bids: Array<[number, number]>; // [price, qty]
  asks: Array<[number, number]>;
  lastUpdateId: number;
}

export interface BinanceKline {
  pair: string;
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface BinanceTicker {
  pair: string;
  lastPrice: number;
  priceChangePct: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export interface BinanceFeedCallbacks {
  onTrade?: (t: BinanceTrade) => void;
  onDepth?: (d: BinanceDepth) => void;
  onKline?: (k: BinanceKline) => void;
  onTicker?: (t: BinanceTicker) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (err: Event) => void;
}

const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";

/**
 * Map a Mbuni pair symbol (BTC/USDT) to a Binance stream symbol (btcusdt).
 */
export function toBinanceSymbol(pair: string): string {
  return pair.replace("/", "").toLowerCase();
}

/**
 * Map a Binance trade stream symbol back to a Mbuni pair (BTCUSDT → BTC/USDT).
 */
export function fromBinanceSymbol(symbol: string): string {
  // Most pairs are /USDT
  if (symbol.endsWith("USDT")) {
    return symbol.slice(0, -4) + "/USDT";
  }
  return symbol;
}

export class BinanceFeed {
  private ws: WebSocket | null = null;
  private pair: string;
  private callbacks: BinanceFeedCallbacks;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(pair: string, callbacks: BinanceFeedCallbacks) {
    this.pair = pair;
    this.callbacks = callbacks;
  }

  /**
   * Connect to Binance's combined WebSocket stream for the active pair.
   * Streams: trade, depth20@100ms, kline_1m, ticker
   */
  connect() {
    if (this.closed) return;
    const symbol = toBinanceSymbol(this.pair);
    const streams = [
      `${symbol}@trade`,
      `${symbol}@depth20@100ms`,
      `${symbol}@kline_1m`,
      `${symbol}@ticker`,
    ].join("/");

    const url = `${BINANCE_WS_BASE}?streams=${streams}`;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      this.callbacks.onError?.(err as Event);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (!msg.stream || !msg.data) return;
        this.handleMessage(msg.stream, msg.data);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = (err) => {
      this.callbacks.onError?.(err);
    };

    this.ws.onclose = (event) => {
      this.callbacks.onDisconnect?.(event.reason || "connection closed");
      if (!this.closed) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(stream: string, data: any) {
    // Trade stream: { e: "trade", p: "0.001", q: "100", T: 123456, m: true }
    if (stream.includes("@trade")) {
      const trade: BinanceTrade = {
        pair: this.pair,
        price: parseFloat(data.p),
        qty: parseFloat(data.q),
        // m = isBuyerMaker. If true, the buyer is the maker → seller is aggressor → SELL
        side: data.m ? "SELL" : "BUY",
        timestamp: data.T,
      };
      this.callbacks.onTrade?.(trade);
      return;
    }

    // Partial book depth stream: { bids: [[p,q]], asks: [[p,q]] }
    if (stream.includes("@depth")) {
      const depth: BinanceDepth = {
        pair: this.pair,
        bids: (data.bids || []).map((b: string[]) => [parseFloat(b[0]), parseFloat(b[1])]),
        asks: (data.asks || []).map((a: string[]) => [parseFloat(a[0]), parseFloat(a[1])]),
        lastUpdateId: data.lastUpdateId || 0,
      };
      this.callbacks.onDepth?.(depth);
      return;
    }

    // Kline stream: { k: { t, o, h, l, c, v, x } }
    if (stream.includes("@kline")) {
      const k = data.k;
      if (!k) return;
      const kline: BinanceKline = {
        pair: this.pair,
        openTime: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
        isClosed: k.x,
      };
      this.callbacks.onKline?.(kline);
      return;
    }

    // 24h ticker: { c: lastPrice, P: priceChangePct, h: high, l: low, v: volume, q: quoteVolume }
    if (stream.includes("@ticker")) {
      const ticker: BinanceTicker = {
        pair: this.pair,
        lastPrice: parseFloat(data.c),
        priceChangePct: parseFloat(data.P),
        high: parseFloat(data.h),
        low: parseFloat(data.l),
        volume: parseFloat(data.v),
        quoteVolume: parseFloat(data.q),
      };
      this.callbacks.onTicker?.(ticker);
      return;
    }
  }

  private scheduleReconnect() {
    if (this.closed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (!this.closed) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Switch to a different trading pair. Closes the current connection
   * and opens a new one for the new pair.
   */
  switchPair(newPair: string) {
    this.pair = newPair;
    this.closeWebSocket();
    this.reconnectAttempts = 0;
    this.connect();
  }

  private closeWebSocket() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Permanently close the feed. No reconnection will be attempted.
   */
  close() {
    this.closed = true;
    this.closeWebSocket();
  }
}
