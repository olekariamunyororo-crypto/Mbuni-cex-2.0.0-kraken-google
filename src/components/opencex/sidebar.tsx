"use client";

import { LayoutDashboard, CandlestickChart, ArrowLeftRight, Wallet, ShieldCheck, Network, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ViewKey } from "@/app/page";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtUSD } from "@/lib/opencex/format";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";
import { useState } from "react";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV: NavItem[] = [
  { key: "trading", label: "Home", icon: CandlestickChart, description: "Pro CLOB terminal" },
  { key: "markets", label: "Market", icon: LayoutDashboard, description: "All pairs & 24h stats" },
  { key: "swap", label: "Trade", icon: ArrowLeftRight, description: "Simple spot convert" },
  { key: "wallet", label: "Assets", icon: Wallet, description: "Balances, deposits, withdrawals" },
  { key: "admin", label: "History", icon: ShieldCheck, description: "Activity & risk" },
  { key: "architecture", label: "Architecture", icon: Network, description: "System & observability" },
];

interface SessionUserLike {
  email?: string | null;
  name?: string | null;
  onboardingComplete?: boolean;
  tier?: number;
  kycStatus?: string;
}

export function Sidebar({
  view,
  onChange,
  onLogout,
  sessionUser,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  onLogout?: () => void;
  sessionUser?: SessionUserLike;
}) {
  const balances = useOpenCEX((s) => s.balances);
  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
      return;
    }
    signOut({ redirect: false }).then(() => onLogout?.());
  };

  const displayName = sessionUser?.name || sessionUser?.email?.split("@")[0] || "alex.trader";
  const initials = displayName.slice(0, 2).toUpperCase();
  const tier = sessionUser?.tier ?? 3;

  return (
    <aside className="w-60 shrink-0 flex flex-col p-3">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-2 mb-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl blur-lg" style={{ background: "radial-gradient(circle, rgba(163, 230, 53, 0.2), transparent 70%)" }} />
          <div className="glass relative w-9 h-9 rounded-xl flex items-center justify-center text-primary">
            <OstrichLogo className="w-7 h-7" />
          </div>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm tracking-tight">Mbuni CEX</span>
          <span className="text-[10px] text-tertiary uppercase tracking-wider">2.0 · Tempered Glass</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative overflow-hidden ${
                active ? "text-primary" : "text-tertiary hover:text-foreground"
              }`}
              style={active ? {
                background: "rgba(163, 230, 53, 0.06)",
                boxShadow: "inset 0 1px 0 rgba(163, 230, 53, 0.08), 0 0 20px rgba(163, 230, 53, 0.05)",
                border: "1px solid rgba(163, 230, 53, 0.1)",
              } : {}}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? "text-glow-primary" : ""}`} />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-medium">{item.label}</span>
                <span className="text-[10px] text-tertiary">{item.description}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Portfolio card */}
      <div className="glass-card p-4 mt-2">
        <div className="text-[10px] uppercase tracking-wider text-tertiary">Portfolio Value</div>
        <div className="text-lg font-bold tnum mt-0.5">{fmtUSD(totalUSD)}</div>
        <div className="text-[10px] text-primary mt-0.5">+2.4% 24h</div>
      </div>

      {/* User */}
      <div className="flex items-center gap-2 px-1 mt-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #7f66ff, #9580ff)" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{displayName}</div>
          <div className="text-[10px] text-tertiary">Tier {tier} · KYC Verified</div>
        </div>
        <button
          onClick={handleLogout}
          title={confirmLogout ? "Click again to confirm" : "Sign out"}
          className={`p-1.5 rounded-lg transition-all ${
            confirmLogout ? "bg-danger text-white" : "text-tertiary hover:text-danger"
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
