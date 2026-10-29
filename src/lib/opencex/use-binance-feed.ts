"use client";

import { useEffect, useRef } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { BinanceFeed, fetchKlineHistory, type BinanceDepth, type BinanceKline, type BinanceTicker, type BinanceTrade } from "@/lib/opencex/binance-feed";

// Binance can emit dozens of trade/depth/ticker/kline messages per second.
// Applying each one straight to the store means one Zustand update (and one
// round of selector runs) per message. We coalesce them: only the latest
// depth/ticker/kline per flush window is applied, trades are applied in order.
const FLUSH_MS = 100;
const MAX_PENDING_TRADES = 200; // bound memory if the tab is throttled in the background

/**
 * Hook that connects the Binance WebSocket feed to the Zustand store.
 *
 * Call this once in the trading view (or any component that's always mounted
 * while the app is showing trading data). It will:
 *   1. Enable live mode (real Binance data instead of simulated bots)
 *   2. Connect to Binance's WebSocket for the active pair
 *   3. Switch streams when the active pair changes
 *   4. Clean up on unmount
 */
export function useBinanceFeed() {
  const activePair = useOpenCEX((s) => s.activePair);
  const setLiveMode = useOpenCEX((s) => s.setLiveMode);
  const setFeedConnected = useOpenCEX((s) => s.setFeedConnected);
  const setFeed = useOpenCEX((s) => s.setFeed);
  const updateBook = useOpenCEX((s) => s.updateBookFromBinance);
  const updateTrade = useOpenCEX((s) => s.updateTradeFromBinance);
  const updateTicker = useOpenCEX((s) => s.updateTickerFromBinance);
  const updateKline = useOpenCEX((s) => s.updateKlineFromBinance);
  const setKlineHistory = useOpenCEX((s) => s.setKlineHistory);

  const loadHistory = (pair: string, signal: AbortSignal) => {
    fetchKlineHistory(pair, 2, signal)
      .then((h) => { if (!signal.aborted && h.length) setKlineHistory(pair, h); })
      .catch((e) => { if (!signal.aborted) console.warn("[feed] kline history unavailable, chart will build from live candles:", e); });
  };
  const historyAbortRef = useRef<AbortController | null>(null);

  const feedRef = useRef<BinanceFeed | null>(null);
  // The pair the live socket is currently subscribed to (set on mount).
  const connectedPairRef = useRef<string | null>(null);

  useEffect(() => {
    setLiveMode(true);

    let depth: BinanceDepth | null = null;
    let ticker: BinanceTicker | null = null;
    let kline: BinanceKline | null = null;
    let trades: BinanceTrade[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      timer = null;
      const d = depth, tk = ticker, k = kline, tr = trades;
      depth = ticker = kline = null;
      trades = [];
      if (d) updateBook(d.pair, d.bids, d.asks);
      for (const t of tr) updateTrade(t.pair, t.price, t.qty, t.side, t.timestamp);
      if (tk) updateTicker(tk.pair, tk.lastPrice, tk.priceChangePct, tk.high, tk.low, tk.volume, tk.quoteVolume);
      if (k) updateKline(k.pair, k.openTime, k.open, k.high, k.low, k.close, k.volume, k.isClosed);
    };
    const schedule = () => {
      if (timer === null) timer = setTimeout(flush, FLUSH_MS);
    };

    const initialPair = useOpenCEX.getState().activePair;
    const feed = new BinanceFeed(initialPair, {
      onConnect: () => setFeedConnected(true),
      onDisconnect: () => setFeedConnected(false),
      onDepth: (d) => { depth = d; schedule(); },
      onTrade: (t) => {
        trades.push(t);
        if (trades.length > MAX_PENDING_TRADES) trades.splice(0, trades.length - MAX_PENDING_TRADES);
        schedule();
      },
      onTicker: (t) => { ticker = t; schedule(); },
      onKline: (k) => {
        // A closed candle must never be dropped in favour of a later open one.
        if (kline && kline.isClosed && kline.openTime !== k.openTime) updateKline(kline.pair, kline.openTime, kline.open, kline.high, kline.low, kline.close, kline.volume, kline.isClosed);
        kline = k;
        schedule();
      },
    });

    feed.connect();
    historyAbortRef.current = new AbortController();
    loadHistory(initialPair, historyAbortRef.current.signal);
    feedRef.current = feed;
    connectedPairRef.current = initialPair;
    setFeed(feed);

    return () => {
      if (timer !== null) clearTimeout(timer);
      historyAbortRef.current?.abort();
      feed.close();
      feedRef.current = null;
      connectedPairRef.current = null;
      setFeed(null);
      setFeedConnected(false);
      setLiveMode(false);
    };
  }, []); // Connect once on mount

  // Switch streams when the active pair changes (skipped on mount: the feed
  // was just created for this pair, and switching would tear down the socket
  // that is still handshaking).
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || connectedPairRef.current === activePair) return;
    connectedPairRef.current = activePair;
    feed.switchPair(activePair);
    historyAbortRef.current?.abort();
    historyAbortRef.current = new AbortController();
    loadHistory(activePair, historyAbortRef.current.signal);
  }, [activePair]);
}
