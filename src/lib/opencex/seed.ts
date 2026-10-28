// Mbuni CEX — Seed data: trading pairs, balances, fee schedules, klines, deposits, etc.

import type {
  Balance,
  Deposit,
  FeeSchedule,
  Kline,
  TradingPair,
  User,
  WhitelistedAddress,
  Withdrawal,
} from "./types";

export const TRADING_PAIRS: TradingPair[] = [
  { symbol: "BTC/USDT", base: "BTC", quote: "USDT", baseDecimals: 8, quoteDecimals: 2, priceDecimals: 2, minQty: 0.0001, tickSize: 0.1, status: "ACTIVE" },
  { symbol: "ETH/USDT", base: "ETH", quote: "USDT", baseDecimals: 6, quoteDecimals: 2, priceDecimals: 2, minQty: 0.001, tickSize: 0.01, status: "ACTIVE" },
  { symbol: "SOL/USDT", base: "SOL", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 3, minQty: 0.01, tickSize: 0.001, status: "ACTIVE" },
  { symbol: "BNB/USDT", base: "BNB", quote: "USDT", baseDecimals: 3, quoteDecimals: 2, priceDecimals: 2, minQty: 0.01, tickSize: 0.01, status: "ACTIVE" },
  { symbol: "XRP/USDT", base: "XRP", quote: "USDT", baseDecimals: 1, quoteDecimals: 2, priceDecimals: 4, minQty: 1, tickSize: 0.0001, status: "ACTIVE" },
  { symbol: "ARB/USDT", base: "ARB", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 4, minQty: 1, tickSize: 0.0001, status: "ACTIVE" },
  { symbol: "OP/USDT", base: "OP", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 4, minQty: 1, tickSize: 0.0001, status: "ACTIVE" },
  { symbol: "DOGE/USDT", base: "DOGE", quote: "USDT", baseDecimals: 0, quoteDecimals: 2, priceDecimals: 5, minQty: 1, tickSize: 0.00001, status: "ACTIVE" },
  { symbol: "MATIC/USDT", base: "MATIC", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 4, minQty: 1, tickSize: 0.0001, status: "ACTIVE" },
  { symbol: "AVAX/USDT", base: "AVAX", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 3, minQty: 0.1, tickSize: 0.001, status: "ACTIVE" },
  { symbol: "LINK/USDT", base: "LINK", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 3, minQty: 0.1, tickSize: 0.001, status: "ACTIVE" },
  { symbol: "TON/USDT", base: "TON", quote: "USDT", baseDecimals: 2, quoteDecimals: 2, priceDecimals: 3, minQty: 0.1, tickSize: 0.001, status: "ACTIVE" },
];

export const INITIAL_PRICES: Record<string, number> = {
  "BTC/USDT": 67250.5,
  "ETH/USDT": 3245.8,
  "SOL/USDT": 178.42,
  "BNB/USDT": 605.2,
  "XRP/USDT": 0.5234,
  "ARB/USDT": 0.7821,
  "OP/USDT": 1.953,
  "DOGE/USDT": 0.12134,
  "MATIC/USDT": 0.4821,
  "AVAX/USDT": 28.74,
  "LINK/USDT": 14.32,
  "TON/USDT": 5.21,
};

export const ASSET_METADATA: Record<string, { name: string; color: string; chains: string[] }> = {
  BTC: { name: "Bitcoin", color: "#f7931a", chains: ["Bitcoin", "BSC", "Arbitrum"] },
  ETH: { name: "Ethereum", color: "#627eea", chains: ["Ethereum", "Arbitrum", "Optimism", "BSC"] },
  SOL: { name: "Solana", color: "#14f195", chains: ["Solana"] },
  BNB: { name: "BNB", color: "#f3ba2f", chains: ["BSC"] },
  XRP: { name: "Ripple", color: "#23292f", chains: ["XRPL"] },
  ARB: { name: "Arbitrum", color: "#28a0f0", chains: ["Arbitrum"] },
  OP: { name: "Optimism", color: "#ff0420", chains: ["Optimism"] },
  DOGE: { name: "Dogecoin", color: "#c2a633", chains: ["Dogecoin", "Ethereum"] },
  MATIC: { name: "Polygon", color: "#8247e5", chains: ["Polygon", "Ethereum"] },
  AVAX: { name: "Avalanche", color: "#e84142", chains: ["Avalanche"] },
  LINK: { name: "Chainlink", color: "#2a5ada", chains: ["Ethereum", "Arbitrum"] },
  TON: { name: "Toncoin", color: "#0098ea", chains: ["TON"] },
  USDT: { name: "Tether", color: "#26a17b", chains: ["Ethereum", "Tron", "BSC", "Arbitrum", "Solana"] },
};

export const INITIAL_BALANCES: Balance[] = [
  { asset: "USDT", free: 245680.42, locked: 4200.0, usdValue: 245680.42 },
  { asset: "BTC", free: 3.4521, locked: 0.05, usdValue: 3.4521 * 67250.5 },
  { asset: "ETH", free: 42.18, locked: 1.2, usdValue: 42.18 * 3245.8 },
  { asset: "SOL", free: 380.5, locked: 0, usdValue: 380.5 * 178.42 },
  { asset: "ARB", free: 12500, locked: 0, usdValue: 12500 * 0.7821 },
  { asset: "OP", free: 8200, locked: 0, usdValue: 8200 * 1.953 },
  { asset: "LINK", free: 1200, locked: 0, usdValue: 1200 * 14.32 },
  { asset: "TON", free: 5000, locked: 0, usdValue: 5000 * 5.21 },
];

export const FEE_SCHEDULES: FeeSchedule[] = [
  { tier: 0, label: "Starter", volumeUSD: 0, makerFee: 10, takerFee: 18 },
  { tier: 1, label: "Bronze", volumeUSD: 50_000, makerFee: 8, takerFee: 15 },
  { tier: 2, label: "Silver", volumeUSD: 250_000, makerFee: 6, takerFee: 12 },
  { tier: 3, label: "Gold", volumeUSD: 1_000_000, makerFee: 4, takerFee: 9 },
  { tier: 4, label: "Platinum", volumeUSD: 5_000_000, makerFee: 2, takerFee: 6 },
  { tier: 5, label: "Institutional", volumeUSD: 25_000_000, makerFee: 0, takerFee: 4 },
];

export const WHITELISTED_ADDRESSES: WhitelistedAddress[] = [
  { id: "wa_1", asset: "BTC", chain: "Bitcoin", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", label: "Cold Storage — Ledger", addedAt: Date.now() - 86400000 * 30, timeLockHours: 24 },
  { id: "wa_2", asset: "ETH", chain: "Ethereum", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", label: "Hardware Wallet", addedAt: Date.now() - 86400000 * 14, timeLockHours: 24 },
  { id: "wa_3", asset: "USDT", chain: "Tron", address: "TLa2f6VPqDgRE67v1736s7bCe8PRhzdnpg", label: "Exchange Sub-account", addedAt: Date.now() - 86400000 * 7, timeLockHours: 48 },
  { id: "wa_4", asset: "SOL", chain: "Solana", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", label: "Phantom — Mobile", addedAt: Date.now() - 86400000 * 3, timeLockHours: 24 },
];

export const DEPOSITS: Deposit[] = [
  { id: "d_1", asset: "BTC", chain: "Bitcoin", amount: 0.4521, txHash: "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", confirmations: 3, requiredConfirmations: 3, status: "CREDITED", timestamp: Date.now() - 3600000 * 5 },
  { id: "d_2", asset: "USDT", chain: "Tron", amount: 12500, txHash: "3e5a2c4b8d9f1e0a6c7b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a", address: "TLa2f6VPqDgRE67v1736s7bCe8PRhzdnpg", confirmations: 19, requiredConfirmations: 20, status: "PENDING", timestamp: Date.now() - 600000 },
  { id: "d_3", asset: "ETH", chain: "Arbitrum", amount: 2.18, txHash: "0x9abc...8def", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", confirmations: 1, requiredConfirmations: 12, status: "PENDING", timestamp: Date.now() - 120000 },
  { id: "d_4", asset: "SOL", chain: "Solana", amount: 80.5, txHash: "5xK9...AsU", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", confirmations: 32, requiredConfirmations: 32, status: "CREDITED", timestamp: Date.now() - 86400000 },
  { id: "d_5", asset: "USDT", chain: "Ethereum", amount: 45000, txHash: "0xa1b2...c3d4", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", confirmations: 15, requiredConfirmations: 12, status: "CREDITED", timestamp: Date.now() - 86400000 * 3 },
];

export const WITHDRAWALS: Withdrawal[] = [
  { id: "w_1", asset: "ETH", chain: "Ethereum", amount: 5.0, fee: 0.002, address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1", txHash: "0xfa1c...92be", status: "COMPLETED", timestamp: Date.now() - 3600000 * 12 },
  { id: "w_2", asset: "USDT", chain: "Tron", amount: 18000, fee: 1, address: "TLa2f6VPqDgRE67v1736s7bCe8PRhzdnpg", txHash: null, status: "APPROVED", timestamp: Date.now() - 1800000 },
  { id: "w_3", asset: "BTC", chain: "Bitcoin", amount: 0.25, fee: 0.0001, address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", txHash: null, status: "PENDING", timestamp: Date.now() - 600000 },
  { id: "w_4", asset: "SOL", chain: "Solana", amount: 50, fee: 0.01, address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", txHash: "5xK9...z8As", status: "COMPLETED", timestamp: Date.now() - 86400000 * 2 },
];

export const SAMPLE_USERS: User[] = [
  { id: "u_1", email: "alice@mbuni.cex", kycStatus: "VERIFIED", tier: 3, createdAt: Date.now() - 86400000 * 120, twoFA: true, passkey: true },
  { id: "u_2", email: "bobby.trader@example.com", kycStatus: "VERIFIED", tier: 2, createdAt: Date.now() - 86400000 * 45, twoFA: true, passkey: false },
  { id: "u_3", email: "carol.investor@example.com", kycStatus: "PENDING", tier: 0, createdAt: Date.now() - 86400000 * 3, twoFA: false, passkey: false },
  { id: "u_4", email: "david.whale@example.com", kycStatus: "VERIFIED", tier: 5, createdAt: Date.now() - 86400000 * 365, twoFA: true, passkey: true },
  { id: "u_5", email: "erin.newbie@example.com", kycStatus: "NONE", tier: 0, createdAt: Date.now() - 3600000 * 6, twoFA: false, passkey: false },
  { id: "u_6", email: "frank.botmaker@example.com", kycStatus: "VERIFIED", tier: 4, createdAt: Date.now() - 86400000 * 210, twoFA: true, passkey: false },
];

// Generate ~6h of 1m klines for charting
export function generateKlines(pair: string, basePrice: number, count = 360): Kline[] {
  const klines: Kline[] = [];
  let price = basePrice * 0.97;
  const now = Date.now();
  const drift = (Math.random() - 0.4) * 0.0008;
  for (let i = count - 1; i >= 0; i--) {
    const openTime = now - i * 60_000;
    const open = price;
    const vol = 0.0005 + Math.random() * 0.0015;
    const change = (Math.random() - 0.5) * vol + drift;
    const close = Math.max(0.01, open * (1 + change));
    const high = Math.max(open, close) * (1 + Math.random() * 0.0015);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0015);
    const volume = (Math.random() * 50 + 10) * (basePrice > 1000 ? 0.5 : 1);
    klines.push({
      openTime,
      open: round(open, 4),
      high: round(high, 4),
      low: round(low, 4),
      close: round(close, 4),
      volume: round(volume, 4),
    });
    price = close;
  }
  return klines;
}

function round(n: number, d: number) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

export const CHAINS = [
  { id: "bitcoin", name: "Bitcoin", confirmations: 3, withdrawalFeeUSD: 8.5 },
  { id: "ethereum", name: "Ethereum", confirmations: 12, withdrawalFeeUSD: 4.2 },
  { id: "bsc", name: "BNB Smart Chain", confirmations: 15, withdrawalFeeUSD: 0.4 },
  { id: "arbitrum", name: "Arbitrum One", confirmations: 6, withdrawalFeeUSD: 0.5 },
  { id: "optimism", name: "Optimism", confirmations: 6, withdrawalFeeUSD: 0.4 },
  { id: "polygon", name: "Polygon PoS", confirmations: 8, withdrawalFeeUSD: 0.3 },
  { id: "solana", name: "Solana", confirmations: 32, withdrawalFeeUSD: 0.05 },
  { id: "tron", name: "Tron", confirmations: 20, withdrawalFeeUSD: 1.5 },
  { id: "ton", name: "TON", confirmations: 30, withdrawalFeeUSD: 0.1 },
  { id: "xrpl", name: "XRPL", confirmations: 1, withdrawalFeeUSD: 0.2 },
];
