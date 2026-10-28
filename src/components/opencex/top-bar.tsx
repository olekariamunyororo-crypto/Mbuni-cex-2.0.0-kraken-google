"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Settings, Activity, LogOut, Radio } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ViewKey } from "@/lib/opencex/types";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtPct } from "@/lib/opencex/format";
import { Ostrich } from "@/components/Ostrich";

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string; short: string }> = {
  trading: { title: "CLOB Terminal", short: "Trade", subtitle: "Rust Matching Engine · Sub-millisecond" },
  markets: { title: "Markets", short: "Markets", subtitle: "24h Volume & Price Discovery" },
  swap: { title: "Instant Swap", short: "Swap", subtitle: "Zero Slippage Convert" },
  wallet: { title: "Custody Wallet", short: "Assets", subtitle: "Multi-Chain HSM Balances" },
  admin: { title: "Risk & History", short: "History", subtitle: "Operations & Audits" },
  architecture: { title: "Architecture", short: "Arch", subtitle: "2.0.0 Microservices Mesh" },
};

interface SessionUserLike {
  email?: string | null;
  name?: string | null;
  onboardingComplete?: boolean;
  tier?: number;
  kycStatus?: string;
}

export function TopBar({
  view,
  sessionUser,
  onLogout,
}: {
  view: ViewKey;
  sessionUser?: SessionUserLike;
  onLogout?: () => void;
}) {
  const activePair = useOpenCEX((s) => s.activePair);
  const tickers = useOpenCEX((s) => s.tickers);
  const liveMode = useOpenCEX((s) => s.liveMode);
  const meta = VIEW_TITLES[view];
  const ticker = tickers[activePair];

  const displayName = sessionUser?.name || sessionUser?.email?.split("@")[0] || "alex.trader";
  const tier = sessionUser?.tier ?? 3;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-3 md:px-5 relative z-20">
      {/* Floating glass bar background */}
      <div className="absolute inset-x-2 md:inset-x-4 top-1.5 h-11 rounded-2xl glass z-0" />

      {/* Left: Brand / Title */}
      <div className="relative z-10 flex items-center gap-3 min-w-0">
        <div className="md:hidden flex items-center gap-2">
          <Ostrich size={22} />
          <span className="font-bold text-sm tracking-tight text-white">Mbuni</span>
        </div>

        <div className="hidden md:flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">{meta.title}</h1>
            <span className="text-[11px] text-tertiary">·</span>
            <span className="text-[11px] text-secondary font-mono">{activePair}</span>
          </div>
          <span className="text-[11px] text-tertiary truncate">{meta.subtitle}</span>
        </div>
      </div>

      {/* Center: Live Ticker Quick Look */}
      {ticker && (
        <div className="relative z-10 flex items-center gap-3 px-3 py-1 rounded-xl bg-surface/50 border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-white font-semibold tnum">${fmtPrice(ticker.lastPrice, 2)}</span>
            <span
              className={`text-[11px] font-semibold tnum ${
                ticker.priceChangePct >= 0 ? "text-primary" : "text-danger"
              }`}
            >
              {fmtPct(ticker.priceChangePct)}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-tertiary">
            <Radio className="w-3 h-3 text-primary animate-pulse" />
            <span>Rust Engine</span>
          </div>
        </div>
      )}

      {/* Right: User Status & Logout */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-surface/60 border border-white/5 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary live-dot" />
          <span className="text-secondary font-medium">{displayName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-white font-bold">
            T{tier}
          </span>
        </div>

        <button
          type="button"
          onClick={() => signOut({ redirect: false }).then(() => onLogout?.())}
          className="p-1.5 rounded-xl text-tertiary hover:text-danger hover:bg-danger/10 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
