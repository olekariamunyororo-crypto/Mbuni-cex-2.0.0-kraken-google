import type { Meta, StoryObj } from "@storybook/react";
import {
  fmtPrice,
  fmtQty,
  fmtUSD,
  fmtCompact,
  fmtPct,
  fmtTime,
  fmtDateTime,
  shortAddr,
  shortHash,
} from "./format";

const meta = {
  title: "Mbuni CEX/Lib/Formatters",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "mbuni-card" },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-secondary">{label}</span>
      <span className="text-sm font-medium tabular text-foreground">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 min-w-[280px]">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary mb-3">{title}</h3>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

export const Prices: Story = {
  render: () => (
    <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background min-h-screen">
      <Card title="fmtPrice — typical values">
        <Row label="BTC (2 dec)" value={fmtPrice(67250.5, 2)} />
        <Row label="ETH (2 dec)" value={fmtPrice(3245.8, 2)} />
        <Row label="SOL (3 dec)" value={fmtPrice(178.42, 3)} />
        <Row label="XRP (4 dec)" value={fmtPrice(0.5234, 4)} />
        <Row label="DOGE (5 dec)" value={fmtPrice(0.12134, 5)} />
      </Card>
      <Card title="fmtPrice — edge cases">
        <Row label="null" value={fmtPrice(null, 2)} />
        <Row label="undefined" value={fmtPrice(undefined, 2)} />
        <Row label="NaN" value={fmtPrice(NaN, 2)} />
        <Row label="zero" value={fmtPrice(0, 2)} />
        <Row label="very small" value={fmtPrice(0.00001, 2)} />
        <Row label="large with commas" value={fmtPrice(1234567.89, 2)} />
      </Card>
      <Card title="fmtQty — typical values">
        <Row label="BTC qty (8 dec)" value={fmtQty(0.4521, 8)} />
        <Row label="ETH qty (6 dec)" value={fmtQty(42.18, 6)} />
        <Row label="SOL qty (2 dec)" value={fmtQty(380.5, 2)} />
        <Row label="large (with commas)" value={fmtQty(12500, 4)} />
        <Row label="null" value={fmtQty(null, 4)} />
      </Card>
    </div>
  ),
};

export const Money: Story = {
  render: () => (
    <div className="p-6 grid md:grid-cols-2 gap-4 bg-background min-h-screen">
      <Card title="fmtUSD — typical values">
        <Row label="portfolio" value={fmtUSD(245680.42)} />
        <Row label="small balance" value={fmtUSD(42.18)} />
        <Row label="zero" value={fmtUSD(0)} />
        <Row label="null" value={fmtUSD(null)} />
        <Row label="large with commas" value={fmtUSD(1234567.89)} />
      </Card>
      <Card title="fmtCompact — volume">
        <Row label="thousands" value={fmtCompact(6160)} />
        <Row label="millions" value={fmtCompact(385_100_000)} />
        <Row label="billions" value={fmtCompact(1_500_000_000)} />
        <Row label="null" value={fmtCompact(null)} />
      </Card>
    </div>
  ),
};

export const Percentages: Story = {
  render: () => (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-md">
        <Card title="fmtPct — with sign (default)">
          <Row label="positive" value={fmtPct(3.09)} />
          <Row label="negative" value={fmtPct(-2.5)} />
          <Row label="zero" value={fmtPct(0)} />
          <Row label="null" value={fmtPct(null)} />
        </Card>
        <div className="mt-4">
          <Card title="fmtPct — without sign">
            <Row label="positive" value={fmtPct(3.09, false)} />
            <Row label="negative" value={fmtPct(-2.5, false)} />
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const Time: Story = {
  render: () => (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-md">
        <Card title="fmtTime / fmtDateTime">
          <Row label="time (HH:MM:SS)" value={fmtTime(Date.now())} />
          <Row label="date+time" value={fmtDateTime(Date.now())} />
          <Row label="1h ago" value={fmtDateTime(Date.now() - 3600_000)} />
          <Row label="1d ago" value={fmtDateTime(Date.now() - 86400_000)} />
        </Card>
      </div>
    </div>
  ),
};

export const Addresses: Story = {
  render: () => (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-2xl space-y-4">
        <Card title="shortAddr — Ethereum addresses">
          <Row label="0x742d35Cc…f0bEb1" value={shortAddr("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1")} />
          <Row label="0x9ab…c3d (placeholder)" value={shortAddr("0x9abcdef0123456789abcdef0123456789abcdef0")} />
          <Row label="short (unchanged)" value={shortAddr("0x1234")} />
        </Card>
        <Card title="shortAddr — Bitcoin addresses">
          <Row label="bc1qxy2kg…wlh" value={shortAddr("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")} />
          <Row label="TLa2f6VP…npg (Tron)" value={shortAddr("TLa2f6VPqDgRE67v1736s7bCe8PRhzdnpg")} />
        </Card>
        <Card title="shortHash — transaction hashes">
          <Row label="bitcoin tx" value={shortHash("f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16")} />
          <Row label="eth tx" value={shortHash("0x9abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567")} />
          <Row label="short (unchanged)" value={shortHash("0x1234")} />
        </Card>
      </div>
    </div>
  ),
};
