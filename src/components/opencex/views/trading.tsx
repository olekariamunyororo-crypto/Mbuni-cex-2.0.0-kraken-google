"use client";

import React, { useState } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { useBinanceFeed } from "@/lib/opencex/use-binance-feed";
import { OrderBook } from "@/components/opencex/order-book";
import { TradeTape } from "@/components/opencex/trade-tape";
import { PriceChart } from "@/components/opencex/price-chart";
import { OrderTicket } from "@/components/ui/OrderTicket";
import { OpenOrders } from "@/components/opencex/open-orders";
import { PairSelector } from "@/components/opencex/pair-selector";
import { MobileOrderSheet } from "@/components/opencex/mobile-order-sheet";
import { AIInsightCard } from "@/components/ui/AIInsightCard";
import { SegmentedControl } from "@/components/ui/controls";
import { fmtPrice, fmtPct, fmtCompact } from "@/lib/opencex/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ListOrdered, Receipt, Sliders, ArrowLeftRight } from "lucide-react";
import { BalanceHero } from "@/components/ui/BalanceHero";
import { CategoryCards } from "@/components/ui/CategoryCards";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MobileTab = "book" | "trade" | "trades" | "orders";
type MidTab = "book" | "trades";
type DensityMode = "simple" | "pro";

export function TradingView() {
  useBinanceFeed();

  const activePair = useOpenCEX((s) => s.activePair);
  const ticker = useOpenCEX((s) => s.tickers[activePair]);
  const balances = useOpenCEX((s) => s.balances);
  const totalUSD = balances.reduce((s, b) => s + b.usdValue, 0);
  const [showOpen, setShowOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("book");
  const [midTab, setMidTab] = useState<MidTab>("book");
  const [density, setDensity] = useState<DensityMode>("simple");

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-hidden">
      {/* Top Bar: Pair Selector + Ticker Summary + Density Mode Switch */}
      <div className="px-3 md:px-5 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <PairSelector />
          {ticker && (
            <div className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs overflow-x-auto no-scrollbar shrink-0">
              <Stat label="Last Price" value={`$${fmtPrice(ticker.lastPrice, 2)}`} />
              <Stat
                label="24h Change"
                value={`${fmtPrice(ticker.priceChange, 2)} (${fmtPct(ticker.priceChangePct)})`}
                tone={ticker.priceChangePct >= 0 ? "up" : "down"}
              />
              <Stat label="24h High" value={`$${fmtPrice(ticker.high, 2)}`} />
              <Stat label="24h Low" value={`$${fmtPrice(ticker.low, 2)}`} />
              <Stat label="24h Volume" value={fmtCompact(ticker.volume)} suffix={activePair.split("/")[0]} />
              <Stat label="Quote Volume" value={`$${fmtCompact(ticker.quoteVolume)}`} />
            </div>
          )}
        </div>

        {/* Right: Density Toggle (Simple / Pro) */}
        <div className="flex items-center gap-2">
          <div className="w-36">
            <SegmentedControl<DensityMode>
              size="sm"
              value={density}
              onChange={setDensity}
              options={[
                { value: "simple", label: "Simple" },
                { value: "pro", label: "Pro" },
              ]}
            />
          </div>
          {density === "pro" && (
            <button
              type="button"
              onClick={() => setShowOpen(!showOpen)}
              className="hidden lg:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg text-tertiary hover:text-white bg-surface/50 border border-white/5 transition-colors font-medium"
              title={showOpen ? "Collapse orders panel to maximize chart" : "Expand open orders table"}
            >
              {showOpen ? "Hide Orders (Full Chart)" : "Show Orders"}
            </button>
          )}
        </div>
      </div>

      {/* Mobile ticker strip */}
      {ticker && (
        <div className="lg:hidden px-3 py-1.5 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-divider/40">
          <Stat label="24h" value={fmtPct(ticker.priceChangePct)} tone={ticker.priceChangePct >= 0 ? "up" : "down"} compact />
          <Stat label="High" value={`$${fmtPrice(ticker.high, 2)}`} compact />
          <Stat label="Low" value={`$${fmtPrice(ticker.low, 2)}`} compact />
          <Stat label="Vol" value={`$${fmtCompact(ticker.quoteVolume)}`} compact />
        </div>
      )}

      {/* Mode 1: Simple Mode — Clean, Calm, Mobile-First */}
      {density === "simple" && (
        <div className="flex-1 overflow-y-auto px-3 md:px-5 py-3 max-w-2xl mx-auto w-full space-y-5 no-scrollbar pb-24 md:pb-8">
          {/* Section 6.9 Balance Hero */}
          <BalanceHero
            userName="Alex"
            totalUSD={totalUSD}
            change24hUSD={348.12}
            change24hPct={2.48}
            isVerified={true}
            onAddMoney={() => toast.info("Add Money", { description: "Select network & transfer crypto to your address" })}
            onBuyAssets={() => {
              const ticketEl = document.getElementById("order-ticket-section");
              if (ticketEl) ticketEl.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* Section 6.5 & Section 7 Category Discovery */}
          <div>
            <SectionHeader
              title="Explore Themes"
              subtitle="Curated 2026 market sectors & thematic rollups"
              actionText="View all"
              onAction={() => toast.info("Categories", { description: "Browsing all curated ecosystem sectors" })}
            />
            <CategoryCards
              onSelectCategory={(catId) => {
                if (catId === "layer2") useOpenCEX.getState().setActivePair("ARB/USDT");
                else if (catId === "defi") useOpenCEX.getState().setActivePair("ETH/USDT");
                else if (catId === "memes") useOpenCEX.getState().setActivePair("SOL/USDT");
                else useOpenCEX.getState().setActivePair("BTC/USDT");
                toast.success("Pair switched", { description: `Active market updated for ${catId.toUpperCase()}` });
              }}
            />
          </div>

          {/* AI Quiet Co-pilot */}
          <AIInsightCard
            title="AI Market Intelligence"
            insight={`Order flow on ${activePair} shows healthy bid-side support near $${fmtPrice(
              (ticker?.lastPrice ?? 100) * 0.985,
              2
            )}. High liquidity depth with 0.1% spread.`}
            accent="lime"
          />

          {/* Clean Price Chart */}
          <div>
            <SectionHeader
              title={`${activePair} Spot Chart`}
              subtitle={`Live Price-Time book feed · 24h Vol $${fmtCompact(ticker?.quoteVolume ?? 0)}`}
            />
            <div className="glass-raised rounded-3xl p-4 overflow-hidden border border-[var(--color-glass-border)]">
              <div className="h-[340px]">
                <PriceChart pair={activePair} />
              </div>
            </div>
          </div>

          {/* Full-Length Order Book & Depth Ladder */}
          <div>
            <SectionHeader
              title={`${activePair} Order Book & Depth`}
              subtitle="Full-length live order book depth with price-time priority"
            />
            <div className="glass-raised rounded-3xl overflow-hidden border border-[var(--color-glass-border)] h-[620px] flex flex-col shadow-xl">
              <OrderBook pair={activePair} fullLength />
            </div>
          </div>

          {/* Focused Order Ticket */}
          <div id="order-ticket-section">
            <SectionHeader
              title="Order Entry"
              subtitle="Instant limit or market submission on matching engine"
            />
            <OrderTicket pair={activePair} mode="compact" />
          </div>

          {/* Recent Orders */}
          <div>
            <SectionHeader
              title="Open Orders & Activity"
              subtitle="Active resting limits on order book"
            />
            <div className="glass rounded-3xl p-4 border border-[var(--color-glass-border)]">
              <OpenOrders pair={activePair} />
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Pro Mode — High Performance CLOB Terminal */}
      {density === "pro" && (
        <>
          {/* Tier 1: Large Desktop Layout (>= 1280px / xl) — 3-Column Institutional CLOB Terminal */}
          <div className="hidden xl:grid xl:grid-cols-12 flex-1 gap-2.5 px-3 md:px-4 pb-2.5 min-h-0 overflow-hidden h-full">
            {/* Left: Order Book Depth Ladder — Full Length */}
            <div className="col-span-3 glass-pro rounded-2xl overflow-hidden border border-[var(--color-glass-border)] shadow-xl h-full flex flex-col min-h-0">
              <OrderBook pair={activePair} fullLength />
            </div>

            {/* Center: Chart + Open Orders (Chart is Full Length when orders collapsed) */}
            <div className="col-span-6 glass-raised rounded-2xl flex flex-col overflow-hidden border border-[var(--color-glass-border)] shadow-xl h-full min-h-0">
              <div className="flex-1 min-h-0 h-full">
                <PriceChart pair={activePair} />
              </div>
              {showOpen && (
                <div className="h-56 border-t border-divider overflow-hidden shrink-0">
                  <OpenOrders pair={activePair} />
                </div>
              )}
            </div>

            {/* Right: Trade Tape + Order Entry */}
            <div className="col-span-3 flex flex-col gap-2.5 overflow-hidden h-full min-h-0">
              <div className="h-1/2 glass-raised rounded-2xl overflow-hidden border border-[var(--color-glass-border)] shadow-xl min-h-0">
                <TradeTape pair={activePair} />
              </div>
              <div className="h-1/2 overflow-y-auto no-scrollbar glass-raised rounded-2xl border border-[var(--color-glass-border)] shadow-xl min-h-0">
                <OrderTicket pair={activePair} mode="pro" className="h-full" />
              </div>
            </div>
          </div>

          {/* Tier 2: Laptop / Tablet Layout (1024px to 1279px / lg) — 2-Column Responsive CLOB Layout */}
          <div className="hidden lg:grid xl:hidden lg:grid-cols-12 flex-1 gap-2.5 px-3 md:px-4 pb-2.5 min-h-0 overflow-hidden h-full">
            {/* Left: Chart + Optional Open Orders */}
            <div className="col-span-7 glass-raised rounded-2xl flex flex-col overflow-hidden border border-[var(--color-glass-border)] shadow-xl h-full min-h-0">
              <div className="flex-1 min-h-0 h-full">
                <PriceChart pair={activePair} />
              </div>
              {showOpen && (
                <div className="h-52 border-t border-divider overflow-hidden shrink-0">
                  <OpenOrders pair={activePair} />
                </div>
              )}
            </div>

            {/* Right: Order Book & Trades Tabbed on Top, Order Ticket on Bottom */}
            <div className="col-span-5 flex flex-col gap-2.5 overflow-hidden h-full min-h-0">
              {/* Top: Switchable Book / Trades */}
              <div className="h-[52%] glass-pro rounded-2xl overflow-hidden border border-[var(--color-glass-border)] shadow-xl min-h-0 flex flex-col">
                <Tabs value={midTab} onValueChange={(v) => setMidTab(v as MidTab)} className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-2 rounded-none border-b border-divider h-9 bg-surface/50 shrink-0">
                    <TabsTrigger value="book" className="text-xs font-semibold data-[state=active]:text-primary">
                      Order Book
                    </TabsTrigger>
                    <TabsTrigger value="trades" className="text-xs font-semibold data-[state=active]:text-primary">
                      Recent Trades
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="book" className="flex-1 mt-0 overflow-hidden min-h-0 flex flex-col">
                    <OrderBook pair={activePair} fullLength />
                  </TabsContent>
                  <TabsContent value="trades" className="flex-1 mt-0 overflow-hidden min-h-0">
                    <TradeTape pair={activePair} />
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bottom: Pro Order Ticket */}
              <div className="h-[48%] overflow-y-auto no-scrollbar glass-raised rounded-2xl border border-[var(--color-glass-border)] shadow-xl min-h-0">
                <OrderTicket pair={activePair} mode="pro" className="h-full" />
              </div>
            </div>
          </div>

          {/* Tier 3: Mobile & Tablet Layout (< 1024px / < lg) — Stacked Responsive Workspace */}
          <div className="lg:hidden flex-1 flex flex-col min-h-0 px-2 sm:px-3 pb-2 space-y-2 overflow-hidden">
            <div className="h-[36vh] min-h-[220px] max-h-[320px] glass-raised rounded-2xl overflow-hidden border border-[var(--color-glass-border)] shrink-0">
              <PriceChart pair={activePair} />
            </div>
            <div className="flex-1 glass-raised rounded-2xl overflow-hidden border border-[var(--color-glass-border)] min-h-0 flex flex-col pb-20 md:pb-0">
              <Tabs
                value={mobileTab}
                onValueChange={(v) => setMobileTab(v as MobileTab)}
                className="h-full flex flex-col"
              >
                <TabsList className="grid grid-cols-4 rounded-none border-b border-divider h-10 bg-surface/50 shrink-0">
                  <TabsTrigger value="book" className="text-xs gap-1 data-[state=active]:text-primary font-semibold">
                    <BookOpen className="w-3.5 h-3.5" /> Book
                  </TabsTrigger>
                  <TabsTrigger value="trade" className="text-xs gap-1 data-[state=active]:text-primary font-semibold">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Trade
                  </TabsTrigger>
                  <TabsTrigger value="trades" className="text-xs gap-1 data-[state=active]:text-primary font-semibold">
                    <Receipt className="w-3.5 h-3.5" /> Trades
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs gap-1 data-[state=active]:text-primary font-semibold">
                    <ListOrdered className="w-3.5 h-3.5" /> Orders
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="book" className="flex-1 mt-0 overflow-hidden min-h-0 flex flex-col">
                  <OrderBook pair={activePair} fullLength />
                </TabsContent>
                <TabsContent value="trade" className="flex-1 mt-0 overflow-y-auto no-scrollbar min-h-0 p-2 sm:p-3">
                  <OrderTicket pair={activePair} mode="compact" />
                </TabsContent>
                <TabsContent value="trades" className="flex-1 mt-0 overflow-hidden min-h-0">
                  <TradeTape pair={activePair} />
                </TabsContent>
                <TabsContent value="orders" className="flex-1 mt-0 overflow-hidden min-h-0">
                  <OpenOrders pair={activePair} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}

      {/* Floating Mobile Bottom Sheet (for mobile quick order submission in Pro mode when not on trade tab) */}
      {density === "pro" && mobileTab !== "trade" && <MobileOrderSheet pair={activePair} />}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  suffix,
  compact,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
  suffix?: string;
  compact?: boolean;
}) {
  const color =
    tone === "up" ? "text-primary" : tone === "down" ? "text-danger" : "text-white";
  return (
    <div className={`flex ${compact ? "flex-row items-baseline gap-1.5" : "flex-col"} leading-tight shrink-0 min-w-0`}>
      <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium whitespace-nowrap">{label}</span>
      <span className={`text-xs font-semibold tnum ${color} whitespace-nowrap`}>
        {value}
        {suffix && <span className="text-tertiary font-normal ml-1">{suffix}</span>}
      </span>
    </div>
  );
}
