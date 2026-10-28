"use client";

import React from "react";
import { Plus, ArrowDownToLine, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fmtUSD } from "@/lib/opencex/format";
import { cn } from "@/lib/utils";

export interface BalanceHeroProps {
  userName?: string;
  totalUSD: number;
  change24hUSD?: number;
  change24hPct?: number;
  isVerified?: boolean;
  onAddMoney?: () => void;
  onBuyAssets?: () => void;
  onVerify?: () => void;
  className?: string;
}

/**
 * Balance Hero per Section 6.9 of Mbuni Design System:
 * Welcome, {Name}
 * $0.00 (large 32px–40px bold tabular)
 * [Add money]  [Buy assets] (Two secondary action pills directly below)
 */
export function BalanceHero({
  userName = "Alex",
  totalUSD,
  change24hUSD = 348.12,
  change24hPct = 2.48,
  isVerified = true,
  onAddMoney,
  onBuyAssets,
  onVerify,
  className,
}: BalanceHeroProps) {
  const isZero = totalUSD <= 0.01;

  return (
    <div
      className={cn(
        "glass-raised rounded-3xl p-6 border border-[var(--color-glass-border)] glass-edge relative overflow-hidden",
        className
      )}
    >
      {/* Background soft ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cta/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 space-y-4">
        {/* Welcome greeting & verification badge */}
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-medium text-secondary">
            Welcome back, <span className="text-white font-semibold">{userName}</span>
          </div>
          {isVerified ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onVerify}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-[11px] font-semibold text-gold hover:bg-gold/20 transition-colors"
            >
              <span>Verify ID</span>
            </button>
          )}
        </div>

        {/* Hero Balance Number */}
        <div>
          <div className="text-[11px] font-semibold text-tertiary uppercase tracking-wider">
            Total Balance
          </div>
          <div className="text-[36px] sm:text-[40px] font-bold tracking-tight text-white tnum mt-0.5 leading-none">
            {fmtUSD(totalUSD)}
          </div>
          {!isZero ? (
            <div className="flex items-center gap-2 mt-2 text-[13px]">
              <span className="text-primary font-semibold tnum">
                +{change24hPct >= 0 ? `+${change24hPct.toFixed(2)}%` : `${change24hPct.toFixed(2)}%`} (+$
                {Math.abs(change24hUSD).toFixed(2)})
              </span>
              <span className="text-tertiary">·</span>
              <span className="text-secondary text-[12px]">Past 24h</span>
            </div>
          ) : (
            <div className="text-[12px] text-tertiary mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Fund your account with crypto or card to start trading.</span>
            </div>
          )}
        </div>

        {/* Two Secondary Action Pills (Section 6.9: [Add money] [Buy assets]) */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="secondary"
            size="md"
            pill
            icon={<ArrowDownToLine className="w-4 h-4 text-primary" />}
            onClick={onAddMoney}
            className="flex-1"
          >
            Add money
          </Button>

          <Button
            variant="secondary"
            size="md"
            pill
            icon={<ArrowUpRight className="w-4 h-4 text-cta" />}
            onClick={onBuyAssets}
            className="flex-1"
          >
            Buy assets
          </Button>
        </div>
      </div>
    </div>
  );
}
