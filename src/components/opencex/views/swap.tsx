"use client";

import { useState, useMemo } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtQty } from "@/lib/opencex/format";
import { ASSET_METADATA } from "@/lib/opencex/seed";
import { ArrowDownUp, Settings2, ShieldCheck, Zap, Info, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { AIInsightCard } from "@/components/ui/AIInsightCard";
import { cn } from "@/lib/utils";

export function SwapView() {
  const balances = useOpenCEX((s) => s.balances);
  const tickers = useOpenCEX((s) => s.tickers);
  const pairs = useOpenCEX((s) => s.pairs);
  const placeOrder = useOpenCEX((s) => s.placeOrder);
  const pushEvent = useOpenCEX((s) => s.pushEvent);

  const assets = Array.from(new Set([...balances.map((b) => b.asset), ...Object.keys(ASSET_METADATA)]));
  const [fromAsset, setFromAsset] = useState("USDT");
  const [toAsset, setToAsset] = useState("BTC");
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fromBalance = balances.find((b) => b.asset === fromAsset)?.free ?? 0;
  const toBalance = balances.find((b) => b.asset === toAsset)?.free ?? 0;

  // Find price via direct or inverse pair
  const { price, route } = useMemo(() => {
    const direct = pairs.find((p) => p.base === toAsset && p.quote === fromAsset);
    if (direct && tickers[direct.symbol]) {
      return { price: 1 / tickers[direct.symbol].lastPrice, route: `${fromAsset} → ${toAsset} (direct)` };
    }
    const inverse = pairs.find((p) => p.base === fromAsset && p.quote === toAsset);
    if (inverse && tickers[inverse.symbol]) {
      return { price: tickers[inverse.symbol].lastPrice, route: `${fromAsset} → ${toAsset} (inverse)` };
    }
    // Bridge via USDT
    if (fromAsset !== "USDT" && toAsset !== "USDT") {
      const fromUsd = tickers[`${fromAsset}/USDT`]?.lastPrice ?? (fromAsset === "USDT" ? 1 : 0);
      const toUsd = tickers[`${toAsset}/USDT`]?.lastPrice ?? (toAsset === "USDT" ? 1 : 0);
      if (fromUsd && toUsd) {
        return { price: fromUsd / toUsd, route: `${fromAsset} → USDT → ${toAsset}` };
      }
    }
    return { price: 0, route: "No direct route" };
  }, [fromAsset, toAsset, pairs, tickers]);

  const fromValue = parseFloat(fromAmount) || 0;
  const expectedOut = price ? fromValue * price : 0;
  const minReceived = expectedOut * (1 - slippage / 100);

  const swap = () => {
    if (!fromValue || fromValue <= 0) {
      toast.error("Enter an amount to swap");
      return;
    }
    if (fromValue > fromBalance) {
      toast.error(`Insufficient ${fromAsset} balance`);
      return;
    }
    if (fromAsset === toAsset) {
      toast.error("Cannot swap same asset");
      return;
    }

    // Execute as a market order via the matching engine
    let pairSym: string | null = null;
    let side: "BUY" | "SELL" | null = null;
    const direct = pairs.find((p) => p.base === toAsset && p.quote === fromAsset);
    const inverse = pairs.find((p) => p.base === fromAsset && p.quote === toAsset);

    if (direct) {
      pairSym = direct.symbol;
      side = "BUY";
    } else if (inverse) {
      pairSym = inverse.symbol;
      side = "SELL";
    } else if (fromAsset === "USDT") {
      const p = pairs.find((x) => x.base === toAsset);
      if (p) {
        pairSym = p.symbol;
        side = "BUY";
      }
    } else if (toAsset === "USDT") {
      const p = pairs.find((x) => x.base === fromAsset);
      if (p) {
        pairSym = p.symbol;
        side = "SELL";
      }
    }

    if (!pairSym || !side) {
      toast.error("No liquidity route for this pair");
      return;
    }

    const res = placeOrder({
      pair: pairSym,
      side,
      type: "MARKET",
      price: null,
      qty: side === "SELL" ? fromValue : fromValue * (1 / (price || 1)),
    });

    if (!res.ok) {
      toast.error(res.reason ?? "Swap failed");
      return;
    }

    pushEvent("trades.executed", { type: "swap", from: fromAsset, to: toAsset, amount: fromValue, route });
    toast.success("Swap executed successfully", {
      description: `${fmtQty(fromValue, 4)} ${fromAsset} → ${fmtQty(expectedOut, 6)} ${toAsset}`,
    });
    setFromAmount("");
    setConfirmOpen(false);
  };

  const flip = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setFromAmount("");
  };

  return (
    <div className="p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-4">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-[28px] font-bold tracking-tight text-white">Instant Swap</h2>
          <p className="text-[13px] text-secondary">
            Zero-slippage spot convert routed through the matching engine
          </p>
        </div>

        {/* AI Co-pilot Insight */}
        <AIInsightCard
          title="Optimal Execution"
          insight={`Route: ${route}. Spread is tight (< 0.05%) with deep liquidity available for ${fromAsset}.`}
          accent="purple"
        />

        {/* Main Swap Card */}
        <div className="glass-raised rounded-3xl p-5 border border-[var(--color-glass-border)] space-y-3 glass-edge">
          {/* Header & Slippage control */}
          <div className="flex items-center justify-between pb-1 text-xs">
            <span className="text-secondary font-medium">Slippage Tolerance</span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface/70 border border-white/5">
              {[0.1, 0.5, 1.0].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSlippage(v)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[11px] font-medium transition-all tnum",
                    slippage === v
                      ? "bg-elevated text-primary shadow-sm border border-white/10"
                      : "text-secondary hover:text-white"
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* From Field (52px control) */}
          <div className="p-3.5 rounded-2xl bg-surface/90 border border-[var(--color-glass-border)] space-y-2">
            <div className="flex items-center justify-between text-[12px] text-secondary">
              <span className="font-medium">You pay</span>
              <span className="tnum font-medium">
                Balance: <span className="text-white font-semibold">{fmtQty(fromBalance, 4)} {fromAsset}</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 min-w-0 bg-transparent text-[28px] font-bold text-white tnum outline-none"
              />
              <AssetPicker value={fromAsset} onChange={setFromAsset} assets={assets} />
            </div>
            <div className="flex gap-1.5 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setFromAmount(((fromBalance * pct) / 100).toFixed(4))}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/10 text-secondary hover:text-white tnum transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={flip}
              aria-label="Invert currencies"
              className="w-10 h-10 rounded-full glass-raised border border-white/15 flex items-center justify-center text-primary hover:text-primary-hover shadow-lg active:scale-95 transition-all"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* To Field */}
          <div className="p-3.5 rounded-2xl bg-surface/90 border border-[var(--color-glass-border)] space-y-2">
            <div className="flex items-center justify-between text-[12px] text-secondary">
              <span className="font-medium">You receive (estimated)</span>
              <span className="tnum font-medium">
                Balance: <span className="text-white font-semibold">{fmtQty(toBalance, 4)} {toAsset}</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[28px] font-bold text-white tnum truncate">
                {expectedOut > 0 ? fmtQty(expectedOut, 6) : "0.00"}
              </div>
              <AssetPicker value={toAsset} onChange={setToAsset} assets={assets} />
            </div>
            <div className="text-[12px] text-tertiary tnum pt-1">
              {price > 0 && `1 ${fromAsset} ≈ ${fmtQty(price, 6)} ${toAsset}`}
            </div>
          </div>

          {/* Routing & Fee Preview */}
          <div className="p-3 rounded-2xl bg-surface/40 border border-white/5 space-y-1.5 text-[12px]">
            <div className="flex justify-between items-center">
              <span className="text-secondary">Execution Price</span>
              <span className="text-white tnum font-semibold">
                {price > 0 ? `1 ${toAsset} ≈ ${fmtPrice(1 / price, 2)} ${fromAsset}` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary">Minimum Received</span>
              <span className="text-white tnum font-semibold">
                {fmtQty(minReceived, 6)} {toAsset}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary">Exchange Fee</span>
              <span className="text-primary font-semibold">0.00% (Zero Fee Promotion)</span>
            </div>
          </div>

          {/* Primary CTA (52px height, purple CTA, pill) */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            pill
            onClick={swap}
            disabled={!fromValue || fromValue <= 0 || fromValue > fromBalance}
            className="mt-2"
          >
            {fromValue > fromBalance
              ? `Insufficient ${fromAsset}`
              : `Swap ${fromAsset} for ${toAsset}`}
          </Button>
        </div>

        {/* Security / Non-Custodial Trust Badge */}
        <div className="flex items-center justify-center gap-2 text-[12px] text-tertiary">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Non-custodial execution · Sub-millisecond matching</span>
        </div>
      </div>
    </div>
  );
}

function AssetPicker({
  value,
  onChange,
  assets,
}: {
  value: string;
  onChange: (asset: string) => void;
  assets: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-10 pl-3 pr-8 rounded-xl bg-elevated border border-white/10 text-white font-semibold text-sm cursor-pointer outline-none hover:bg-white/10 transition-colors"
      >
        {assets.map((a) => (
          <option key={a} value={a} className="bg-bg text-white">
            {a}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-secondary absolute right-2.5 top-3 pointer-events-none" />
    </div>
  );
}
