"use client";

import { useEffect, useRef } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { BinanceFeed } from "@/lib/opencex/binance-feed";

/**
 * Hook that connects the Binance WebSocket feed to the Zustand store.
 *
 * Call this once in the trading view (or any component that's always mounted
 * while the app is showing trading data). It will:
 *   1. Enable live mode (real Binance data instead of simulated bots)
 *   2. Connect to Binance's WebSocket for the active pair
 *   3. Switch streams when the active pair changes
 *   4. Clean up on unmount
 *
 * The matching engine stays active for user orders — but the displayed
 * order book, trade tape, chart, and ticker are now real Binance data.
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

  const feedRef = useRef<BinanceFeed | null>(null);

  useEffect(() => {
    // Enable live mode
    setLiveMode(true);

    // Create + connect the feed
    const feed = new BinanceFeed(activePair, {
      onConnect: () => setFeedConnected(true),
      onDisconnect: () => setFeedConnected(false),
      onDepth: (d) => updateBook(d.pair, d.bids, d.asks),
      onTrade: (t) => updateTrade(t.pair, t.price, t.qty, t.side, t.timestamp),
      onTicker: (t) =>
        updateTicker(t.pair, t.lastPrice, t.priceChangePct, t.high, t.low, t.volume, t.quoteVolume),
      onKline: (k) =>
        updateKline(k.pair, k.openTime, k.open, k.high, k.low, k.close, k.volume, k.isClosed),
    });

    feed.connect();
    feedRef.current = feed;
    setFeed(feed);

    // Cleanup on unmount
    return () => {
      feed.close();
      feedRef.current = null;
      setFeed(null);
      setFeedConnected(false);
      setLiveMode(false);
    };
  }, []); // Connect once on mount

  // Switch streams when the active pair changes
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.switchPair(activePair);
    }
  }, [activePair]);
}
