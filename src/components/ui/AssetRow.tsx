"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPrice, fmtPct, fmtUSD, fmtQty } from "@/lib/opencex/format";
import { CoinIcon } from "@/components/opencex/coin-icon";

export interface AssetRowProps {
  symbol: string;
  name?: string;
  price?: number;
  change24h?: number;
  volume24h?: number;
  balance?: number;
  usdValue?: number;
  onClick?: () => void;
  className?: string;
}

const ASSET_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  USDT: "#26a17b",
  SOL: "#9945ff",
  BNB: "#f3ba2f",
  LINK: "#2a5ada",
  ADA: "#0033ad",
  XRP: "#23292f",
  ARB: "#28a0f0",
  OP: "#ff0420",
  TON: "#0098ea",
  AVAX: "#e84142",
  SUI: "#4fa8f6",
  NEAR: "#000000",
  DOGE: "#c2a633",
};

export function AssetRow({
  symbol,
  name,
  price,
  change24h,
  volume24h,
  balance,
  usdValue,
  onClick,
  className,
}: AssetRowProps) {
  const baseSymbol = symbol.includes("/") ? symbol.split("/")[0] : symbol;
  const quoteSymbol = symbol.includes("/") ? symbol.split("/")[1] : "USDT";
  const assetColor = ASSET_COLORS[baseSymbol] || "var(--color-primary)";
  const isUp = (change24h ?? 0) >= 0;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "flex items-center justify-between py-3.5 px-3 rounded-2xl transition-all duration-150 border-b border-divider/60 last:border-b-0",
        onClick ? "hover:bg-white/[0.04] active:bg-white/[0.07] cursor-pointer" : "",
        className
      )}
    >
      {/* Left: Coin Icon + Asset Info per §6.3 & §6.11 */}
      <div className="flex items-center gap-3 min-w-0">
        <CoinIcon asset={baseSymbol} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-white tracking-tight">{baseSymbol}</span>
            {symbol.includes("/") && (
              <span className="text-[11px] text-tertiary">/{quoteSymbol}</span>
            )}
          </div>
          <div className="text-[12px] text-secondary truncate">
            {name || (balance !== undefined ? `${fmtQty(balance, 4)} ${baseSymbol}` : `${baseSymbol} Token`)}
          </div>
        </div>
      </div>

      {/* Right: Numbers (Prices or Balances) */}
      <div className="text-right shrink-0">
        {balance !== undefined && usdValue !== undefined ? (
          <>
            <div className="text-[15px] font-semibold text-white tnum tracking-tight">
              {fmtUSD(usdValue)}
            </div>
            <div className="text-[12px] text-secondary tnum">
              {fmtQty(balance, 4)} {baseSymbol}
            </div>
          </>
        ) : price !== undefined ? (
          <>
            <div className="text-[15px] font-semibold text-white tnum tracking-tight">
              ${fmtPrice(price, price < 1 ? 4 : 2)}
            </div>
            {change24h !== undefined && (
              <div
                className={cn(
                  "inline-flex items-center gap-0.5 text-[13px] font-medium tnum",
                  isUp ? "text-success" : "text-danger"
                )}
              >
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{fmtPct(change24h)}</span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
