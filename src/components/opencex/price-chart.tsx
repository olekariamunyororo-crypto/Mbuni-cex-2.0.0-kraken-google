"use client";

import { useMemo, useState } from "react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtCompact, fmtTime } from "@/lib/opencex/format";
import type { Kline } from "@/lib/opencex/types";

const TIMEFRAMES = [
  { label: "1m", minutes: 1 },
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "1h", minutes: 60 },
  { label: "4h", minutes: 240 },
];

const EMPTY_KLINES: Kline[] = [];

export function PriceChart({ pair }: { pair: string }) {
  const klines = useOpenCEX((s) => s.klines[pair]) ?? EMPTY_KLINES;
  const book = useOpenCEX((s) => s.books[pair]);
  const p = useOpenCEX((s) => s.pairs.find((x) => x.symbol === pair));
  const [tf, setTf] = useState(1);
  const [hover, setHover] = useState<Kline | null>(null);

  const aggregated = useMemo(() => {
    if (!klines.length) return [];
    const factor = tf;
    const out: Kline[] = [];
    for (let i = 0; i < klines.length; i += factor) {
      const chunk = klines.slice(i, i + factor);
      if (!chunk.length) continue;
      out.push({
        openTime: chunk[0].openTime,
        open: chunk[0].open,
        high: Math.max(...chunk.map((c) => c.high)),
        low: Math.min(...chunk.map((c) => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((s, c) => s + c.volume, 0),
      });
    }
    return out;
  }, [klines, tf]);

  if (!p) return null;

  const display = hover ?? aggregated[aggregated.length - 1] ?? null;
  const lastPrice = book?.lastPrice ?? display?.close ?? 0;
  const firstPrice = aggregated[0]?.open ?? lastPrice;
  const changePct = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const up = changePct >= 0;

  // Chart geometry
  const W = 800;
  const H = 360;
  const volH = 60;
  const priceH = H - volH - 20;
  const padL = 8;
  const padR = 70;
  const padB = 18;
  const chartW = W - padL - padR;
  const chartH = priceH - padB;
  const minPrice = aggregated.length ? Math.min(...aggregated.map((k) => k.low)) : 0;
  const maxPrice = aggregated.length ? Math.max(...aggregated.map((k) => k.high)) : 1;
  const priceRange = (maxPrice - minPrice) || 1;
  const maxVol = aggregated.length ? Math.max(...aggregated.map((k) => k.volume), 1) : 1;

  const xFor = (i: number) => padL + (aggregated.length <= 1 ? chartW / 2 : (i / (aggregated.length - 1)) * chartW);
  const yFor = (price: number) => {
    if (!Number.isFinite(price) || !Number.isFinite(minPrice) || !Number.isFinite(priceRange) || priceRange === 0) return padB + chartH / 2;
    return padB + (1 - (price - minPrice) / priceRange) * chartH;
  };
  const candleW = aggregated.length ? Math.max(2, (chartW / aggregated.length) * 0.7) : 2;

  // Grid lines + Y axis labels
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const v = minPrice + (priceRange * i) / 4;
    return { y: yFor(v), v };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 md:px-3 py-2 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary shrink-0">{p.symbol}</span>
          {/* Compact change indicator — mobile only */}
          <span className={`md:hidden px-1.5 py-0.5 rounded text-[10px] ${up ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"}`}>
            {up ? "+" : ""}{changePct.toFixed(2)}%
          </span>
          {/* Full OHLC — desktop only */}
          <div className="hidden md:flex items-center gap-1 text-xs tabular">
            <span className="text-secondary">O</span>
            <span className={up ? "text-primary" : "text-danger"}>{fmtPrice(display?.open, p.priceDecimals)}</span>
            <span className="text-secondary ml-1">H</span>
            <span className={up ? "text-primary" : "text-danger"}>{fmtPrice(display?.high, p.priceDecimals)}</span>
            <span className="text-secondary ml-1">L</span>
            <span className={up ? "text-primary" : "text-danger"}>{fmtPrice(display?.low, p.priceDecimals)}</span>
            <span className="text-secondary ml-1">C</span>
            <span className={up ? "text-primary" : "text-danger"}>{fmtPrice(display?.close ?? lastPrice, p.priceDecimals)}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${up ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"}`}>
              {up ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.label}
              onClick={() => setTf(t.minutes)}
              className={`px-2 py-0.5 text-[11px] rounded ${
                tf === t.minutes ? "bg-elevated text-foreground" : "text-secondary hover:bg-elevated/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full"
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * W;
            const idx = Math.floor(((x - padL) / chartW) * aggregated.length);
            const k = aggregated[idx];
            if (k) setHover(k);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {/* grid */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={padL + chartW} y2={g.y} stroke="oklch(0.30 0.008 250)" strokeDasharray="2 3" />
              <text x={padL + chartW + 4} y={g.y + 3} fill="oklch(0.68 0.008 250)" fontSize="10" className="tabular">
                {fmtPrice(g.v, p.priceDecimals)}
              </text>
            </g>
          ))}

          {/* candles */}
          {aggregated.map((k, i) => {
            const x = xFor(i);
            const isUp = k.close >= k.open;
            const color = isUp ? "oklch(0.72 0.18 152)" : "oklch(0.66 0.22 22)";
            const yOpen = yFor(k.open);
            const yClose = yFor(k.close);
            const yHigh = yFor(k.high);
            const yLow = yFor(k.low);
            const top = Math.min(yOpen, yClose);
            const h = Math.max(1, Math.abs(yClose - yOpen));
            return (
              <g key={i}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" />
                <rect x={x - candleW / 2} y={top} width={candleW} height={h} fill={color} opacity={0.9} />
                {/* volume bar */}
                <rect
                  x={x - candleW / 2}
                  y={priceH + (1 - k.volume / maxVol) * volH}
                  width={candleW}
                  height={(k.volume / maxVol) * volH}
                  fill={color}
                  opacity={0.3}
                />
              </g>
            );
          })}

          {/* last price line */}
          <line
            x1={padL}
            y1={yFor(lastPrice)}
            x2={padL + chartW}
            y2={yFor(lastPrice)}
            stroke={up ? "oklch(0.72 0.18 152)" : "oklch(0.66 0.22 22)"}
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <rect
            x={padL + chartW}
            y={yFor(lastPrice) - 8}
            width={padR}
            height={16}
            fill={up ? "oklch(0.72 0.18 152)" : "oklch(0.66 0.22 22)"}
          />
          <text
            x={padL + chartW + 4}
            y={yFor(lastPrice) + 3}
            fill="#000"
            fontSize="10"
            fontWeight="600"
            className="tabular"
          >
            {fmtPrice(lastPrice, p.priceDecimals)}
          </text>

          {/* time axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const idx = Math.floor(t * (aggregated.length - 1));
            const k = aggregated[idx];
            if (!k) return null;
            return (
              <text key={t} x={xFor(idx)} y={H - 4} fill="oklch(0.68 0.008 250)" fontSize="9" className="tabular" textAnchor="middle">
                {fmtTime(k.openTime)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="px-2 md:px-3 py-1 border-t border-border flex items-center justify-between text-[10px] text-secondary">
        <span>Vol: <span className="tabular text-foreground">{fmtCompact(aggregated.reduce((s, k) => s + k.volume, 0))} {p.base}</span></span>
        <span className="hidden sm:inline">{aggregated.length} candles · {hover ? "Hover: " + fmtTime(hover.openTime) : "LIVE · BINANCE"}</span>
        <span className="sm:hidden">{hover ? fmtTime(hover.openTime) : "LIVE"}</span>
      </div>
    </div>
  );
}
