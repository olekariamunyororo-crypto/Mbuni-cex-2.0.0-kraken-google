// Mbuni CEX — Core domain types
// Mirrors the data model in §8 of the spec (PostgreSQL entities + NATS events)

export type ViewKey =
  | "markets"
  | "trading"
  | "swap"
  | "wallet"
  | "admin"
  | "architecture";

export type Side = "BUY" | "SELL";

export type OrderType = "LIMIT" | "MARKET" | "IOC" | "FOK" | "POST_ONLY";

export type OrderStatus =
  | "NEW"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

export interface TradingPair {
  symbol: string; // e.g. "BTC/USDT"
  base: string; // "BTC"
  quote: string; // "USDT"
  baseDecimals: number;
  quoteDecimals: number;
  priceDecimals: number;
  minQty: number;
  tickSize: number;
  status: "ACTIVE" | "PAUSED" | "DELISTED";
}

export interface Order {
  id: string;
  pair: string;
  side: Side;
  type: OrderType;
  price: number | null; // null for MARKET
  qty: number;
  filledQty: number;
  remainingQty: number;
  status: OrderStatus;
  userId: string;
  timestamp: number;
  avgFillPrice: number | null;
}

export interface Trade {
  id: string;
  pair: string;
  price: number;
  qty: number;
  side: Side; // aggressor side
  buyerOrderId: string;
  sellerOrderId: string;
  timestamp: number;
}

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  usdValue: number;
}

export interface OrderBookLevel {
  price: number;
  qty: number;
  total: number; // cumulative
  orderCount: number;
}

export interface OrderBookSnapshot {
  pair: string;
  bids: OrderBookLevel[]; // sorted desc
  asks: OrderBookLevel[]; // sorted asc
  spread: number;
  midPrice: number;
  lastPrice: number;
  timestamp: number;
}

export interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker24h {
  pair: string;
  lastPrice: number;
  priceChange: number;
  priceChangePct: number;
  high: number;
  low: number;
  volume: number; // base volume
  quoteVolume: number;
}

export interface Deposit {
  id: string;
  asset: string;
  chain: string;
  amount: number;
  txHash: string;
  address: string;
  confirmations: number;
  requiredConfirmations: number;
  status: "PENDING" | "CONFIRMED" | "CREDITED";
  timestamp: number;
}

export interface Withdrawal {
  id: string;
  asset: string;
  chain: string;
  amount: number;
  fee: number;
  address: string;
  txHash: string | null;
  status: "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED";
  timestamp: number;
}

export interface WhitelistedAddress {
  id: string;
  asset: string;
  chain: string;
  address: string;
  label: string;
  addedAt: number;
  timeLockHours: number;
}

export interface User {
  id: string;
  email: string;
  kycStatus: "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
  tier: number;
  createdAt: number;
  twoFA: boolean;
  passkey: boolean;
}

export interface FeeSchedule {
  tier: number;
  label: string;
  volumeUSD: number;
  makerFee: number; // bps
  takerFee: number; // bps
}

// NATS-style event stream subjects (per spec §8)
export type EventSubject =
  | "orders.placed"
  | "orders.cancelled"
  | "orders.filled"
  | "trades.executed"
  | "balances.updated"
  | "deposits.confirmed"
  | "withdrawals.completed";

export interface SystemEvent {
  id: string;
  subject: EventSubject;
  payload: unknown;
  timestamp: number;
}

// Service health (per spec §10 — /healthz and /readyz)
export interface ServiceHealth {
  name: string;
  language: "Rust" | "Go" | "React";
  status: "healthy" | "degraded" | "down";
  latencyUs: number; // p99
  ready: boolean;
  uptime: string;
  version: string;
}
