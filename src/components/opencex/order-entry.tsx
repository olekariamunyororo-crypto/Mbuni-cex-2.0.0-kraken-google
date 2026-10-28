"use client";

import { useState, useMemo } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtQty } from "@/lib/opencex/format";
import type { OrderType, Side } from "@/lib/opencex/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ORDER_TYPES: { key: OrderType; label: string; hint: string }[] = [
  { key: "LIMIT", label: "Limit", hint: "Rest on book at price" },
  { key: "MARKET", label: "Market", hint: "Taker at best price" },
  { key: "IOC", label: "IOC", hint: "Immediate-or-Cancel" },
  { key: "FOK", label: "FOK", hint: "Fill-or-Kill" },
  { key: "POST_ONLY", label: "Post", hint: "Maker only · never crosses" },
];

const PERCENTS = [25, 50, 75, 100];

export function OrderEntry({
  pair,
  initialSide,
  onSubmitted,
}: {
  pair: string;
  initialSide?: Side;
  onSubmitted?: () => void;
}) {
  const placeOrder = useOpenCEX((s) => s.placeOrder);
  const balances = useOpenCEX((s) => s.balances);
  const book = useOpenCEX((s) => s.books[pair]);
  const p = useOpenCEX((s) => s.pairs.find((x) => x.symbol === pair));
  const feeSchedules = useOpenCEX((s) => s.feeSchedules);

  const [side, setSide] = useState<Side>(initialSide ?? "BUY");
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

  // Auto-fill price if empty (for LIMIT/POST_ONLY)
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
    toast.success(`${side} ${type} order placed`, {
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

  return (
    <div className="flex flex-col h-full p-4 space-y-3">
      {/* Side toggle with soft semantic fills */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-surface/90 border border-white/5">
        <button
          type="button"
          onClick={() => setSide("BUY")}
          className={cn(
            "py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1",
            isBuy
              ? "bg-success-soft text-primary shadow-sm border border-success/30 font-bold"
              : "text-secondary hover:text-white"
          )}
        >
          Buy {baseAsset}
        </button>
        <button
          type="button"
          onClick={() => setSide("SELL")}
          className={cn(
            "py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1",
            !isBuy
              ? "bg-danger-soft text-danger shadow-sm border border-danger/30 font-bold"
              : "text-secondary hover:text-white"
          )}
        >
          Sell {baseAsset}
        </button>
      </div>

      {/* Order type tabs */}
      <div className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-surface/60 border border-white/5">
        {ORDER_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setType(t.key)}
            title={t.hint}
            className={cn(
              "flex-1 py-1 px-2 text-[11px] font-medium rounded-lg transition-all text-center whitespace-nowrap",
              type === t.key
                ? "bg-elevated text-white shadow-sm border border-white/10"
                : "text-secondary hover:text-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Available Balance */}
      <div className="flex items-center justify-between text-[11px] px-1">
        <span className="text-secondary font-medium">Available</span>
        <span className="tnum font-semibold text-white">
          {fmtQty(availableForOrder, isBuy ? 2 : p.baseDecimals)} {isBuy ? quoteAsset : baseAsset}
        </span>
      </div>

      {/* Price input (hidden for market) */}
      {type !== "MARKET" ? (
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-tertiary block font-semibold px-1">
            Price ({quoteAsset})
          </label>
          <div className="h-10 px-3 rounded-xl flex items-center gap-2 bg-surface/80 border border-[var(--color-glass-border)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(163,230,53,0.15)] transition-all">
            <input
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={bestPrice ? bestPrice.toFixed(p.priceDecimals) : "0.00"}
              step={p.tickSize}
              className="flex-1 min-w-0 bg-transparent text-sm text-white tnum font-semibold outline-none"
            />
            <button
              type="button"
              onClick={() => setPrice(bestPrice?.toFixed(p.priceDecimals) ?? "")}
              className="text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/15 rounded text-secondary hover:text-white transition-colors"
            >
              Mid
            </button>
          </div>
        </div>
      ) : (
        <div className="h-10 px-3 rounded-xl flex items-center justify-between bg-surface/50 border border-white/5 text-xs text-secondary">
          <span>Market Order</span>
          <span className="text-white tnum font-medium">Best Price</span>
        </div>
      )}

      {/* Amount input */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-wider text-tertiary block font-semibold px-1">
          Amount ({baseAsset})
        </label>
        <div className="h-10 px-3 rounded-xl flex items-center gap-2 bg-surface/80 border border-[var(--color-glass-border)] focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(163,230,53,0.15)] transition-all">
          <input
            type="number"
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="0.00"
            step={p.minQty}
            className="flex-1 min-w-0 bg-transparent text-sm text-white tnum font-semibold outline-none"
          />
          <span className="text-secondary text-[11px] font-semibold">{baseAsset}</span>
        </div>
      </div>

      {/* Percentage quick picks */}
      <div className="grid grid-cols-4 gap-1">
        {PERCENTS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setPercent(pct)}
            className="py-1 rounded-lg text-[11px] font-medium bg-surface/70 hover:bg-white/10 border border-white/5 text-secondary hover:text-white tnum transition-colors"
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Total + fee */}
      <div className="p-2.5 rounded-xl bg-surface/40 border border-white/5 space-y-1 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-secondary">Total Value</span>
          <span className="tnum font-semibold text-white">
            {fmtPrice(cost, 2)} {quoteAsset}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-secondary">Est. Fee ({isMaker ? "Maker" : "Taker"})</span>
          <span className="tnum text-tertiary">
            ≈ {fmtPrice(fee, 4)} {quoteAsset}
          </span>
        </div>
      </div>

      {/* Primary Action Button (always purple CTA per Principle 1) */}
      <div className="pt-1 mt-auto">
        <Button
          variant="primary"
          size="md"
          fullWidth
          loading={submitting}
          onClick={submit}
        >
          {isBuy ? `Buy ${baseAsset}` : `Sell ${baseAsset}`}
        </Button>
      </div>
    </div>
  );
}
