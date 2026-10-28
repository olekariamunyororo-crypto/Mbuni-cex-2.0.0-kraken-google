"use client";

import React from "react";
import { TrendingUp, ArrowLeftRight, Wallet, Clock, CandlestickChart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewKey } from "@/lib/opencex/types";

export interface TabBarProps {
  view: ViewKey;
  onChange: (view: ViewKey) => void;
  className?: string;
}

interface TabItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { key: "trading", label: "Trade", icon: CandlestickChart },
  { key: "markets", label: "Markets", icon: TrendingUp },
  { key: "swap", label: "Swap", icon: ArrowLeftRight },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "admin", label: "History", icon: Clock },
];

export function TabBar({ view, onChange, className }: TabBarProps) {
  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-50 tab-bar-glass px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all",
        className
      )}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = view === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all duration-150 active:scale-95 select-none",
                active ? "text-primary font-semibold" : "text-muted hover:text-secondary"
              )}
            >
              <div
                className={cn(
                  "w-10 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                  active
                    ? "bg-primary-soft shadow-[inset_0_1px_0_rgba(163,230,53,0.2)] text-primary"
                    : "text-muted"
                )}
              >
                <Icon className={cn("w-5 h-5", active ? "stroke-[2.3]" : "stroke-[1.8]")} />
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
