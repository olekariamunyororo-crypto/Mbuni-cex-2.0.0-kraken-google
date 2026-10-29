"use client";

import { useState } from "react";
import { OrderTicket } from "@/components/ui/OrderTicket";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CoinIcon } from "@/components/opencex/coin-icon";
import type { Side } from "@/lib/opencex/types";

/**
 * Floating Buy / Sell bar shown on mobile (≤ md) inside the trading view.
 * Tapping either opens a tempered glass bottom sheet containing the OrderTicket.
 */
export function MobileOrderSheet({ pair }: { pair: string }) {
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<Side>("BUY");

  const openWith = (s: Side) => {
    setSide(s);
    setOpen(true);
  };

  const baseAsset = pair.split("/")[0] || "BTC";

  return (
    <>
      {/* Floating action bar above bottom nav */}
      <div className="md:hidden fixed bottom-[calc(4.2rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-4 pb-2 pt-1 pointer-events-none">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => openWith("BUY")}
            className="h-11 rounded-xl bg-success-soft hover:bg-success-soft/80 border border-success/40 text-primary font-bold text-sm shadow-[0_4px_16px_rgba(163,230,53,0.15)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <CoinIcon asset={baseAsset} size={16} />
            <span>Buy {baseAsset}</span>
          </button>
          <button
            type="button"
            onClick={() => openWith("SELL")}
            className="h-11 rounded-xl bg-danger-soft hover:bg-danger-soft/80 border border-danger/40 text-danger font-bold text-sm shadow-[0_4px_16px_rgba(255,92,92,0.15)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            <CoinIcon asset={baseAsset} size={16} />
            <span>Sell {baseAsset}</span>
          </button>
        </div>
      </div>

      {/* Bottom sheet with OrderTicket — wrapped in tempered glass */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[85vh] p-0 glass-raised rounded-t-[28px] border-t border-x border-[var(--color-glass-border)] text-white shadow-2xl glass-edge"
        >
          <SheetHeader className="px-5 py-3 border-b border-divider">
            <SheetTitle className="text-base font-bold flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CoinIcon asset={baseAsset} size={20} />
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    side === "BUY"
                      ? "bg-success-soft text-primary border border-success/30"
                      : "bg-danger-soft text-danger border border-danger/30"
                  }`}
                >
                  {side === "BUY" ? "Buy" : "Sell"} {baseAsset}
                </span>
                <span className="text-secondary text-xs">{pair}</span>
              </div>
            </SheetTitle>
            <SheetDescription className="text-xs text-tertiary">
              CLOB matching engine · Limit, Market, IOC, FOK, Post-Only
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 h-[calc(85vh-4.5rem)] overflow-y-auto no-scrollbar">
            <OrderTicket
              key={side}
              pair={pair}
              initialSide={side}
              onSubmitted={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
