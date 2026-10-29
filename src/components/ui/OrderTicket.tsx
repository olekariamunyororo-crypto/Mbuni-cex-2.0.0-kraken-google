"use client";

import React, { useState, useMemo } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtQty } from "@/lib/opencex/format";
import type { OrderType, Side } from "@/lib/opencex/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CoinIcon } from "@/components/opencex/coin-icon";
import { cn } from "@/lib/utils";

const ORDER_TYPES: { key: OrderType; label: string }[] = [
  { key: "LIMIT", label: "Limit" },
  { key: "MARKET", label: "Market" },
  { key: "IOC", label: "IOC" },
  { key: "FOK", label: "FOK" },
  { key: "POST_ONLY", label: "Post" },
];

const PERCENTS = [25, 50, 75, 100];

export interface OrderTicketProps {
  pair: string;
  initialSide?: Side;
  onSubmitted?: () => void;
  className?: string;
  mode?: "compact" | "pro";
}

export function OrderTicket({
  pair,
  initialSide = "BUY",
  onSubmitted,
  className,
  mode = "pro",
}: OrderTicketProps) {
  const placeOrder = useOpenCEX((s) => s.placeOrder);
  const balances = useOpenCEX((s) => s.balances);
  const book = useOpenCEX((s) => s.books[pair]);
  const p = useOpenCEX((s) => s.pairs.find((x) => x.symbol === pair));
  const feeSchedules = useOpenCEX((s) => s.feeSchedules);

  const [side, setSide] = useState<Side>(initialSide);
  const [type, setType] = useState<OrderType>("LIMIT");
  const [price, setPrice] = useState<string>("");
  const [qty, setQty] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const baseAsset = p?.base ?? "";
  const quoteAsset = p?.quote ?? "";

  const baseBalance = balances.find((b) => b.asset === baseAsset)?.free ?? 0;
  const quoteBalance = balances.find((b) => b.asset === quoteAsset)?.free ?? 0;

  const isBuy = side === "BUY";
  const bestPrice = isBuy ? book?.asks[0]?.price : book?.bids[0]?.price;
  const midPrice = book?.midPrice ?? 0;

  const effectivePrice =
    type === "MARKET" ? null : price === "" ? (bestPrice ?? midPrice) : parseFloat(price);
  const effectiveQty = parseFloat(qty) || 0;
  const cost = effectivePrice ? effectivePrice * effectiveQty : 0;

  const availableForOrder = isBuy ? quoteBalance : baseBalance;
  const maxQty = isBuy
    ? effectivePrice && effectivePrice > 0
      ? quoteBalance / effectivePrice
      : 0
    : baseBalance;

  // Tier 3 fee schedule
  const tier = feeSchedules[3] ?? feeSchedules[0];
  const isMaker = type === "LIMIT" || type === "POST_ONLY";
  const feeBps = isMaker ? (tier?.makerFee ?? 10) : (tier?.takerFee ?? 18);
  const fee = (cost * feeBps) / 10000;

  const submit = () => {
    if (submitting) return;
    if (type !== "MARKET" && (!effectivePrice || effectivePrice <= 0)) {
      toast.error("Enter a valid price");
      return;
    }
    if (!effectiveQty || effectiveQty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    setSubmitting(true);
    const res = placeOrder({ pair, side, type, price: effectivePrice, qty: effectiveQty });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.reason ?? "Order rejected");
      return;
    }
    toast.success(`${side} ${type} order submitted`, {
      description: `${fmtQty(effectiveQty, p?.baseDecimals ?? 4)} ${baseAsset} @ ${
        effectivePrice ? fmtPrice(effectivePrice, p?.priceDecimals ?? 2) : "market"
      }`,
    });
    setQty("");
    onSubmitted?.();
  };

  const setPercent = (pct: number) => {
    const q = (maxQty * pct) / 100;
    setQty(q.toFixed(p?.baseDecimals ?? 4));
  };

  if (!p) return null;

  const isPro = mode === "pro";

  return (
    <div
      className={cn(
        "glass-raised flex flex-col border border-[var(--color-glass-border)]",
        isPro ? "rounded-2xl p-3 gap-2.5 text-xs" : "rounded-3xl p-5 gap-4",
        className
      )}
    >
      {/* Buy / Sell Segmented Control */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-surface/90 border border-white/5">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={cn(
            "rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-1.5",
            isPro ? "h-9 text-xs" : "h-11 text-sm",
            isBuy
              ? "bg-success-soft text-primary shadow-sm border border-success/30 font-bold"
              : "text-secondary hover:text-white"
          )}
        >
          <CoinIcon asset={baseAsset} size={isPro ? 14 : 16} />
          <span>Buy {baseAsset}</span>
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={cn(
            "rounded-xl font-semibold transition-all duration-150 flex items-center justify-center gap-1.5",
            isPro ? "h-9 text-xs" : "h-11 text-sm",
            !isBuy
              ? "bg-danger-soft text-danger shadow-sm border border-danger/30 font-bold"
              : "text-secondary hover:text-white"
          )}
        >
          <CoinIcon asset={baseAsset} size={isPro ? 14 : 16} />
          <span>Sell {baseAsset}</span>
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface/60 border border-white/5 overflow-x-auto no-scrollbar">
        {ORDER_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            className={cn(
              "flex-1 rounded-lg font-medium transition-all text-center whitespace-nowrap",
              isPro ? "py-0.5 px-1.5 text-[11px]" : "py-1 px-2.5 text-[12px]",
              type === t.key
                ? "bg-elevated text-white shadow-sm border border-white/10 font-bold"
                : "text-secondary hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Available Balance */}
      <div className="flex items-center justify-between text-[11px] px-0.5">
        <span className="text-secondary font-medium">Available</span>
        <span className="text-white tnum font-semibold inline-flex items-center gap-1.5">
          <CoinIcon asset={isBuy ? quoteAsset : baseAsset} size={12} />
          <span>{fmtQty(availableForOrder, isBuy ? 2 : p.baseDecimals)} {isBuy ? quoteAsset : baseAsset}</span>
        </span>
      </div>

      {/* Price Field */}
      {type !== "MARKET" ? (
        <div className={isPro ? "space-y-1" : "space-y-1.5"}>
          <label className="text-[10px] uppercase tracking-wider text-tertiary font-semibold px-0.5 inline-flex items-center gap-1.5">
            <CoinIcon asset={quoteAsset} size={11} />
            <span>Price ({quoteAsset})</span>
          </label>
          <div className={cn(
            "px-3 rounded-xl flex items-center gap-2 bg-surface/80 border border-[var(--color-glass-border)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(163,230,53,0.15)] transition-all",
            isPro ? "h-9" : "h-[52px]"
          )}>
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={bestPrice ? bestPrice.toFixed(p.priceDecimals) : "0.00"}
              step={p.tickSize}
              className={cn(
                "flex-1 min-w-0 bg-transparent text-white tnum font-semibold outline-none",
                isPro ? "text-xs" : "text-[16px]"
              )}
            />
            <button
              type="button"
              onClick={() => setPrice(bestPrice?.toFixed(p.priceDecimals) ?? "")}
              className="px-1.5 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/15 text-secondary hover:text-white transition-colors"
            >
              Mid
            </button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "px-3 rounded-xl flex items-center justify-between bg-surface/50 border border-white/5 text-secondary",
          isPro ? "h-9 text-xs" : "h-[52px] text-[14px]"
        )}>
          <span>Market Price</span>
          <span className="text-white tnum font-medium">Best Available execution</span>
        </div>
      )}

      {/* Amount Field */}
      <div className={isPro ? "space-y-1" : "space-y-1.5"}>
        <label className="text-[10px] uppercase tracking-wider text-tertiary font-semibold px-0.5 inline-flex items-center gap-1.5">
          <CoinIcon asset={baseAsset} size={11} />
          <span>Amount ({baseAsset})</span>
        </label>
        <div className={cn(
          "px-3 rounded-xl flex items-center gap-2 bg-surface/80 border border-[var(--color-glass-border)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(163,230,53,0.15)] transition-all",
          isPro ? "h-9" : "h-[52px]"
        )}>
          <input
            type="number"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            step={p.minQty}
            className={cn(
              "flex-1 min-w-0 bg-transparent text-white tnum font-semibold outline-none",
              isPro ? "text-xs" : "text-[16px]"
            )}
          />
          <span className="text-secondary text-xs font-semibold inline-flex items-center gap-1">
            <CoinIcon asset={baseAsset} size={13} />
            <span>{baseAsset}</span>
          </span>
        </div>
      </div>

      {/* Percentage Quick Picks */}
      <div className="grid grid-cols-4 gap-1">
        {PERCENTS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setPercent(pct)}
            className={cn(
              "rounded-lg font-medium bg-surface/70 hover:bg-white/10 border border-white/5 text-secondary hover:text-white tnum transition-colors",
              isPro ? "h-7 text-[11px]" : "h-8 text-[12px]"
            )}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Order Summary & Fee Info */}
      <div className={cn(
        "rounded-xl bg-surface/40 border border-white/5",
        isPro ? "p-2.5 space-y-1 text-[11px]" : "p-3.5 space-y-1.5 text-[12px]"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-secondary">Estimated Total</span>
          <span className="text-white tnum font-semibold">
            {fmtPrice(cost, 2)} {quoteAsset}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-secondary">Fee ({isMaker ? "Maker" : "Taker"} · {feeBps} bps)</span>
          <span className="text-tertiary tnum font-medium">
            ≈ {fmtPrice(fee, 4)} {quoteAsset}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <Button
        variant="primary"
        size={isPro ? "md" : "lg"}
        fullWidth
        pill
        icon={<CoinIcon asset={baseAsset} size={isPro ? 16 : 18} />}
        loading={submitting}
        onClick={submit}
        className={isPro ? "h-9 md:h-10 text-xs font-bold" : "mt-1"}
      >
        {isBuy ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
      </Button>
    </div>
  );
}
