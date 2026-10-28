"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Cpu, ShieldCheck, CandlestickChart, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ASSET_METADATA } from "@/lib/opencex/seed";

const COINS = ["BTC", "ETH", "SOL", "USDT", "BNB", "XRP", "ARB", "OP"];

interface Slide {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  visual: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "Matching Engine",
    title: "Rust-grade performance,\nin your browser.",
    description:
      "A faithful TypeScript reimplementation of the production Rust matching engine — price-time priority, all 5 order types (LIMIT, MARKET, IOC, FOK, POST_ONLY), sub-millisecond order processing.",
    icon: Cpu,
    accent: "from-orange-400 to-red-500",
    visual: <EngineVisual />,
  },
  {
    eyebrow: "Hybrid Custody",
    title: "Multi-chain wallet,\nyou stay in control.",
    description:
      "Deposits and withdrawals across 10 chains — Bitcoin, Ethereum, Solana, TON, Tron and more. HSM-backed hot wallet, optional MPC, address whitelisting with 24h time-locks, and hybrid mode where the user signs.",
    icon: ShieldCheck,
    accent: "from-emerald-400 to-cyan-500",
    visual: <CoinsVisual />,
  },
  {
    eyebrow: "Pro CLOB Terminal",
    title: "Trade like a pro,\nanywhere you are.",
    description:
      "Live order book, real-time trade tape, candlestick chart with multiple timeframes, deep order types — plus a mobile-optimized experience with bottom-sheet order entry and tabbed views.",
    icon: CandlestickChart,
    accent: "from-purple-400 to-pink-500",
    visual: <TerminalVisual />,
  },
];

export function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const next = () => (isLast ? onComplete() : setIndex((i) => i + 1));
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background mesh */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.4 0.008 250) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.4 0.008 250) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Skip button */}
      <button
        onClick={onComplete}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 text-xs text-secondary hover:text-foreground px-3 py-1.5 rounded-md hover:bg-elevated/70 transition-colors"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="w-full max-w-5xl">
          {/* Slide content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
            >
              {/* Left: text */}
              <div className="order-2 md:order-1 text-center md:text-left">
                <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                  <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${slide.accent} flex items-center justify-center`}>
                    <slide.icon className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-medium">
                    {slide.eyebrow}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight whitespace-pre-line">
                  {slide.title}
                </h2>
                <p className="mt-4 text-sm md:text-base text-secondary leading-relaxed max-w-md mx-auto md:mx-0">
                  {slide.description}
                </p>
              </div>

              {/* Right: visual */}
              <div className="order-1 md:order-2 relative h-64 md:h-80 flex items-center justify-center">
                {slide.visual}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom: progress dots + nav */}
      <div className="relative px-6 pb-8 md:pb-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-primary" : "w-1.5 bg-elevated-foreground/40 hover:bg-elevated-foreground/70"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={prev}
                className="p-2 rounded-md text-secondary hover:text-foreground hover:bg-elevated/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <Button
              variant="primary"
              size="md"
              pill
              onClick={next}
              className="gap-2 px-6"
            >
              <span>{isLast ? "Get started" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Visuals ---------- */

function EngineVisual() {
  // Animated order book with random flashing trades
  return (
    <div className="w-full max-w-xs bg-card border border-border rounded-lg p-3 shadow-2xl">
      <div className="flex justify-between text-[10px] text-secondary mb-2">
        <span>BTC/USDT</span>
        <span className="text-primary">LIVE</span>
      </div>
      <div className="space-y-0.5">
        {[
          { p: 67310.2, q: 0.45, side: "ask" },
          { p: 67300.1, q: 0.32, side: "ask" },
          { p: 67290.0, q: 1.18, side: "ask" },
        ].map((l, i) => (
          <motion.div
            key={`a${i}`}
            className="relative grid grid-cols-2 text-xs px-2 py-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="absolute inset-y-0 right-0 bg-danger/10" style={{ width: `${l.q * 60}%` }} />
            <span className="relative text-danger tabular">{l.p.toFixed(1)}</span>
            <span className="relative text-right tabular text-secondary">{l.q.toFixed(2)}</span>
          </motion.div>
        ))}
        <div className="my-1 py-1 border-y border-border text-center text-sm font-bold tabular text-primary">
          67,285.50
        </div>
        {[
          { p: 67280.5, q: 0.78, side: "bid" },
          { p: 67270.3, q: 0.55, side: "bid" },
          { p: 67260.0, q: 1.42, side: "bid" },
        ].map((l, i) => (
          <motion.div
            key={`b${i}`}
            className="relative grid grid-cols-2 text-xs px-2 py-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <div className="absolute inset-y-0 right-0 bg-primary/10" style={{ width: `${l.q * 60}%` }} />
            <span className="relative text-primary tabular">{l.p.toFixed(1)}</span>
            <span className="relative text-right tabular text-secondary">{l.q.toFixed(2)}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-2 flex justify-center"
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-[9px] text-secondary">⚡ p99 latency &lt; 500µs</span>
      </motion.div>
    </div>
  );
}

function CoinsVisual() {
  // Floating coin grid with subtle motion
  return (
    <div className="relative w-full max-w-sm">
      <div className="grid grid-cols-4 gap-3">
        {COINS.map((c, i) => {
          const meta = ASSET_METADATA[c];
          return (
            <motion.div
              key={c}
              className="aspect-square rounded-xl border border-border bg-card flex flex-col items-center justify-center gap-1"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.08, y: -4 }}
            >
              <motion.div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: meta?.color ?? "#666" }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
              >
                {c.slice(0, 2)}
              </motion.div>
              <span className="text-[10px] font-medium">{c}</span>
            </motion.div>
          );
        })}
      </div>
      {/* Chain labels */}
      <motion.div
        className="mt-4 flex flex-wrap gap-1.5 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {["Bitcoin", "Ethereum", "Solana", "TON", "Tron", "Arbitrum"].map((c) => (
          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-elevated/60 text-secondary border border-border/40">
            {c}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function TerminalVisual() {
  // Stylized candlestick chart with animated last price line
  const candles = [
    { o: 100, c: 104, h: 105, l: 99 },
    { o: 104, c: 102, h: 106, l: 101 },
    { o: 102, c: 108, h: 109, l: 101 },
    { o: 108, c: 106, h: 110, l: 105 },
    { o: 106, c: 112, h: 113, l: 105 },
    { o: 112, c: 110, h: 114, l: 109 },
    { o: 110, c: 116, h: 117, l: 109 },
    { o: 116, c: 114, h: 118, l: 113 },
  ];
  const max = Math.max(...candles.map((c) => c.h));
  const min = Math.min(...candles.map((c) => c.l));
  const range = max - min || 1;

  return (
    <div className="w-full max-w-sm bg-card border border-border rounded-lg p-3 shadow-2xl">
      <div className="flex justify-between text-[10px] text-secondary mb-2">
        <span>BTC/USDT · 1m</span>
        <span className="text-primary">+3.09%</span>
      </div>
      <div className="relative h-32 flex items-end gap-1 px-1">
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? "oklch(0.72 0.18 152)" : "oklch(0.66 0.22 22)";
          const top = ((max - c.h) / range) * 100;
          const height = ((c.h - c.l) / range) * 100;
          const bodyTop = ((max - Math.max(c.o, c.c)) / range) * 100;
          const bodyHeight = (Math.abs(c.c - c.o) / range) * 100;
          return (
            <motion.div
              key={i}
              className="relative flex-1"
              style={{ height: `${100 - top}%`, marginTop: `${top}%` }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="absolute inset-0 flex flex-col justify-end">
                <div
                  className="w-1 mx-auto"
                  style={{ height: `${height}%`, background: color, marginTop: `${((c.h - Math.max(c.o, c.c)) / range) * 100 * -1}%` }}
                />
                <div
                  className="w-full"
                  style={{
                    height: `${bodyHeight}%`,
                    background: color,
                    marginTop: 0,
                    opacity: 0.9,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
        {/* Animated price line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-primary"
          style={{ bottom: "30%" }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
        <div className="px-2 py-1 rounded bg-primary/15 text-primary text-center">BUY 0.05 BTC</div>
        <div className="px-2 py-1 rounded bg-danger/15 text-danger text-center">SELL 0.05 BTC</div>
      </div>
    </div>
  );
}
