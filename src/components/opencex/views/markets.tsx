"use client";

import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtPct, fmtCompact, fmtUSD } from "@/lib/opencex/format";
import { ASSET_METADATA } from "@/lib/opencex/seed";
import { Star, TrendingUp, TrendingDown, Search, Activity, Zap } from "lucide-react";
import { useState, useMemo } from "react";
import { AssetRow } from "@/components/ui/AssetRow";
import { Chip } from "@/components/ui/controls";
import { TextField } from "@/components/ui/TextField";
import { AIInsightCard } from "@/components/ui/AIInsightCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CategoryCards } from "@/components/ui/CategoryCards";

export function MarketsView({ onOpenTrading }: { onOpenTrading: (pair: string) => void }) {
  const pairs = useOpenCEX((s) => s.pairs);
  const tickers = useOpenCEX((s) => s.tickers);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["BTC/USDT", "ETH/USDT", "SOL/USDT"]));
  const [tab, setTab] = useState<"all" | "fav" | "gainers" | "losers">("all");
  const [search, setSearch] = useState("");

  const rows = pairs
    .map((p) => ({ pair: p, ticker: tickers[p.symbol] }))
    .filter((r) => r.ticker);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!r.pair.symbol.toLowerCase().includes(q) && !r.pair.base.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (tab === "fav") return favorites.has(r.pair.symbol);
      if (tab === "gainers") return r.ticker!.priceChangePct > 0;
      if (tab === "losers") return r.ticker!.priceChangePct < 0;
      return true;
    });
  }, [rows, tab, favorites, search]);

  const totalVol = rows.reduce((s, r) => s + (r.ticker?.quoteVolume ?? 0), 0);
  const gainers = rows.filter((r) => r.ticker!.priceChangePct > 0).length;
  const losers = rows.filter((r) => r.ticker!.priceChangePct < 0).length;

  const toggleFav = (sym: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites((s) => {
      const n = new Set(s);
      if (n.has(sym)) n.delete(sym);
      else n.add(sym);
      return n;
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header & 24h Market Overview */}
      <div className="space-y-1">
        <h2 className="text-[28px] font-bold tracking-tight text-white">Cryptocurrency Markets</h2>
        <p className="text-[13px] text-secondary">
          Live streaming prices and order book depth across {pairs.length} spot trading pairs
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-raised rounded-3xl p-4 border border-[var(--color-glass-border)]">
          <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">Total Volume (24h)</div>
          <div className="text-[22px] font-bold text-white tnum mt-1">${fmtCompact(totalVol)}</div>
          <div className="text-[11px] text-primary mt-0.5 font-medium">100% Rust-matched</div>
        </div>
        <div className="glass-raised rounded-3xl p-4 border border-[var(--color-glass-border)]">
          <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">Active Markets</div>
          <div className="text-[22px] font-bold text-white tnum mt-1">{pairs.length} Pairs</div>
          <div className="text-[11px] text-secondary mt-0.5">High liquidity CLOB</div>
        </div>
        <div className="glass-raised rounded-3xl p-4 border border-[var(--color-glass-border)]">
          <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">Top Gainers</div>
          <div className="text-[22px] font-bold text-primary tnum mt-1">+{gainers}</div>
          <div className="text-[11px] text-primary mt-0.5 font-medium">Positive momentum</div>
        </div>
        <div className="glass-raised rounded-3xl p-4 border border-[var(--color-glass-border)]">
          <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">Top Decliners</div>
          <div className="text-[22px] font-bold text-danger tnum mt-1">-{losers}</div>
          <div className="text-[11px] text-secondary mt-0.5">24h delta tracking</div>
        </div>
      </div>

      {/* Section 6.5 & Section 7 Category discovery */}
      <div>
        <SectionHeader
          title="Market Sectors"
          subtitle="Explore trending ecosystems & token categories"
        />
        <CategoryCards
          onSelectCategory={(id) => {
            if (id === "layer2") setSearch("ARB");
            else if (id === "ai") setSearch("SOL");
            else if (id === "defi") setSearch("ETH");
            else if (id === "memes") setSearch("DOGE");
            else setSearch("BTC");
          }}
        />
      </div>

      {/* AI Market Co-pilot */}
      <AIInsightCard
        title="Market Mover Insight"
        insight="Solana (SOL/USDT) leads exchange volume with $1.4M traded in 24h, showing institutional bid clusters at $178.50. Average spread remains < 0.02%."
        accent="lime"
      />

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Chip active={tab === "all"} onClick={() => setTab("all")}>
            All Markets
          </Chip>
          <Chip active={tab === "fav"} variant="lime" onClick={() => setTab("fav")}>
            ★ Favorites
          </Chip>
          <Chip active={tab === "gainers"} variant="lime" onClick={() => setTab("gainers")}>
            Top Gainers
          </Chip>
          <Chip active={tab === "losers"} onClick={() => setTab("losers")}>
            Top Losers
          </Chip>
        </div>

        {/* Search Field */}
        <div className="w-full sm:w-64">
          <TextField
            placeholder="Search coin or pair…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search className="w-4 h-4 text-tertiary" />}
            className="h-10 text-xs"
          />
        </div>
      </div>

      {/* Asset List (Tempered Glass Card) */}
      <div className="glass-raised rounded-3xl p-2 md:p-4 border border-[var(--color-glass-border)]">
        <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-secondary font-semibold border-b border-divider/60">
          <span>Market / Asset</span>
          <div className="text-right flex items-center gap-6">
            <span>Price (USDT)</span>
            <span className="hidden sm:inline">24h Change</span>
          </div>
        </div>

        <div className="divide-y divide-divider/40">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-secondary">
              No trading pairs match your filter
            </div>
          ) : (
            filtered.map((r) => {
              const sym = r.pair.symbol;
              const meta = ASSET_METADATA[r.pair.base];
              const isFav = favorites.has(sym);
              return (
                <div key={sym} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={(e) => toggleFav(sym, e)}
                    className="p-2 ml-1 text-tertiary hover:text-gold transition-colors shrink-0"
                    title={isFav ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      className={`w-4 h-4 ${isFav ? "fill-gold text-gold" : "text-tertiary group-hover:text-secondary"}`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <AssetRow
                      symbol={sym}
                      name={meta?.name}
                      price={r.ticker?.lastPrice}
                      change24h={r.ticker?.priceChangePct}
                      volume24h={r.ticker?.quoteVolume}
                      onClick={() => onOpenTrading(sym)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
