"use client";

import React, { useState } from "react";
import { ASSET_METADATA } from "@/lib/opencex/seed";
import { cn } from "@/lib/utils";

// Known coin logos bundled in public/crypto/*.svg
export const LOGOS = new Set([
  "BTC",
  "ETH",
  "USDT",
  "SOL",
  "BNB",
  "XRP",
  "DOGE",
  "MATIC",
  "AVAX",
  "LINK",
  "ADA",
  "ARB",
  "OP",
  "TON",
]);

export interface CoinIconProps {
  asset: string;
  size?: number; // pixel diameter (e.g. 12, 16, 20, 24, 28, 32, 36, 40)
  className?: string;
}

/**
 * CoinIcon component adhering to Section 6.11 of Mbuni Design System:
 * - Real official circular SVG logos located at /crypto/<symbol>.svg
 * - Graceful fallback to 2-letter colored badge on load error or unknown assets
 * - Loading lazy, decoding async, non-draggable
 */
export function CoinIcon({ asset, size = 24, className }: CoinIconProps) {
  const [hasError, setHasError] = useState(false);

  // Normalize asset symbol (e.g., "BTC/USDT" -> "BTC", "wbtc" -> "WBTC")
  const rawSymbol = asset ? asset.split("/")[0].trim().toUpperCase() : "BTC";
  const lower = rawSymbol.toLowerCase();
  const isKnown = LOGOS.has(rawSymbol);

  // Fallback metadata
  const meta = ASSET_METADATA[rawSymbol] || {
    name: rawSymbol,
    color: "var(--color-primary)",
    chains: [],
  };

  // If known logo and no load error, render plain SVG <img>
  if (isKnown && !hasError) {
    return (
      <img
        src={`/crypto/${lower}.svg`}
        alt={`${rawSymbol} logo`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setHasError(true)}
        className={cn(
          "rounded-full shrink-0 select-none bg-white/5 object-cover",
          className
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
        }}
      />
    );
  }

  // Fallback letter badge (2 letters, color from ASSET_METADATA)
  const letters = rawSymbol.slice(0, 2).toUpperCase();
  const fontSize = Math.max(9, Math.round(size * 0.42));

  return (
    <div
      role="img"
      aria-label={`${rawSymbol} logo`}
      className={cn(
        "rounded-full shrink-0 select-none flex items-center justify-center font-bold tracking-tight shadow-inner",
        className
      )}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        fontSize: `${fontSize}px`,
        backgroundColor: `${meta.color}22`,
        color: meta.color,
        border: `1px solid ${meta.color}44`,
      }}
    >
      {letters}
    </div>
  );
}

/**
 * PairIcon helper to render single or dual coin logos for trading pairs.
 * Pairs with quote USDT display base logo only per §6.11 rules;
 * non-USDT pairs show overlapping base over quote logos.
 */
export function PairIcon({
  pair,
  size = 24,
  className,
}: {
  pair: string;
  size?: number;
  className?: string;
}) {
  const parts = pair.split("/");
  const base = parts[0] || "BTC";
  const quote = parts[1] || "USDT";

  if (quote === "USDT" || quote === "") {
    return <CoinIcon asset={base} size={size} className={className} />;
  }

  const offset = Math.round(size * 0.35);

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size + offset, height: size }}>
      <CoinIcon asset={base} size={size} className="relative z-10" />
      <CoinIcon
        asset={quote}
        size={Math.round(size * 0.85)}
        className="absolute top-0 right-0 z-0 opacity-80"
      />
    </div>
  );
}
