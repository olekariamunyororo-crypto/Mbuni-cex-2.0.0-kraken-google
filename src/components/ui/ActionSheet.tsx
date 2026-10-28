"use client";

import React from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Repeat,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  id: "buy" | "recurring" | "sell" | "convert" | "custom";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
}

const ACTION_ITEMS: ActionMenuItem[] = [
  {
    id: "buy",
    title: "Buy Crypto",
    description: "Instant purchase with fiat, Apple Pay or USDT",
    icon: ArrowDownToLine,
    accentColor: "#a3e635",
  },
  {
    id: "recurring",
    title: "Recurring Buy",
    description: "Automate daily, weekly, or monthly dollar-cost averaging",
    icon: Repeat,
    accentColor: "#7f66ff",
    badge: "DCA",
  },
  {
    id: "sell",
    title: "Sell & Withdraw",
    description: "Liquidate to fiat or transfer to whitelisted vault",
    icon: ArrowUpFromLine,
    accentColor: "#ff5c5c",
  },
  {
    id: "convert",
    title: "Instant Convert",
    description: "Zero fees, zero slippage instant spot currency swap",
    icon: ArrowLeftRight,
    accentColor: "#28a0f0",
  },
  {
    id: "custom",
    title: "Custom CLOB Order",
    description: "Limit, Post-Only, IOC, FOK orders on Rust matching engine",
    icon: SlidersHorizontal,
    accentColor: "#e0a23a",
    badge: "Pro",
  },
];

export interface ActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAction: (actionId: ActionMenuItem["id"]) => void;
}

/**
 * Action Sheet Menu per Section 6.2 & 6.8 of Mbuni Design System:
 * - Dark glass raised panel (glass-raised)
 * - Soft top handle bar
 * - Clear list of actions with icon + title + short description
 * - Full-width items with generous touch targets (py-4)
 */
export function ActionSheet({
  open,
  onOpenChange,
  onSelectAction,
}: ActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="glass-raised border-t border-x border-[var(--color-glass-border)] text-white rounded-t-3xl max-w-md mx-auto p-0 shadow-2xl glass-edge overflow-hidden"
      >
        {/* Soft top handle bar */}
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mt-3 mb-1" />

        <SheetHeader className="px-6 pt-3 pb-2 text-left">
          <SheetTitle className="text-[17px] font-bold text-white flex items-center justify-between">
            <span>Quick Actions</span>
            <span className="text-[11px] font-medium text-tertiary flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Mbuni 2.0</span>
            </span>
          </SheetTitle>
          <SheetDescription className="text-[12px] text-tertiary">
            Choose an action to execute immediately
          </SheetDescription>
        </SheetHeader>

        {/* Action list */}
        <div className="px-3 pb-6 pt-1 space-y-1">
          {ACTION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectAction(item.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition-all duration-150 text-left group border border-transparent hover:border-white/5"
              >
                {/* Icon well */}
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${item.accentColor}18`,
                    border: `1px solid ${item.accentColor}33`,
                    color: item.accentColor,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white tracking-tight">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white tnum">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-tertiary truncate mt-0.5">
                    {item.description}
                  </div>
                </div>

                {/* Trailing chevron */}
                <ChevronRight className="w-4 h-4 text-tertiary group-hover:text-white transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
