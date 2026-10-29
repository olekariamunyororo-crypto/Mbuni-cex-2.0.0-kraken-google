"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  TickMarkType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import { ChevronsRight } from "lucide-react";
import { useOpenCEX } from "@/lib/opencex/store";
import { fmtPrice, fmtCompact } from "@/lib/opencex/format";
import { aggregateKlines } from "@/lib/opencex/klines";
import type { Kline } from "@/lib/opencex/types";

const TIMEFRAMES = [
  { label: "1m", minutes: 1 },
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "1h", minutes: 60 },
  { label: "4h", minutes: 240 },
];

const EMPTY_KLINES: Kline[] = [];

// Design-system colours (lime = up, red = down)
const UP = "#a3e635";
const DOWN = "#ff5c5c";
const UP_VOL = "rgba(163,230,53,0.35)";
const DOWN_VOL = "rgba(255,92,92,0.35)";
const GRID = "rgba(255,255,255,0.06)";
const TEXT = "#9ca3af";
const INITIAL_VISIBLE = 100; // candles shown on load — scroll/zoom for more

const toCandle = (k: Kline): CandlestickData<UTCTimestamp> => ({
  time: Math.floor(k.openTime / 1000) as UTCTimestamp,
  open: k.open, high: k.high, low: k.low, close: k.close,
});
const toVolume = (k: Kline): HistogramData<UTCTimestamp> => ({
  time: Math.floor(k.openTime / 1000) as UTCTimestamp,
  value: k.volume,
  color: k.close >= k.open ? UP_VOL : DOWN_VOL,
});

/** Ensure candles are strictly sorted ascending by timestamp without any duplicate times. */
function prepareSeriesData(klines: Kline[]) {
  const candles: CandlestickData<UTCTimestamp>[] = [];
  const volumes: HistogramData<UTCTimestamp>[] = [];
  let lastTime = -1;

  for (const k of klines) {
    const time = Math.floor(k.openTime / 1000) as UTCTimestamp;
    if (time <= lastTime) {
      if (time === lastTime && candles.length > 0) {
        candles[candles.length - 1] = toCandle(k);
        volumes[volumes.length - 1] = toVolume(k);
      }
      continue;
    }
    candles.push(toCandle(k));
    volumes.push(toVolume(k));
    lastTime = time;
  }

  return { candles, volumes };
}

/** Lightweight Charts is UTC-only by default; format axis/crosshair labels in the user's local time. */
const pad2 = (n: number) => String(n).padStart(2, "0");
function localTick(time: Time, type: TickMarkType): string {
  const d = new Date((time as number) * 1000);
  if (type === TickMarkType.Year) return String(d.getFullYear());
  if (type === TickMarkType.Month) return d.toLocaleString("en-US", { month: "short" });
  if (type === TickMarkType.DayOfMonth) return String(d.getDate());
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function localCrosshairTime(time: Time): string {
  const d = new Date((time as number) * 1000);
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}  ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function PriceChart({ pair }: { pair: string }) {
  const klines = useOpenCEX((s) => s.klines[pair]) ?? EMPTY_KLINES;
  const book = useOpenCEX((s) => s.books[pair]);
  const p = useOpenCEX((s) => s.pairs.find((x) => x.symbol === pair));
  const liveMode = useOpenCEX((s) => s.liveMode);
  const feedConnected = useOpenCEX((s) => s.feedConnected);
  const [tf, setTf] = useState(1);
  const [hover, setHover] = useState<Kline | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const loadedRef = useRef<{ key: string; first: number; len: number } | null>(null);
  const byTimeRef = useRef<Map<number, Kline>>(new Map());

  const aggregated = useMemo(() => aggregateKlines(klines, tf), [klines, tf]);
  const decimals = p?.priceDecimals ?? 2;

  // ── create the chart once ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: TEXT, fontSize: 11 },
      grid: { vertLines: { color: GRID }, horzLines: { color: GRID } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)", scaleMargins: { top: 0.06, bottom: 0.22 } },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false, rightOffset: 6, tickMarkFormatter: localTick },
      localization: { timeFormatter: localCrosshairTime },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    });
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
      priceLineVisible: true, lastValueVisible: true,
    });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", lastValueVisible: false, priceLineVisible: false });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) { setHover(null); return; }
      setHover(byTimeRef.current.get((param.time as number) * 1000) ?? null);
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;
    return () => {
      chart.remove();
      chartRef.current = candleRef.current = volumeRef.current = null;
      loadedRef.current = null;
    };
  }, []);

  // ── price precision follows the pair ──
  useEffect(() => {
    const minMove = Math.pow(10, -decimals);
    candleRef.current?.applyOptions({ priceFormat: { type: "price", precision: decimals, minMove } });
  }, [decimals]);

  // ── push data: full reset on pair/timeframe/history change, safe incremental update otherwise ──
  useEffect(() => {
    const candles = candleRef.current, volume = volumeRef.current, chart = chartRef.current;
    if (!candles || !volume || !chart || aggregated.length === 0) return;

    byTimeRef.current = new Map(aggregated.map((k) => [k.openTime, k]));
    const key = `${pair}|${tf}`;
    const prev = loadedRef.current;
    const first = aggregated[0].openTime;
    const isNewSeries = !prev || prev.key !== key;

    if (isNewSeries) {
      const { candles: candleData, volumes: volumeData } = prepareSeriesData(aggregated);
      candles.setData(candleData);
      volume.setData(volumeData);
      const n = candleData.length;
      chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - INITIAL_VISIBLE), to: n + 6 });
      loadedRef.current = { key, first, len: aggregated.length };
      return;
    }

    // If historical data arrived or series changed shape substantially
    if (prev.first !== first || aggregated.length < prev.len) {
      const { candles: candleData, volumes: volumeData } = prepareSeriesData(aggregated);
      candles.setData(candleData);
      volume.setData(volumeData);
      loadedRef.current = { key, first, len: aggregated.length };
      return;
    }

    // Incremental update:
    if (aggregated.length === prev.len) {
      // Normal tick within the active open candle: only the last candle changes
      try {
        const last = aggregated[aggregated.length - 1];
        candles.update(toCandle(last));
        volume.update(toVolume(last));
      } catch {
        const { candles: candleData, volumes: volumeData } = prepareSeriesData(aggregated);
        candles.setData(candleData);
        volume.setData(volumeData);
      }
    } else if (aggregated.length === prev.len + 1) {
      // Exactly one new candle opened (e.g. minute rollover)
      try {
        const prevCandle = aggregated[aggregated.length - 2];
        const lastCandle = aggregated[aggregated.length - 1];
        candles.update(toCandle(prevCandle));
        volume.update(toVolume(prevCandle));
        candles.update(toCandle(lastCandle));
        volume.update(toVolume(lastCandle));
      } catch {
        const { candles: candleData, volumes: volumeData } = prepareSeriesData(aggregated);
        candles.setData(candleData);
        volume.setData(volumeData);
      }
    } else {
      // More than 1 candle arrived (e.g. background tab resumed)
      const { candles: candleData, volumes: volumeData } = prepareSeriesData(aggregated);
      candles.setData(candleData);
      volume.setData(volumeData);
    }

    loadedRef.current = { key, first, len: aggregated.length };
  }, [aggregated, pair, tf]);

  if (!p) return null;

  const last = aggregated[aggregated.length - 1] ?? null;
  const display = hover ?? last;
  const lastPrice = book?.lastPrice ?? last?.close ?? 0;
  const firstPrice = aggregated[Math.max(0, aggregated.length - INITIAL_VISIBLE)]?.open ?? lastPrice;
  const changePct = firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const up = changePct >= 0;
  const ohlcUp = display ? display.close >= display.open : up;
  const status = !liveMode ? "SIMULATED" : feedConnected ? "LIVE · BINANCE" : "CONNECTING…";
  const tfLabel = TIMEFRAMES.find((t) => t.minutes === tf)?.label;

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 md:px-3 py-2 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary shrink-0">{p.symbol} · {tfLabel}</span>
          <span className={`md:hidden px-1.5 py-0.5 rounded text-[10px] ${up ? "bg-primary/15 text-primary" : "bg-danger/15 text-danger"}`}>
            {up ? "+" : ""}{changePct.toFixed(2)}%
          </span>
          <div className="hidden md:flex items-center gap-1 text-xs tabular">
            <span className="text-secondary">O</span>
            <span className={ohlcUp ? "text-primary" : "text-danger"}>{fmtPrice(display?.open, decimals)}</span>
            <span className="text-secondary ml-1">H</span>
            <span className={ohlcUp ? "text-primary" : "text-danger"}>{fmtPrice(display?.high, decimals)}</span>
            <span className="text-secondary ml-1">L</span>
            <span className={ohlcUp ? "text-primary" : "text-danger"}>{fmtPrice(display?.low, decimals)}</span>
            <span className="text-secondary ml-1">C</span>
            <span className={ohlcUp ? "text-primary" : "text-danger"}>{fmtPrice(display?.close ?? lastPrice, decimals)}</span>
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
              className={`px-2 py-0.5 text-[11px] rounded ${tf === t.minutes ? "bg-elevated text-foreground" : "text-secondary hover:bg-elevated/70"}`}
            >
              {t.label}
            </button>
          ))}
          <button
            title="Jump to latest candle"
            aria-label="Jump to latest candle"
            onClick={() => chartRef.current?.timeScale().scrollToRealTime()}
            className="ml-1 p-1 rounded text-secondary hover:bg-elevated/70"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-[160px]">
        <div ref={containerRef} className="absolute inset-0" />
        {aggregated.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-secondary pointer-events-none">Loading candles…</div>
        )}
      </div>

      <div className="px-2 md:px-3 py-1 border-t border-border flex items-center justify-between text-[10px] text-secondary">
        <span>Vol: <span className="tabular text-foreground">{fmtCompact(display?.volume ?? 0)} {p.base}</span></span>
        <span className="hidden sm:inline">{aggregated.length} × {tfLabel} candles · drag to pan · scroll to zoom · {status}</span>
        <span className="sm:hidden">{status}</span>
      </div>
    </div>
  );
}
