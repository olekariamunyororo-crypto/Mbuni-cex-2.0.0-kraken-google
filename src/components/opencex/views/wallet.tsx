"use client";

import { useOpenCEX } from "@/lib/opencex/store";
import { fmtQty, fmtUSD, fmtDateTime, shortAddr, shortHash } from "@/lib/opencex/format";
import { ASSET_METADATA, CHAINS } from "@/lib/opencex/seed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { AssetRow } from "@/components/ui/AssetRow";
import { AIInsightCard } from "@/components/ui/AIInsightCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DiscoverList, type DiscoverItem } from "@/components/ui/DiscoverList";
import { ArrowDownToLine, ArrowUpFromLine, Shield, Plus, Copy, Check, Lock, Send, ShieldCheck, Key, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Deposit, Withdrawal } from "@/lib/opencex/types";
import { cn } from "@/lib/utils";

export function WalletView() {
  const balances = useOpenCEX((s) => s.balances);
  const deposits = useOpenCEX((s) => s.deposits);
  const withdrawals = useOpenCEX((s) => s.withdrawals);
  const whitelist = useOpenCEX((s) => s.whitelist);
  const pairs = useOpenCEX((s) => s.pairs);

  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);
  const totalLocked = balances.reduce((s, b) => s + b.locked * (b.usdValue / (b.free + b.locked || 1)), 0);
  const availableUSD = Math.max(0, totalUSD - totalLocked);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      {/* Hero Portfolio Balance Card (Tempered Glass Raised) */}
      <div className="glass-raised rounded-3xl p-6 border border-[var(--color-glass-border)] glass-edge space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[12px] font-semibold text-tertiary uppercase tracking-wider">
              Total Estimated Portfolio
            </div>
            <div className="text-[36px] font-bold tracking-tight text-white tnum mt-1">
              {fmtUSD(totalUSD)}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[13px]">
              <span className="text-primary font-semibold tnum">+2.48% (+$348.12)</span>
              <span className="text-tertiary">·</span>
              <span className="text-secondary">Past 24 hours</span>
            </div>
          </div>

          {/* Quick Action Buttons (52px / 44px primary controls with Purple CTA) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="primary"
              size="md"
              icon={<ArrowDownToLine className="w-4 h-4" />}
              onClick={() => toast.info("Deposit initiated", { description: "Select network & copy destination address below" })}
            >
              Deposit
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<ArrowUpFromLine className="w-4 h-4" />}
              onClick={() => toast.info("Withdraw initiated", { description: "24h whitelisted timelock address check active" })}
            >
              Withdraw
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<Send className="w-4 h-4" />}
              onClick={() => toast.info("Internal Transfer", { description: "Instant 0-fee transfer to another Mbuni UID" })}
            >
              Transfer
            </Button>
          </div>
        </div>

        {/* Breakdown pill row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-divider">
          <div className="p-3 rounded-2xl bg-surface/50 border border-white/5">
            <div className="text-[11px] text-tertiary font-semibold uppercase tracking-wider">Available</div>
            <div className="text-[17px] font-bold text-white tnum mt-0.5">{fmtUSD(availableUSD)}</div>
            <div className="text-[11px] text-secondary mt-0.5">Ready for order book</div>
          </div>
          <div className="p-3 rounded-2xl bg-surface/50 border border-white/5">
            <div className="text-[11px] text-tertiary font-semibold uppercase tracking-wider">Locked in Orders</div>
            <div className="text-[17px] font-bold text-gold tnum mt-0.5">{fmtUSD(totalLocked)}</div>
            <div className="text-[11px] text-secondary mt-0.5">{balances.filter((b) => b.locked > 0).length} active limit orders</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-surface/50 border border-white/5">
            <div className="text-[11px] text-tertiary font-semibold uppercase tracking-wider">Custody Level</div>
            <div className="text-[17px] font-bold text-white mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Hybrid HSM</span>
            </div>
            <div className="text-[11px] text-secondary mt-0.5">MPC + 24h Timelock</div>
          </div>
        </div>
      </div>

      {/* AI Co-pilot Insight */}
      <AIInsightCard
        title="Custody & Yield Insight"
        insight="Your USDT reserves are fully unencumbered. Multi-chain Bitcoin address whitelist is locked with 24-hour cool-down protection enabled."
        accent="lime"
      />

      {/* Tabs Section */}
      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList className="flex w-auto p-1 rounded-2xl bg-surface/70 border border-white/5 overflow-x-auto no-scrollbar">
          <TabsTrigger value="balances" className="px-5 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-elevated data-[state=active]:text-white">
            Asset Balances
          </TabsTrigger>
          <TabsTrigger value="deposits" className="px-5 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-elevated data-[state=active]:text-white">
            Deposit History
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="px-5 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-elevated data-[state=active]:text-white">
            Withdrawal Records
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="px-5 py-2 text-xs font-semibold rounded-xl data-[state=active]:bg-elevated data-[state=active]:text-white">
            Address Whitelist
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Balances */}
        <TabsContent value="balances" className="mt-0">
          <div className="glass-card rounded-3xl p-2 md:p-4 border border-[var(--color-glass-border)]">
            <div className="px-3 py-2 text-[12px] font-semibold text-tertiary uppercase tracking-wider">
              Cryptocurrency Assets
            </div>
            <div className="divide-y divide-divider/40">
              {balances.map((b) => {
                const meta = ASSET_METADATA[b.asset];
                return (
                  <AssetRow
                    key={b.asset}
                    symbol={b.asset}
                    name={meta?.name}
                    balance={b.free + b.locked}
                    usdValue={b.usdValue}
                    onClick={() =>
                      toast.info(`${b.asset} Wallet Details`, {
                        description: `Available: ${fmtQty(b.free, 4)} · Locked: ${fmtQty(b.locked, 4)}`,
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Deposits */}
        <TabsContent value="deposits" className="mt-0">
          <div className="glass-card rounded-3xl overflow-hidden border border-[var(--color-glass-border)]">
            <TxTable
              rows={deposits}
              columns={[
                { key: "timestamp", label: "Date & Time", render: (d: Deposit) => fmtDateTime(d.timestamp) },
                { key: "asset", label: "Asset", render: (d: Deposit) => <span className="font-semibold text-white">{d.asset}</span> },
                { key: "chain", label: "Network", render: (d: Deposit) => d.chain },
                { key: "amount", label: "Amount", right: true, render: (d: Deposit) => <span className="tnum font-semibold text-primary">+{fmtQty(d.amount, 6)} {d.asset}</span> },
                { key: "address", label: "Address", render: (d: Deposit) => <span className="font-mono text-[11px] text-secondary">{shortAddr(d.address)}</span> },
                { key: "txHash", label: "Transaction Hash", render: (d: Deposit) => <span className="font-mono text-[11px] text-tertiary">{shortHash(d.txHash)}</span> },
                { key: "confirmations", label: "Confs", right: true, render: (d: Deposit) => <span className="tnum">{d.confirmations}/{d.requiredConfirmations}</span> },
                { key: "status", label: "Status", render: (d: Deposit) => <StatusBadge status={d.status === "CREDITED" ? "success" : "warning"} label={d.status} /> },
              ]}
            />
          </div>
        </TabsContent>

        {/* Tab 3: Withdrawals */}
        <TabsContent value="withdrawals" className="mt-0">
          <div className="glass-card rounded-3xl overflow-hidden border border-[var(--color-glass-border)]">
            <TxTable
              rows={withdrawals}
              columns={[
                { key: "timestamp", label: "Date & Time", render: (w: Withdrawal) => fmtDateTime(w.timestamp) },
                { key: "asset", label: "Asset", render: (w: Withdrawal) => <span className="font-semibold text-white">{w.asset}</span> },
                { key: "chain", label: "Network", render: (w: Withdrawal) => w.chain },
                { key: "amount", label: "Amount", right: true, render: (w: Withdrawal) => <span className="tnum font-semibold text-white">-{fmtQty(w.amount, 6)} {w.asset}</span> },
                { key: "fee", label: "Network Fee", right: true, render: (w: Withdrawal) => <span className="tnum text-tertiary">{fmtQty(w.fee, 6)} {w.asset}</span> },
                { key: "address", label: "Destination", render: (w: Withdrawal) => <span className="font-mono text-[11px] text-secondary">{shortAddr(w.address)}</span> },
                { key: "txHash", label: "Tx Hash", render: (w: Withdrawal) => <span className="font-mono text-[11px] text-tertiary">{w.txHash ? shortHash(w.txHash) : "—"}</span> },
                { key: "status", label: "Status", render: (w: Withdrawal) => <StatusBadge status={w.status === "COMPLETED" ? "success" : w.status === "REJECTED" ? "danger" : "warning"} label={w.status} /> },
              ]}
            />
          </div>
        </TabsContent>

        {/* Tab 4: Whitelist */}
        <TabsContent value="whitelist" className="mt-0">
          <WhitelistPanel whitelist={whitelist} />
        </TabsContent>
      </Tabs>

      {/* Multi-Chain Support Grid */}
      <div className="glass-card rounded-3xl p-5 border border-[var(--color-glass-border)] space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-white">Supported Multi-Chain Custody Networks</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {CHAINS.map((c) => (
            <div key={c.id} className="p-3 rounded-2xl bg-surface/60 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-white">{c.name}</div>
              <div className="text-[11px] text-tertiary tnum">
                {c.confirmations} confs · {fmtUSD(c.withdrawalFeeUSD)} fee
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 6.10 Discover / Feature List */}
      <div>
        <SectionHeader
          title="Security & Institutional Custody"
          subtitle="Enterprise protection, HSM key sharding, and real-time transaction screening"
        />
        <DiscoverList
          items={[
            {
              id: "whitelist",
              title: "Address Whitelist & Timelock",
              description: "24-hour mandatory cool-down protection on all newly registered withdrawal addresses.",
              icon: ShieldCheck,
              iconColor: "#a3e635",
              badge: "Enforced",
              onClick: () => toast.success("Whitelist Enforced", { description: "All external withdrawals require 24h timelock" }),
            },
            {
              id: "mpc",
              title: "Threshold MPC Cold Vault",
              description: "3-of-5 distributed multi-party computation keys for institutional cold storage.",
              icon: Key,
              iconColor: "#7f66ff",
              badge: "Vault Active",
              onClick: () => toast.info("MPC Vault", { description: "HSM-backed threshold keys active" }),
            },
            {
              id: "kyt",
              title: "Real-Time KYT Screening",
              description: "Automated illicit transaction detection and Scorechain deposit risk scoring.",
              icon: ShieldAlert,
              iconColor: "#28a0f0",
              badge: "Scorechain",
              onClick: () => toast.info("KYT Screening", { description: "Zero high-risk deposits detected" }),
            },
          ]}
        />
      </div>
    </div>
  );
}

function WhitelistPanel({ whitelist }: { whitelist: ReturnType<typeof useOpenCEX.getState>["whitelist"] }) {
  const addWhitelist = useOpenCEX((s) => s.addWhitelist);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ asset: "BTC", chain: "Bitcoin", address: "", label: "" });

  return (
    <div className="glass-card rounded-3xl overflow-hidden border border-[var(--color-glass-border)]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-white">Whitelisted Withdrawal Addresses</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setAdding(!adding)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
        </Button>
      </div>

      {adding && (
        <div className="p-4 bg-surface/90 border-b border-divider grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={form.asset}
            onChange={(e) => setForm({ ...form, asset: e.target.value })}
            className="h-11 bg-elevated border border-white/10 rounded-xl px-3 text-xs text-white"
          >
            {Object.keys(ASSET_METADATA).map((a) => (
              <option key={a} value={a} className="bg-bg text-white">
                {a}
              </option>
            ))}
          </select>
          <select
            value={form.chain}
            onChange={(e) => setForm({ ...form, chain: e.target.value })}
            className="h-11 bg-elevated border border-white/10 rounded-xl px-3 text-xs text-white"
          >
            {CHAINS.map((c) => (
              <option key={c.id} value={c.name} className="bg-bg text-white">
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="0x... or bc1q..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="h-11 bg-elevated border border-white/10 rounded-xl px-3 text-xs md:col-span-2 text-white outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <input
              placeholder="Label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="flex-1 h-11 bg-elevated border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-primary"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (!form.address || !form.label) {
                  toast.error("Address and label required");
                  return;
                }
                addWhitelist(form);
                toast.success("Address added — 24h time-lock active");
                setAdding(false);
                setForm({ asset: "BTC", chain: "Bitcoin", address: "", label: "" });
              }}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto no-scrollbar">
        <div style={{ minWidth: "640px" }}>
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] uppercase tracking-wider text-secondary border-b border-divider font-semibold">
            <span className="col-span-2">Asset</span>
            <span className="col-span-2">Chain</span>
            <span className="col-span-4">Address</span>
            <span className="col-span-2">Label</span>
            <span className="col-span-1">Lock</span>
            <span className="col-span-1">Added</span>
          </div>
          <div className="divide-y divide-divider/40">
            {whitelist.map((w) => (
              <div
                key={w.id}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 text-xs items-center hover:bg-white/[0.03] transition-colors"
              >
                <span className="col-span-2 font-semibold text-white">{w.asset}</span>
                <span className="col-span-2 text-secondary">{w.chain}</span>
                <span className="col-span-4 font-mono text-[11px] text-tertiary">{shortAddr(w.address, 10, 8)}</span>
                <span className="col-span-2 text-secondary">{w.label}</span>
                <span className="col-span-1 text-gold font-semibold">{w.timeLockHours}h</span>
                <span className="col-span-1 text-tertiary text-[11px]">{new Date(w.addedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Column<T> {
  key: string;
  label: string;
  right?: boolean;
  render: (row: T) => React.ReactNode;
}

function TxTable<T extends { id: string; timestamp: number }>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  const minRowWidth = Math.max(columns.length * 110, 600);
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div style={{ minWidth: `${minRowWidth}px` }}>
        <div
          className="grid gap-2 px-5 py-3 text-[11px] uppercase tracking-wider text-secondary border-b border-divider font-semibold"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((c) => (
            <span key={c.key} className={c.right ? "text-right" : ""}>
              {c.label}
            </span>
          ))}
        </div>
        <div className="divide-y divide-divider/40">
          {rows.length === 0 && (
            <div className="px-5 py-10 text-center text-xs text-secondary">
              No transactions recorded yet
            </div>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-2 px-5 py-3.5 text-xs items-center hover:bg-white/[0.03] transition-colors"
              style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
              {columns.map((c) => (
                <span key={c.key} className={c.right ? "text-right" : ""}>
                  {c.render(row)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
