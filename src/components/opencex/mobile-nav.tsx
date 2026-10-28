"use client";

import { useState } from "react";
import { Home, TrendingUp, ArrowLeftRight, Wallet, Clock, X, LogOut, Network, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ViewKey } from "@/lib/opencex/types";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtUSD } from "@/lib/opencex/format";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ActionSheet, type ActionMenuItem } from "@/components/ui/ActionSheet";
import { toast } from "sonner";

interface NavItem {
  key: ViewKey;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY: NavItem[] = [
  { key: "trading", label: "Home", short: "Home", icon: Home },
  { key: "markets", label: "Market", short: "Market", icon: TrendingUp },
  { key: "swap", label: "Trade", short: "Trade", icon: Plus },
  { key: "wallet", label: "Assets", short: "Assets", icon: Wallet },
  { key: "admin", label: "History", short: "History", icon: Clock },
];

const SECONDARY: NavItem[] = [
  { key: "architecture", label: "Architecture", short: "Arch", icon: Network },
];

export function MobileNav({
  view,
  onChange,
  onLogout,
  sessionUser,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  onLogout?: () => void;
  sessionUser?: { email?: string | null; name?: string | null; tier?: number };
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const balances = useOpenCEX((s) => s.balances);
  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);

  const select = (v: ViewKey) => {
    onChange(v);
    setMoreOpen(false);
  };

  const handleActionSelect = (actionId: ActionMenuItem["id"]) => {
    switch (actionId) {
      case "buy":
        onChange("trading");
        toast.success("Ready to Buy", { description: "Place your order in the trading ticket" });
        break;
      case "recurring":
        toast.info("Recurring DCA Setup", { description: "Automated daily/weekly buys enabled for top assets" });
        onChange("swap");
        break;
      case "sell":
        onChange("wallet");
        toast.info("Wallet & Withdraw", { description: "Select asset to sell or withdraw to vault" });
        break;
      case "convert":
        onChange("swap");
        break;
      case "custom":
        onChange("trading");
        break;
    }
  };

  const displayName = sessionUser?.name || sessionUser?.email?.split("@")[0] || "alex.trader";
  const initials = displayName.slice(0, 2).toUpperCase();
  const tier = sessionUser?.tier ?? 3;

  return (
    <>
      {/* Floating tempered glass tab bar per Section 6.8 */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pointer-events-none"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="glass-strong rounded-2xl px-2 py-2 flex items-center justify-between glass-edge max-w-md mx-auto pointer-events-auto">
          {PRIMARY.map((item, index) => {
            const isCenter = index === 2;
            const Icon = item.icon;
            const active = view === item.key;

            if (isCenter) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActionSheetOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 px-2 py-0.5 rounded-xl transition-all flex-1 select-none active:scale-95 group"
                >
                  <div className="w-8 h-8 rounded-full bg-cta text-white flex items-center justify-center shadow-[0_4px_14px_rgba(127,102,255,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform group-hover:scale-105">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-[9px] font-semibold text-white/90">Trade</span>
                </button>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => select(item.key)}
                className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1 select-none active:scale-95 ${
                  active ? "text-primary" : "text-tertiary hover:text-secondary"
                }`}
                style={
                  active
                    ? {
                        background: "rgba(163, 230, 53, 0.08)",
                        boxShadow: "inset 0 1px 0 rgba(163, 230, 53, 0.06)",
                      }
                    : {}
                }
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
                <span className={`text-[9px] ${active ? "font-semibold" : ""}`}>{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Action Sheet per Section 6.2 (triggered by prominent center button) */}
      <ActionSheet
        open={actionSheetOpen}
        onOpenChange={setActionSheetOpen}
        onSelectAction={handleActionSelect}
      />

      {/* More drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="glass-strong text-white border-t border-white/10" style={{ background: "rgba(20, 22, 31, 0.95)" }}>
          <DrawerHeader className="text-left px-5 pt-4 pb-2">
            <DrawerTitle className="flex items-center justify-between text-base font-bold text-white">
              <span>Account & Systems</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-tertiary hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </DrawerTitle>
            <DrawerDescription className="text-xs text-tertiary">
              System views · portfolio summary
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-5 pb-6 space-y-4">
            <div className="glass-card p-4">
              <div className="text-[11px] text-tertiary font-medium">Portfolio Value</div>
              <div className="text-2xl font-bold tnum mt-0.5">{fmtUSD(totalUSD)}</div>
              <div className="text-[12px] text-primary mt-0.5 font-medium">+2.4% 24h</div>
            </div>

            <div className="space-y-1">
              {SECONDARY.map((item) => {
                const Icon = item.icon;
                const active = view === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => select(item.key)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all ${
                      active ? "text-primary bg-primary/10" : "text-tertiary hover:text-white hover:bg-white/5"
                    }`}
                    style={active ? { background: "rgba(163, 230, 53, 0.08)" } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center gap-3 px-2 pt-3"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                style={{ background: "linear-gradient(135deg, #7f66ff, #9580ff)" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-white">{displayName}</div>
                <div className="text-[10px] text-tertiary">Tier {tier} · Verified Account</div>
              </div>
              <button
                type="button"
                onClick={() =>
                  signOut({ redirect: false }).then(() => {
                    setMoreOpen(false);
                    onLogout?.();
                  })
                }
                className="p-2 rounded-lg text-tertiary hover:text-danger transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
