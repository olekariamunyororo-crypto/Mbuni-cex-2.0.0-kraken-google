"use client";

import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtQty, fmtCompact } from "@/lib/opencex/format";
import { useMemo, useState } from "react";
import { CoinIcon } from "@/components/opencex/coin-icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BookViewMode = "both" | "bids" | "asks";

export interface OrderBookProps {
  pair: string;
  fullLength?: boolean;
  onSelectPrice?: (price: number) => void;
  className?: string;
}

export function OrderBook({
  pair,
  fullLength = true,
  onSelectPrice,
  className,
}: OrderBookProps) {
  const book = useOpenCEX((s) => s.books[pair]);
  const p = useOpenCEX((s) => s.pairs.find((x) => x.symbol === pair));
  const [viewMode, setViewMode] = useState<BookViewMode>("both");
  const [depthLimit, setDepthLimit] = useState<number>(fullLength ? 25 : 15);

  const { asks, bids, maxTotal, spreadPct, totalBidQty, totalAskQty } = useMemo(() => {
    if (!book) {
      return { asks: [], bids: [], maxTotal: 0, spreadPct: 0, totalBidQty: 0, totalAskQty: 0 };
    }

    const limit = viewMode === "both" ? depthLimit : Math.min(depthLimit * 2, 50);
    const asks = book.asks.slice(0, limit);
    const bids = book.bids.slice(0, limit);

    const maxTotal = Math.max(
      asks.reduce((m, l) => Math.max(m, l.total), 0),
      bids.reduce((m, l) => Math.max(m, l.total), 0),
      1e-9
    );

    const spreadPct = book.midPrice ? (book.spread / book.midPrice) * 100 : 0;
    const totalBidQty = bids.reduce((s, l) => s + l.qty, 0);
    const totalAskQty = asks.reduce((s, l) => s + l.qty, 0);

    return { asks, bids, maxTotal, spreadPct, totalBidQty, totalAskQty };
  }, [book, viewMode, depthLimit]);

  if (!book || !p) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-secondary text-sm">
        Loading order book…
      </div>
    );
  }

  const handleRowClick = (price: number) => {
    if (onSelectPrice) {
      onSelectPrice(price);
    } else {
      toast.info(`Price selected: $${fmtPrice(price, p.priceDecimals)}`, {
        description: "Order ticket price updated",
      });
    }
  };

  return (
    <div className={cn("flex flex-col h-full select-none", className)}>
      {/* Header with Pair & View Mode Toggles */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <CoinIcon asset={p.base} size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider text-white truncate">
            Order Book
          </span>
          <span className="text-[10px] text-tertiary">·</span>
          <span className="text-[10px] text-secondary font-mono truncate">{p.symbol}</span>
        </div>

        {/* View Mode & Depth Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Depth limit selector */}
          <div className="flex items-center bg-surface/80 rounded-lg p-0.5 border border-white/5 text-[10px]">
            <button
              type="button"
              onClick={() => setDepthLimit(15)}
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                depthLimit === 15 ? "bg-elevated text-white font-bold" : "text-tertiary hover:text-white"
              )}
              title="15 levels"
            >
              15
            </button>
            <button
              type="button"
              onClick={() => setDepthLimit(25)}
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                depthLimit === 25 ? "bg-elevated text-white font-bold" : "text-tertiary hover:text-white"
              )}
              title="25 levels (Full length)"
            >
              25
            </button>
            <button
              type="button"
              onClick={() => setDepthLimit(30)}
              className={cn(
                "px-1.5 py-0.5 rounded font-medium transition-colors",
                depthLimit === 30 ? "bg-elevated text-white font-bold" : "text-tertiary hover:text-white"
              )}
              title="30 levels (Max depth)"
            >
              Max
            </button>
          </div>

          {/* Both / Bids only / Asks only toggle buttons */}
          <div className="flex items-center bg-surface/80 rounded-lg p-0.5 border border-white/5">
            {/* Both (default) */}
            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={cn(
                "w-6 h-5 flex flex-col justify-center items-center gap-0.5 rounded transition-colors",
                viewMode === "both" ? "bg-elevated" : "hover:bg-white/5"
              )}
              title="Show Both Bids & Asks"
            >
              <div className="w-3 h-1 rounded-sm bg-danger" />
              <div className="w-3 h-1 rounded-sm bg-primary" />
            </button>

            {/* Bids only */}
            <button
              type="button"
              onClick={() => setViewMode("bids")}
              className={cn(
                "w-6 h-5 flex flex-col justify-center items-center gap-0.5 rounded transition-colors",
                viewMode === "bids" ? "bg-elevated" : "hover:bg-white/5"
              )}
              title="Show Bids Only"
            >
              <div className="w-3 h-1 rounded-sm bg-primary" />
              <div className="w-3 h-1 rounded-sm bg-primary" />
            </button>

            {/* Asks only */}
            <button
              type="button"
              onClick={() => setViewMode("asks")}
              className={cn(
                "w-6 h-5 flex flex-col justify-center items-center gap-0.5 rounded transition-colors",
                viewMode === "asks" ? "bg-elevated" : "hover:bg-white/5"
              )}
              title="Show Asks Only"
            >
              <div className="w-3 h-1 rounded-sm bg-danger" />
              <div className="w-3 h-1 rounded-sm bg-danger" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Column Labels */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-[10px] uppercase text-secondary border-b border-border font-semibold shrink-0">
        <span className="inline-flex items-center gap-1">
          <CoinIcon asset={p.quote} size={12} />
          Price ({p.quote})
        </span>
        <span className="text-right inline-flex items-center justify-end gap-1">
          Size ({p.base})
          <CoinIcon asset={p.base} size={12} />
        </span>
        <span className="text-right inline-flex items-center justify-end gap-1">
          Total ({p.base})
          <CoinIcon asset={p.base} size={12} />
        </span>
      </div>

      {/* Main Order Book Ladder Body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Asks (Sell Orders) */}
        {(viewMode === "both" || viewMode === "asks") && (
          <div
            className={cn(
              "flex-1 overflow-y-auto no-scrollbar min-h-0",
              viewMode === "both" ? "flex flex-col-reverse" : "flex flex-col"
            )}
          >
            {asks.map((lvl, i) => (
              <BookRow
                key={`a-${lvl.price}-${i}`}
                price={lvl.price}
                qty={lvl.qty}
                total={lvl.total}
                maxTotal={maxTotal}
                side="ask"
                decimals={p.priceDecimals}
                qtyDecimals={p.baseDecimals}
                onClick={() => handleRowClick(lvl.price)}
              />
            ))}
          </div>
        )}

        {/* Real-time Mid-Price & Spread Bar */}
        <div className="border-y border-border bg-surface/90 px-3 py-2 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-base md:text-lg font-bold tabular tracking-tight",
                book.spread >= 0 ? "text-primary" : "text-danger"
              )}
            >
              ${fmtPrice(book.lastPrice, p.priceDecimals)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-secondary font-medium">
              Mid: ${fmtPrice(book.midPrice, p.priceDecimals)}
            </span>
          </div>
          <span className="text-[10px] text-secondary font-medium">
            Spread <span className="tabular text-foreground font-semibold">{fmtPrice(book.spread, p.priceDecimals)}</span>{" "}
            ({spreadPct.toFixed(3)}%)
          </span>
        </div>

        {/* Bids (Buy Orders) */}
        {(viewMode === "both" || viewMode === "bids") && (
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 flex flex-col">
            {bids.map((lvl, i) => (
              <BookRow
                key={`b-${lvl.price}-${i}`}
                price={lvl.price}
                qty={lvl.qty}
                total={lvl.total}
                maxTotal={maxTotal}
                side="bid"
                decimals={p.priceDecimals}
                qtyDecimals={p.baseDecimals}
                onClick={() => handleRowClick(lvl.price)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Totals */}
      <div className="px-3 py-1.5 border-t border-border flex items-center justify-between text-[10px] text-secondary bg-surface/40 shrink-0 font-medium">
        <span>
          Total Bids:{" "}
          <span className="tabular text-primary font-semibold">
            {fmtCompact(totalBidQty)} {p.base}
          </span>
        </span>
        <span>
          Total Asks:{" "}
          <span className="tabular text-danger font-semibold">
            {fmtCompact(totalAskQty)} {p.base}
          </span>
        </span>
      </div>
    </div>
  );
}

function BookRow({
  price,
  qty,
  total,
  maxTotal,
  side,
  decimals,
  qtyDecimals,
  onClick,
}: {
  price: number;
  qty: number;
  total: number;
  maxTotal: number;
  side: "bid" | "ask";
  decimals: number;
  qtyDecimals: number;
  onClick?: () => void;
}) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const isBid = side === "bid";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="relative grid grid-cols-3 gap-2 px-3 py-0.5 md:py-1 text-xs tabular hover:bg-white/[0.06] cursor-pointer transition-colors group"
      title={`Click to use price $${fmtPrice(price, decimals)}`}
    >
      {/* Depth bar indicator */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 pointer-events-none transition-all duration-150",
          isBid ? "bg-primary/15" : "bg-danger/15"
        )}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
      <span className={cn("relative font-semibold", isBid ? "text-primary" : "text-danger")}>
        {fmtPrice(price, decimals)}
      </span>
      <span className="relative text-right text-foreground group-hover:text-white">
        {fmtQty(qty, qtyDecimals)}
      </span>
      <span className="relative text-right text-secondary group-hover:text-tertiary">
        {fmtQty(total, qtyDecimals)}
      </span>
    </div>
  );
}
