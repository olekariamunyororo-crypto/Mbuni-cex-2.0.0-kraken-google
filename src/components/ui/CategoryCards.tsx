"use client";

import React from "react";
import { Cpu, Layers, Flame, Landmark, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface CategoryCardData {
  id: string;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
  assetCount: number;
  sampleTokens: string[];
}

export const CATEGORIES: CategoryCardData[] = [
  {
    id: "layer2",
    title: "Layer 2 & Rollups",
    tagline: "Scalable Ethereum execution layers with near-zero gas",
    icon: Layers,
    accentColor: "#28a0f0",
    badge: "Trending",
    assetCount: 12,
    sampleTokens: ["ARB", "OP", "MATIC"],
  },
  {
    id: "ai",
    title: "AI & DePIN Mesh",
    tagline: "Decentralized GPU compute, neural models & data agents",
    icon: Cpu,
    accentColor: "#9945ff",
    badge: "+18.4% 24h",
    assetCount: 8,
    sampleTokens: ["NEAR", "FET", "RNDR"],
  },
  {
    id: "defi",
    title: "DeFi Bluechips",
    tagline: "High-yield automated market makers and decentralized lending",
    icon: Zap,
    accentColor: "#a3e635",
    assetCount: 15,
    sampleTokens: ["UNI", "AAVE", "LINK"],
  },
  {
    id: "rwa",
    title: "Real World Assets",
    tagline: "Tokenized US Treasuries, private credit & commodities",
    icon: Landmark,
    accentColor: "#e0a23a",
    badge: "Institutional",
    assetCount: 6,
    sampleTokens: ["ONDO", "MPL", "CFG"],
  },
  {
    id: "memes",
    title: "High Velocity Memes",
    tagline: "Community momentum tokens with highest 24h volatility",
    icon: Flame,
    accentColor: "#ff5c5c",
    assetCount: 22,
    sampleTokens: ["DOGE", "PEPE", "SHIB"],
  },
];

export function CategoryCards({
  onSelectCategory,
  className,
}: {
  onSelectCategory?: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-3.5 overflow-x-auto no-scrollbar pb-1 px-1 -mx-1 snap-x",
        className
      )}
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <div
            key={cat.id}
            className="w-[260px] shrink-0 snap-start glass-raised rounded-3xl p-4 border border-[var(--color-glass-border)] flex flex-col justify-between hover:border-white/20 transition-all duration-200 group"
          >
            <div>
              {/* Header: Icon + Badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{
                    backgroundColor: `${cat.accentColor}18`,
                    border: `1px solid ${cat.accentColor}33`,
                    color: cat.accentColor,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {cat.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white tnum">
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h3 className="text-[15px] font-bold text-white tracking-tight">{cat.title}</h3>
              <p className="text-[12px] text-tertiary mt-1 line-clamp-2 leading-relaxed">
                {cat.tagline}
              </p>

              {/* Sample tokens */}
              <div className="flex items-center gap-1.5 mt-3">
                {cat.sampleTokens.map((sym) => (
                  <span
                    key={sym}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface/70 border border-white/5 text-secondary"
                  >
                    {sym}
                  </span>
                ))}
                <span className="text-[11px] text-tertiary ml-auto font-medium tnum">
                  {cat.assetCount} assets
                </span>
              </div>
            </div>

            {/* Bottom action per Section 6.5 */}
            <div className="pt-4 mt-2 border-t border-divider">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                pill
                onClick={() => onSelectCategory?.(cat.id)}
                icon={<ArrowRight className="w-3.5 h-3.5 ml-auto text-secondary group-hover:text-white group-hover:translate-x-0.5 transition-all" />}
                className="justify-between text-xs"
              >
                <span>Explore {cat.title.split(" ")[0]}</span>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
