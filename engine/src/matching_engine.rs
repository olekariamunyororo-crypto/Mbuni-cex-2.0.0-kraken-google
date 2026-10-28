// Mbuni CEX 2.0 — Core matching engine logic
//
// Faithful Rust port of the TypeScript matching engine (src/lib/opencex/engine.ts).
// Implements:
//   - Price-time priority matching
//   - All 5 order types: LIMIT, MARKET, IOC, FOK, POST_ONLY
//   - Pre-trade risk checks
//   - FOK pre-flight liquidity check
//   - Order book snapshots
//   - Server-streaming book updates + trades
//
// Performance targets (§5 of spec):
//   - Order processing latency (p99): < 500µs
//   - Throughput per shard: ≥ 100,000 orders/sec
//   - Recovery Time: < 30 seconds

use std::collections::BTreeMap;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use dashmap::DashMap;
use parking_lot::RwLock;
use tokio::sync::mpsc;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::proto_gen::matching_engine::*;

// --- Constants ---

const TRADING_PAIRS: &[(&str, &str, &str, u8, u8, u8, f64, f64)] = &[
    // (symbol, base, quote, base_decimals, quote_decimals, price_decimals, min_qty, tick_size)
    ("BTC/USDT", "BTC", "USDT", 8, 2, 2, 0.0001, 0.1),
    ("ETH/USDT", "ETH", "USDT", 6, 2, 2, 0.001, 0.01),
    ("SOL/USDT", "SOL", "USDT", 2, 2, 3, 0.01, 0.001),
    ("BNB/USDT", "BNB", "USDT", 3, 2, 2, 0.01, 0.01),
    ("XRP/USDT", "XRP", "USDT", 1, 2, 4, 1.0, 0.0001),
    ("ARB/USDT", "ARB", "USDT", 2, 2, 4, 1.0, 0.0001),
    ("OP/USDT", "OP", "USDT", 2, 2, 4, 1.0, 0.0001),
    ("DOGE/USDT", "DOGE", "USDT", 0, 2, 5, 1.0, 0.00001),
    ("MATIC/USDT", "MATIC", "USDT", 2, 2, 4, 1.0, 0.0001),
    ("AVAX/USDT", "AVAX", "USDT", 2, 2, 3, 0.1, 0.001),
    ("LINK/USDT", "LINK", "USDT", 2, 2, 3, 0.1, 0.001),
    ("TON/USDT", "TON", "USDT", 2, 2, 3, 0.1, 0.001),
];

const INITIAL_PRICES: &[(&str, f64)] = &[
    ("BTC/USDT", 80835.61),
    ("ETH/USDT", 3245.8),
    ("SOL/USDT", 178.42),
    ("BNB/USDT", 605.2),
    ("XRP/USDT", 0.5234),
    ("ARB/USDT", 0.7821),
    ("OP/USDT", 1.953),
    ("DOGE/USDT", 0.12134),
    ("MATIC/USDT", 0.4821),
    ("AVAX/USDT", 28.74),
    ("LINK/USDT", 14.32),
    ("TON/USDT", 5.21),
];

// --- Data structures ---

#[derive(Clone, Debug)]
struct RestingOrder {
    id: String,
    pair: String,
    side: Side,
    order_type: OrderType,
    price: f64,
    qty: f64,
    user_id: String,
    timestamp: u64,
}

struct PairBook {
    pair: String,
    base_decimals: u8,
    quote_decimals: u8,
    price_decimals: u8,
    min_qty: f64,
    tick_size: f64,
    // BTreeMap gives us O(log n) ordered access — bids sorted desc, asks sorted asc
    bids: BTreeMap<OrderedFloat, Vec<RestingOrder>>,  // highest price first
    asks: BTreeMap<OrderedFloat, Vec<RestingOrder>>,  // lowest price first
    last_price: f64,
    // Subscribers for streaming updates
    book_subscribers: Vec<mpsc::UnboundedSender<BookUpdate>>,
    trade_subscribers: Vec<mpsc::UnboundedSender<Trade>>,
    orders_processed: u64,
}

// Wrapper for f64 that implements Ord (BTreeMap requires Ord keys)
#[derive(Clone, Copy, Debug, PartialEq)]
struct OrderedFloat(f64);

impl Eq for OrderedFloat {}
impl PartialOrd for OrderedFloat {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}
impl Ord for OrderedFloat {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.0.partial_cmp(&other.0).unwrap_or(std::cmp::Ordering::Equal)
    }
}

impl PairBook {
    fn new(pair: &str, base_dec: u8, quote_dec: u8, price_dec: u8, min_qty: f64, tick: f64) -> Self {
        Self {
            pair: pair.to_string(),
            base_decimals: base_dec,
            quote_decimals: quote_dec,
            price_decimals: price_dec,
            min_qty,
            tick_size: tick,
            bids: BTreeMap::new(),
            asks: BTreeMap::new(),
            last_price: 0.0,
            book_subscribers: Vec::new(),
            trade_subscribers: Vec::new(),
            orders_processed: 0,
        }
    }

    fn round(&self, val: f64, decimals: u8) -> f64 {
        let factor = 10f64.powi(decimals as i32);
        (val * factor).round() / factor
    }

    fn best_price(&self, side: Side) -> Option<f64> {
        match side {
            Side::Buy => self.bids.last_key_value().map(|(p, _)| p.0),
            Side::Sell => self.asks.first_key_value().map(|(p, _)| p.0),
            _ => None,
        }
    }

    fn crossable(&self, resting_side: Side, resting_price: f64, aggressor_price: Option<f64>) -> bool {
        match aggressor_price {
            None => true,  // Market order crosses everything
            Some(ap) => {
                if resting_side == Side::Sell {
                    ap >= resting_price  // Aggressor BUY crosses SELL if price >= ask
                } else {
                    ap <= resting_price  // Aggressor SELL crosses BUY if price <= bid
                }
            }
        }
    }

    /// Compute total available liquidity on the opposite book at or better than the aggressor's price.
    /// Used for the FOK pre-flight check.
    fn available_liquidity(&self, aggressor_side: Side, max_price: Option<f64>) -> f64 {
        let resting_side = if aggressor_side == Side::Buy { Side::Sell } else { Side::Buy };
        let book = if resting_side == Side::Buy { &self.bids } else { &self.asks };
        let mut total = 0.0f64;
        for (price, queue) in book.iter() {
            if let Some(mp) = max_price {
                if !self.crossable(resting_side, price.0, Some(mp)) {
                    continue;
                }
            }
            for resting in queue {
                total += resting.qty;
            }
        }
        self.round(total, self.base_decimals)
    }

    /// Seed the book with market-maker orders around the mid price.
    fn seed_book(&mut self, mid_price: f64, levels: usize, qty_each: f64) {
        for i in 1..=levels {
            let bid_price = self.round(mid_price - (i as f64) * self.tick_size, self.price_decimals);
            let ask_price = self.round(mid_price + (i as f64) * self.tick_size, self.price_decimals);
            let bid_qty = self.round(qty_each * (1.0 + rand::random::<f64>()), self.base_decimals);
            let ask_qty = self.round(qty_each * (1.0 + rand::random::<f64>()), self.base_decimals);

            let bid_order = RestingOrder {
                id: Uuid::new_v4().to_string(),
                pair: self.pair.clone(),
                side: Side::Buy,
                order_type: OrderType::Limit,
                price: bid_price,
                qty: bid_qty,
                user_id: "market-maker".to_string(),
                timestamp: now_ms(),
            };
            let ask_order = RestingOrder {
                id: Uuid::new_v4().to_string(),
                pair: self.pair.clone(),
                side: Side::Sell,
                order_type: OrderType::Limit,
                price: ask_price,
                qty: ask_qty,
                user_id: "market-maker".to_string(),
                timestamp: now_ms(),
            };

            self.bids.entry(OrderedFloat(bid_price)).or_default().push(bid_order);
            self.asks.entry(OrderedFloat(ask_price)).or_default().push(ask_order);
        }
        self.last_price = mid_price;
    }

    /// Place an order — core matching logic.
    fn place_order(&mut self, req: &PlaceOrderRequest) -> (Order, Vec<Trade>, bool, String) {
        let side = req.side;
        let order_type = req.order_type;
        let price = req.price;
        let qty = req.qty;
        let user_id = &req.user_id;

        let mut trades: Vec<Trade> = Vec::new();
        let mut reject_reason = String::new();

        // --- Pre-trade risk checks ---
        if qty <= 0.0 {
            let order = self.make_order(req, OrderStatus::Rejected, 0.0);
            return (order, trades, false, "Quantity must be positive".to_string());
        }
        if order_type != OrderType::Market {
            if let Some(p) = price {
                if p <= 0.0 {
                    let order = self.make_order(req, OrderStatus::Rejected, 0.0);
                    return (order, trades, false, "Price must be positive".to_string());
                }
            }
        }

        // --- POST_ONLY crossing check ---
        if order_type == OrderType::PostOnly {
            if let Some(p) = price {
                let opposite_best = self.best_price(if side == Side::Buy { Side::Sell } else { Side::Buy });
                if let Some(ob) = opposite_best {
                    if self.crossable(if side == Side::Buy { Side::Sell } else { Side::Buy }, ob, Some(p)) {
                        let order = self.make_order(req, OrderStatus::Rejected, 0.0);
                        return (order, trades, false, "POST_ONLY order would cross".to_string());
                    }
                }
            }
        }

        // --- FOK pre-flight liquidity check ---
        if order_type == OrderType::Fok {
            let available = self.available_liquidity(side, price);
            if available < qty {
                let order = self.make_order(req, OrderStatus::Cancelled, 0.0);
                return (order, trades, false, "FOK_NOT_FILLABLE".to_string());
            }
        }

        // --- Create the order ---
        let order_id = Uuid::new_v4().to_string();
        let mut remaining = qty;
        let mut filled_qty = 0.0f64;
        let mut total_cost = 0.0f64;
        let opposite_side = if side == Side::Buy { Side::Sell } else { Side::Buy };

        // --- Match against the opposite book ---
        if order_type != OrderType::PostOnly {
            let opposite_book = if opposite_side == Side::Buy { &self.bids } else { &self.asks };
            let prices_to_check: Vec<OrderedFloat> = opposite_book.keys().cloned().collect();

            for best in prices_to_check {
                if remaining <= 0.0 { break; }
                if !self.crossable(opposite_side, best.0, price) { break; }

                let queue = if opposite_side == Side::Buy {
                    self.bids.get_mut(&best).unwrap()
                } else {
                    self.asks.get_mut(&best).unwrap()
                };

                while !queue.is_empty() && remaining > 0.0 {
                    let resting = queue.first_mut().unwrap();
                    let fill_qty = remaining.min(resting.qty);
                    let fill_price = resting.price;

                    let trade = Trade {
                        id: Uuid::new_v4().to_string(),
                        pair: self.pair.clone(),
                        price: fill_price,
                        qty: self.round(fill_qty, self.base_decimals),
                        side: side as i32,
                        buyer_order_id: if side == Side::Buy { order_id.clone() } else { resting.id.clone() },
                        seller_order_id: if side == Side::Sell { order_id.clone() } else { resting.id.clone() },
                        timestamp: now_ms() as i64,
                    };

                    trades.push(trade.clone());
                    self.last_price = fill_price;
                    self.notify_trade(&trade);

                    remaining = self.round(remaining - fill_qty, self.base_decimals);
                    filled_qty = self.round(filled_qty + fill_qty, self.base_decimals);
                    total_cost += fill_qty * fill_price;

                    resting.qty = self.round(resting.qty - fill_qty, self.base_decimals);
                    if resting.qty <= 0.0 {
                        queue.remove(0);
                    }
                }

                let queue_len = if opposite_side == Side::Buy {
                    self.bids.get(&best).map(|q| q.len()).unwrap_or(0)
                } else {
                    self.asks.get(&best).map(|q| q.len()).unwrap_or(0)
                };
                if queue_len == 0 {
                    if opposite_side == Side::Buy {
                        self.bids.remove(&best);
                    } else {
                        self.asks.remove(&best);
                    }
                }
            }
        }

        // --- Determine final order status ---
        let status = if order_type == OrderType::Ioc && remaining > 0.0 {
            // IOC: cancel remainder
            if filled_qty > 0.0 { OrderStatus::PartiallyFilled } else { OrderStatus::Cancelled }
        } else if remaining > 0.0 && (order_type == OrderType::Limit || order_type == OrderType::PostOnly) {
            // Rest on book
            let resting = RestingOrder {
                id: order_id.clone(),
                pair: self.pair.clone(),
                side,
                order_type,
                price: price.unwrap_or(0.0),
                qty: remaining,
                user_id: user_id.clone(),
                timestamp: now_ms(),
            };
            let key = OrderedFloat(price.unwrap_or(0.0));
            let book = if side == Side::Buy { &mut self.bids } else { &mut self.asks };
            book.entry(key).or_default().push(resting);
            if filled_qty > 0.0 { OrderStatus::PartiallyFilled } else { OrderStatus::New }
        } else if remaining <= 0.0 {
            OrderStatus::Filled
        } else {
            // MARKET with leftover → cancel
            if filled_qty > 0.0 { OrderStatus::PartiallyFilled } else { OrderStatus::Cancelled }
        };

        let avg_fill_price = if filled_qty > 0.0 {
            Some(self.round(total_cost / filled_qty, self.price_decimals))
        } else {
            None
        };

        let order = Order {
            id: order_id,
            pair: self.pair.clone(),
            side: side as i32,
            order_type: order_type as i32,
            price,
            qty,
            filled_qty,
            remaining_qty: if order_type == OrderType::Ioc || order_type == OrderType::Fok {
                0.0  // IOC/FOK never rest
            } else {
                remaining
            },
            status: status as i32,
            user_id: user_id.clone(),
            timestamp: now_ms() as i64,
            avg_fill_price,
        };

        self.orders_processed += 1;
        self.notify_book_update();

        let ok = status != OrderStatus::Rejected;
        (order, trades, ok, reject_reason)
    }

    /// Cancel a resting order by ID.
    fn cancel_order(&mut self, order_id: &str) -> bool {
        for (price, queue) in self.bids.iter_mut() {
            if let Some(pos) = queue.iter().position(|o| o.id == order_id) {
                queue.remove(pos);
                if queue.is_empty() {
                    let pf = *price;
                    self.bids.remove(&pf);
                }
                self.notify_book_update();
                return true;
            }
        }
        for (price, queue) in self.asks.iter_mut() {
            if let Some(pos) = queue.iter().position(|o| o.id == order_id) {
                queue.remove(pos);
                if queue.is_empty() {
                    let pf = *price;
                    self.asks.remove(&pf);
                }
                self.notify_book_update();
                return true;
            }
        }
        false
    }

    /// Get a snapshot of the current order book.
    fn get_snapshot(&self, depth: usize) -> OrderBookSnapshot {
        let mut bids: Vec<BookLevel> = Vec::new();
        let mut asks: Vec<BookLevel> = Vec::new();
        let mut bid_total = 0.0f64;
        let mut ask_total = 0.0f64;

        // Bids: highest price first (reverse iteration)
        for (price, queue) in self.bids.iter().rev().take(depth) {
            let qty: f64 = queue.iter().map(|o| o.qty).sum();
            bid_total += qty;
            bids.push(BookLevel {
                price: self.round(price.0, self.price_decimals),
                qty: self.round(qty, self.base_decimals),
                total: self.round(bid_total, self.base_decimals),
                order_count: queue.len() as u32,
            });
        }

        // Asks: lowest price first (forward iteration)
        for (price, queue) in self.asks.iter().take(depth) {
            let qty: f64 = queue.iter().map(|o| o.qty).sum();
            ask_total += qty;
            asks.push(BookLevel {
                price: self.round(price.0, self.price_decimals),
                qty: self.round(qty, self.base_decimals),
                total: self.round(ask_total, self.base_decimals),
                order_count: queue.len() as u32,
            });
        }

        let best_bid = bids.first().map(|l| l.price).unwrap_or(0.0);
        let best_ask = asks.first().map(|l| l.price).unwrap_or(0.0);
        let spread = if best_bid > 0.0 && best_ask > 0.0 {
            self.round(best_ask - best_bid, self.price_decimals)
        } else {
            0.0
        };
        let mid_price = if best_bid > 0.0 && best_ask > 0.0 {
            self.round((best_bid + best_ask) / 2.0, self.price_decimals)
        } else {
            self.last_price
        };

        OrderBookSnapshot {
            pair: self.pair.clone(),
            bids,
            asks,
            spread,
            mid_price,
            last_price: self.last_price,
            timestamp: now_ms() as i64,
        }
    }

    fn make_order(&self, req: &PlaceOrderRequest, status: OrderStatus, filled: f64) -> Order {
        Order {
            id: Uuid::new_v4().to_string(),
            pair: self.pair.clone(),
            side: req.side as i32,
            order_type: req.order_type as i32,
            price: req.price,
            qty: req.qty,
            filled_qty: filled,
            remaining_qty: if status == OrderStatus::Rejected { req.qty } else { req.qty - filled },
            status: status as i32,
            user_id: req.user_id.clone(),
            timestamp: now_ms() as i64,
            avg_fill_price: None,
        }
    }

    fn notify_book_update(&mut self) {
        let snapshot = self.get_snapshot(20);
        let update = BookUpdate {
            pair: snapshot.pair,
            bids: snapshot.bids,
            asks: snapshot.asks,
            last_price: snapshot.last_price,
            timestamp: snapshot.timestamp,
        };
        self.book_subscribers.retain(|tx| tx.send(update.clone()).is_ok());
    }

    fn notify_trade(&mut self, trade: &Trade) {
        self.trade_subscribers.retain(|tx| tx.send(trade.clone()).is_ok());
    }
}

// --- The gRPC server ---

pub struct MatchingEngineServer {
    books: Arc<DashMap<String, RwLock<PairBook>>>,
    start_time: SystemTime,
    orders_processed: Arc<std::sync::atomic::AtomicU64>,
}

impl MatchingEngineServer {
    pub fn new() -> Self {
        let books = Arc::new(DashMap::new());
        for &(symbol, base, quote, base_dec, quote_dec, price_dec, min_qty, tick) in TRADING_PAIRS {
            let book = PairBook::new(symbol, base_dec, quote_dec, price_dec, min_qty, tick);
            books.insert(symbol.to_string(), RwLock::new(book));
        }
        Self {
            books,
            start_time: SystemTime::now(),
            orders_processed: Arc::new(std::sync::atomic::AtomicU64::new(0)),
        }
    }

    pub async fn seed_all_pairs(&self) {
        for &(symbol, _, _, _, _, _, _, _) in TRADING_PAIRS {
            if let Some(initial_price) = INITIAL_PRICES.iter().find(|(s, _)| *s == symbol).map(|(_, p)| *p) {
                if let Some(entry) = self.books.get(symbol) {
                    let qty = if symbol.starts_with("BTC") { 0.4 } else if symbol.starts_with("ETH") { 1.2 } else { 50.0 };
                    entry.write().seed_book(initial_price, 14, qty);
                }
            }
        }
    }
}

type BoxError = Box<dyn std::error::Error + Send + Sync>;
type Result<T> = std::result::Result<T, Status>;

#[tonic::async_trait]
impl matching_engine_server::MatchingEngine for MatchingEngineServer {
    async fn place_order(&self, request: Request<PlaceOrderRequest>) -> Result<Response<PlaceOrderResponse>> {
        let req = request.into_inner();
        tracing::debug!("place_order: pair={} side={} type={} qty={} user={}",
            req.pair, req.side, req.order_type, req.qty, req.user_id);

        let entry = self.books.get(&req.pair)
            .ok_or_else(|| Status::not_found(format!("Unknown pair: {}", req.pair)))?;

        let (order, trades, ok, reject_reason) = entry.write().place_order(&req);

        self.orders_processed.fetch_add(1, std::sync::atomic::Ordering::Relaxed);

        Ok(Response::new(PlaceOrderResponse {
            order: Some(order),
            trades,
            ok,
            reject_reason,
        }))
    }

    async fn cancel_order(&self, request: Request<CancelOrderRequest>) -> Result<Response<CancelOrderResponse>> {
        let req = request.into_inner();
        let entry = self.books.get(&req.pair)
            .ok_or_else(|| Status::not_found(format!("Unknown pair: {}", req.pair)))?;

        let ok = entry.write().cancel_order(&req.order_id);
        Ok(Response::new(CancelOrderResponse { ok }))
    }

    async fn get_snapshot(&self, request: Request<SnapshotRequest>) -> Result<Response<OrderBookSnapshot>> {
        let req = request.into_inner();
        let depth = if req.depth > 0 { req.depth as usize } else { 20 };
        let entry = self.books.get(&req.pair)
            .ok_or_else(|| Status::not_found(format!("Unknown pair: {}", req.pair)))?;

        let snapshot = entry.read().get_snapshot(depth);
        Ok(Response::new(snapshot))
    }

    type StreamBookUpdatesStream = std::pin::Pin<Box<dyn tokio_stream::Stream<Item = Result<BookUpdate>> + Send>>;

    async fn stream_book_updates(&self, request: Request<StreamRequest>) -> Result<Response<Self::StreamBookUpdatesStream>> {
        let req = request.into_inner();
        let (tx, rx) = mpsc::unbounded_channel();

        if let Some(entry) = self.books.get(&req.pair) {
            entry.write().book_subscribers.push(tx);
        }

        let stream = tokio_stream::wrappers::UnboundedReceiverStream::new(rx)
            .map(Ok)
            .boxed();

        Ok(Response::new(Box::pin(stream)))
    }

    type StreamTradesStream = std::pin::Pin<Box<dyn tokio_stream::Stream<Item = Result<Trade>> + Send>>;

    async fn stream_trades(&self, request: Request<StreamRequest>) -> Result<Response<Self::StreamTradesStream>> {
        let req = request.into_inner();
        let (tx, rx) = mpsc::unbounded_channel();

        if let Some(entry) = self.books.get(&req.pair) {
            entry.write().trade_subscribers.push(tx);
        }

        let stream = tokio_stream::wrappers::UnboundedReceiverStream::new(rx)
            .map(Ok)
            .boxed();

        Ok(Response::new(Box::pin(stream)))
    }

    async fn health(&self, _request: Request<HealthRequest>) -> Result<Response<HealthResponse>> {
        let uptime = self.start_time.elapsed().map(|d| d.as_secs()).unwrap_or(0);
        let orders = self.orders_processed.load(std::sync::atomic::Ordering::Relaxed);
        Ok(Response::new(HealthResponse {
            ready: true,
            version: "2.0.0".to_string(),
            uptime_seconds: uptime,
            orders_processed: orders,
        }))
    }
}

// --- Utilities ---

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

use tokio_stream::StreamExt;
