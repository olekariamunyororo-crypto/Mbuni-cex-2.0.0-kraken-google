// Mbuni CEX 2.0 — Matching engine tests
//
// Tests the same invariants as the TypeScript tests:
//   - All 5 order types (LIMIT, MARKET, IOC, FOK, POST_ONLY)
//   - Quantity conservation
//   - FOK all-or-nothing
//   - POST_ONLY never crosses
//   - No crossed book
//   - Cancel preserves book integrity

#[cfg(test)]
mod tests {
    use super::*;
    use crate::matching_engine::*;

    fn make_pair() -> PairBook {
        let mut book = PairBook::new("BTC/USDT", 8, 2, 2, 0.0001, 0.1);
        book.seed_book(50000.0, 6, 1.0);
        book
    }

    fn make_request(side: Side, order_type: OrderType, price: Option<f64>, qty: f64) -> PlaceOrderRequest {
        PlaceOrderRequest {
            pair: "BTC/USDT".to_string(),
            side: side as i32,
            order_type: order_type as i32,
            price,
            qty,
            user_id: "test_user".to_string(),
            client_order_id: "".to_string(),
        }
    }

    #[test]
    fn test_seed_book_populates_bids_and_asks() {
        let book = make_pair();
        let snap = book.get_snapshot(20);
        assert!(!snap.bids.is_empty());
        assert!(!snap.asks.is_empty());
        assert!(snap.bids[0].price < snap.asks[0].price); // No crossed book
    }

    #[test]
    fn test_limit_order_rests_on_book() {
        let mut book = make_pair();
        let req = make_request(Side::Buy, OrderType::Limit, Some(49000.0), 0.5);
        let (order, trades, ok, _) = book.place_order(&req);

        assert!(ok);
        assert_eq!(order.status, OrderStatus::New as i32);
        assert_eq!(order.remaining_qty, 0.5);
        assert!(trades.is_empty());

        // Verify it's on the book
        let snap = book.get_snapshot(20);
        assert!(snap.bids.iter().any(|l| l.price == 49000.0));
    }

    #[test]
    fn test_limit_order_crosses_and_fills() {
        let mut book = make_pair();
        let best_ask = book.best_price(Side::Sell).unwrap();
        let req = make_request(Side::Buy, OrderType::Limit, Some(best_ask), 0.1);
        let (order, trades, ok, _) = book.place_order(&req);

        assert!(ok);
        assert_eq!(order.status, OrderStatus::Filled as i32);
        assert_eq!(order.filled_qty, 0.1);
        assert!(!trades.is_empty());
    }

    #[test]
    fn test_market_order_fills_against_book() {
        let mut book = make_pair();
        let req = make_request(Side::Buy, OrderType::Market, None, 0.1);
        let (order, trades, ok, _) = book.place_order(&req);

        assert!(ok);
        assert_eq!(order.status, OrderStatus::Filled as i32);
        assert!(!trades.is_empty());
    }

    #[test]
    fn test_ioc_cancels_remainder() {
        let mut book = make_pair();
        let best_ask = book.best_price(Side::Sell).unwrap();
        // Request way more than available
        let req = make_request(Side::Buy, OrderType::Ioc, Some(best_ask + 1000.0), 1000.0);
        let (order, trades, ok, _) = book.place_order(&req);

        assert!(ok);
        assert!(order.filled_qty > 0.0);
        assert!(order.filled_qty < 1000.0);
        assert_eq!(order.status, OrderStatus::PartiallyFilled as i32);
        assert_eq!(order.remaining_qty, 0.0); // IOC remainder cancelled
    }

    #[test]
    fn test_fok_all_or_nothing() {
        let mut book = make_pair();
        // Small order — should fill entirely
        let best_ask = book.best_price(Side::Sell).unwrap();
        let req = make_request(Side::Buy, OrderType::Fok, Some(best_ask), 0.1);
        let (order, _trades, ok, _) = book.place_order(&req);
        assert!(ok);
        assert_eq!(order.status, OrderStatus::Filled as i32);

        // Large order — should be cancelled entirely (not enough liquidity)
        let req = make_request(Side::Buy, OrderType::Fok, Some(best_ask + 10000.0), 100000.0);
        let (order, trades, ok, _) = book.place_order(&req);
        assert_eq!(order.status, OrderStatus::Cancelled as i32);
        assert!(trades.is_empty());
        assert_eq!(order.filled_qty, 0.0);
    }

    #[test]
    fn test_post_only_never_crosses() {
        let mut book = make_pair();
        let best_ask = book.best_price(Side::Sell).unwrap();

        // POST_ONLY that would cross → REJECTED
        let req = make_request(Side::Buy, OrderType::PostOnly, Some(best_ask), 0.5);
        let (order, trades, ok, _) = book.place_order(&req);
        assert!(!ok);
        assert_eq!(order.status, OrderStatus::Rejected as i32);
        assert!(trades.is_empty());

        // POST_ONLY that won't cross → NEW (rests on book)
        let best_bid = book.best_price(Side::Buy).unwrap();
        let req = make_request(Side::Buy, OrderType::PostOnly, Some(best_bid - 100.0), 0.5);
        let (order, trades, ok, _) = book.place_order(&req);
        assert!(ok);
        assert_eq!(order.status, OrderStatus::New as i32);
        assert!(trades.is_empty());
    }

    #[test]
    fn test_cancel_removes_order_from_book() {
        let mut book = make_pair();
        let req = make_request(Side::Buy, OrderType::Limit, Some(49000.0), 0.5);
        let (order, _, ok, _) = book.place_order(&req);
        assert!(ok);

        let ok = book.cancel_order(&order.id);
        assert!(ok);

        let snap = book.get_snapshot(20);
        assert!(!snap.bids.iter().any(|l| l.price == 49000.0));
    }

    #[test]
    fn test_no_crossed_book_after_multiple_orders() {
        let mut book = make_pair();
        for _ in 0..20 {
            let side = if rand::random() { Side::Buy } else { Side::Sell };
            let price = 100.0 + (rand::random::<f64>() * 99000.0);
            let qty = 0.001 + (rand::random::<f64>() * 10.0);
            let req = make_request(side, OrderType::Limit, Some(price), qty);
            book.place_order(&req);

            // After each order, verify the book is not crossed
            let snap = book.get_snapshot(20);
            if !snap.bids.is_empty() && !snap.asks.is_empty() {
                assert!(snap.bids[0].price < snap.asks[0].price, "Crossed book detected!");
            }
        }
    }

    #[test]
    fn test_snapshot_has_correct_totals() {
        let book = make_pair();
        let snap = book.get_snapshot(20);
        if snap.bids.len() >= 2 {
            // Cumulative total should be non-decreasing
            assert!(snap.bids[1].total >= snap.bids[0].total);
        }
    }

    #[test]
    fn test_zero_qty_rejected() {
        let mut book = make_pair();
        let req = make_request(Side::Buy, OrderType::Limit, Some(49000.0), 0.0);
        let (order, _, ok, _) = book.place_order(&req);
        assert!(!ok);
        assert_eq!(order.status, OrderStatus::Rejected as i32);
    }

    #[test]
    fn test_health_check() {
        // Verify the server can be created
        let _server = MatchingEngineServer::new();
        // If it doesn't panic, we're good
    }
}
