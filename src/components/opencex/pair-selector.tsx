"use client";

import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtPct, fmtCompact } from "@/lib/opencex/format";
import { useState } from "react";
import { ChevronDown, Search, Star } from "lucide-react";
import { ASSET_METADATA } from "@/lib/opencex/seed";

export function PairSelector() {
  const pairs = useOpenCEX((s) => s.pairs);
  const activePair = useOpenCEX((s) => s.activePair);
  const setActivePair = useOpenCEX((s) => s.setActivePair);
  const tickers = useOpenCEX((s) => s.tickers);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BTC/USDT", "ETH/USDT", "SOL/USDT"]));

  const active = pairs.find((p) => p.symbol === activePair);
  const ticker = tickers[activePair];
  const filtered = pairs.filter((p) => p.symbol.toLowerCase().includes(q.toLowerCase()));

  const toggleFav = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((s) => {
      const n = new Set(s);
      if (n.has(sym)) n.delete(sym);
      else n.add(sym);
      return n;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded hover:bg-elevated/70 min-w-[140px] md:min-w-[180px]"
      >
        {active && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
               style={{ background: ASSET_METADATA[active.base]?.color ?? "#666" }}>
            {active.base.slice(0, 2)}
          </div>
        )}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold">{activePair}</span>
          {ticker && (
            <span className={`text-[10px] tabular ${ticker.priceChangePct >= 0 ? "text-primary" : "text-danger"}`}>
              {fmtPrice(ticker.lastPrice, 2)} · {fmtPct(ticker.priceChangePct)}
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 ml-1 text-secondary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 w-[calc(100vw-1.5rem)] max-w-[420px] bg-popover border border-border rounded-md shadow-xl">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2 py-1 bg-input rounded">
                <Search className="w-3.5 h-3.5 text-secondary" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search markets…"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 px-3 py-1.5 text-[10px] uppercase text-secondary border-b border-border">
              <span className="col-span-2">Pair</span>
              <span className="text-right">Last Price</span>
              <span className="text-right">24h Change</span>
              <span className="text-right">24h Vol</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filtered.map((p) => {
                const t = tickers[p.symbol];
                return (
                  <button
                    key={p.symbol}
                    onClick={() => {
                      setActivePair(p.symbol);
                      setOpen(false);
                    }}
                    className={`w-full grid grid-cols-5 gap-2 px-3 py-1.5 text-xs hover:bg-elevated/60 items-center tabular ${
                      p.symbol === activePair ? "bg-elevated/60" : ""
                    }`}
                  >
                    <span className="col-span-2 flex items-center gap-2">
                      <Star
                        className={`w-3 h-3 ${favorites.has(p.symbol) ? "fill-gold text-gold" : "text-secondary"}`}
                        onClick={(e) => toggleFav(p.symbol, e)}
                      />
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ background: ASSET_METADATA[p.base]?.color ?? "#666" }}
                      >
                        {p.base.slice(0, 1)}
                      </span>
                      <span className="font-medium">{p.symbol}</span>
                    </span>
                    <span className="text-right">{t ? fmtPrice(t.lastPrice, p.priceDecimals) : "—"}</span>
                    <span className={`text-right ${t && t.priceChangePct >= 0 ? "text-primary" : "text-danger"}`}>
                      {t ? fmtPct(t.priceChangePct) : "—"}
                    </span>
                    <span className="text-right text-secondary">{t ? fmtCompact(t.quoteVolume) : "—"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
