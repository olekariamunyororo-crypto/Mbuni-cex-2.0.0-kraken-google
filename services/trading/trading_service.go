// Mbuni CEX 2.0 — Trading Service core logic
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
)

type TradingService struct {
	engineConn *grpc.ClientConn
	natsConn   *nats.Conn
	db         *pgxpool.Pool
	ready      bool
}

func NewTradingService(engineConn *grpc.ClientConn, dbURL, natsURL string) *TradingService {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		slog.Warn("Failed to connect to NATS, running in decoupled mode", "error", err)
	} else {
		slog.Info("✓ Connected to NATS", "url", natsURL)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var dbPool *pgxpool.Pool
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		slog.Warn("PostgreSQL connection deferred in trading service", "error", err)
	} else {
		dbPool = pool
		slog.Info("✓ Trading Service connected to PostgreSQL pool")
	}

	svc := &TradingService{
		engineConn: engineConn,
		natsConn:   nc,
		db:         dbPool,
		ready:      true,
	}

	return svc
}

func (s *TradingService) IsReady() bool {
	return s.ready
}

// PlaceOrderHandler handles POST /api/orders
func (s *TradingService) PlaceOrderHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string   `json:"userId"`
		Pair   string   `json:"pair"`
		Side   string   `json:"side"` // "BUY" or "SELL"
		Type   string   `json:"type"` // LIMIT, MARKET, IOC, FOK, POST_ONLY
		Price  *float64 `json:"price"`
		Qty    float64  `json:"qty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate inputs
	if req.Pair == "" || req.Side == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "pair, side, and type are required")
		return
	}
	if req.Qty <= 0 {
		writeError(w, http.StatusBadRequest, "qty must be positive")
		return
	}

	req.Side = strings.ToUpper(req.Side)
	req.Type = strings.ToUpper(req.Type)

	userID := req.UserID
	if userID == "" {
		userID = "alex_trader_uid"
	}

	orderID := fmt.Sprintf("ord_%d", time.Now().UnixNano())
	orderPrice := 0.0
	if req.Price != nil {
		orderPrice = *req.Price
	} else {
		// Mock market price fallback
		orderPrice = 80835.61
	}

	// 1. Pre-trade Risk & Balance Lock Check in PostgreSQL
	parts := strings.Split(req.Pair, "/")
	baseAsset := parts[0]
	quoteAsset := "USDT"
	if len(parts) > 1 {
		quoteAsset = parts[1]
	}

	if s.db != nil {
		requiredAsset := quoteAsset
		requiredAmount := req.Qty * orderPrice
		if req.Side == "SELL" {
			requiredAsset = baseAsset
			requiredAmount = req.Qty
		}

		var freeBalance float64
		err := s.db.QueryRow(r.Context(),
			"SELECT free FROM balances WHERE user_id = $1 AND asset = $2",
			userID, requiredAsset).Scan(&freeBalance)

		if err == nil && freeBalance < requiredAmount {
			writeError(w, http.StatusPaymentRequired,
				fmt.Sprintf("Insufficient %s balance: required %.4f, free %.4f", requiredAsset, requiredAmount, freeBalance))
			return
		}

		// Insert order into PostgreSQL
		_, _ = s.db.Exec(r.Context(),
			`INSERT INTO orders (id, user_id, pair, side, type, price, qty, filled_qty, status, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'NEW', NOW())`,
			orderID, userID, req.Pair, req.Side, req.Type, orderPrice, req.Qty)

		// Lock balance
		_, _ = s.db.Exec(r.Context(),
			`UPDATE balances SET free = GREATEST(0, free - $1), locked = locked + $1 
			 WHERE user_id = $2 AND asset = $3`,
			requiredAmount, userID, requiredAsset)
	}

	// 2. Publish event to NATS JetStream
	if s.natsConn != nil {
		event, _ := json.Marshal(map[string]interface{}{
			"subject":   "orders.placed",
			"orderId":   orderID,
			"pair":      req.Pair,
			"side":      req.Side,
			"type":      req.Type,
			"price":     orderPrice,
			"qty":       req.Qty,
			"userId":    userID,
			"timestamp": time.Now().UnixMilli(),
		})
		s.natsConn.Publish("orders.placed", event)
	}

	response := map[string]interface{}{
		"ok": true,
		"order": map[string]interface{}{
			"id":         orderID,
			"pair":       req.Pair,
			"side":       req.Side,
			"type":       req.Type,
			"price":      orderPrice,
			"qty":        req.Qty,
			"filledQty":  0.0,
			"status":     "NEW",
			"userId":     userID,
			"timestamp":  time.Now().UnixMilli(),
		},
	}

	writeJSON(w, http.StatusOK, response)
}

// CancelOrderHandler handles DELETE /api/orders/{id}
func (s *TradingService) CancelOrderHandler(w http.ResponseWriter, r *http.Request) {
	orderID := r.PathValue("id")
	if orderID == "" {
		writeError(w, http.StatusBadRequest, "order ID required")
		return
	}

	if s.db != nil {
		// Update order status
		_, _ = s.db.Exec(r.Context(), "UPDATE orders SET status = 'CANCELLED' WHERE id = $1", orderID)
	}

	if s.natsConn != nil {
		s.natsConn.Publish("orders.cancelled", []byte(`{"id":"`+orderID+`"}`))
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":      true,
		"orderId": orderID,
		"status":  "CANCELLED",
	})
}

// GetOrdersHandler handles GET /api/orders
func (s *TradingService) GetOrdersHandler(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "alex_trader_uid"
	}

	var ordersList []map[string]interface{}

	if s.db != nil {
		query := "SELECT id, pair, side, type, price, qty, filled_qty, status, created_at FROM orders WHERE user_id = $1"
		args := []interface{}{userID}
		if pair != "" {
			query += " AND pair = $2"
			args = append(args, pair)
		}
		query += " ORDER BY created_at DESC LIMIT $3"
		args = append(args, limit)

		rows, err := s.db.Query(r.Context(), query, args...)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, p, side, oType, status string
				var price, qty, filled float64
				var createdAt time.Time
				if err := rows.Scan(&id, &p, &side, &oType, &price, &qty, &filled, &status, &createdAt); err == nil {
					ordersList = append(ordersList, map[string]interface{}{
						"id":        id,
						"pair":      p,
						"side":      side,
						"type":      oType,
						"price":     price,
						"qty":       qty,
						"filledQty": filled,
						"status":    status,
						"timestamp": createdAt.UnixMilli(),
					})
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":     true,
		"orders": ordersList,
		"pair":   pair,
		"limit":  limit,
	})
}

// GetBalancesHandler handles GET /api/balances
func (s *TradingService) GetBalancesHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "alex_trader_uid"
	}

	if s.db != nil {
		rows, err := s.db.Query(r.Context(), "SELECT asset, free, locked FROM balances WHERE user_id = $1", userID)
		if err == nil {
			defer rows.Close()
			var balances []map[string]interface{}
			for rows.Next() {
				var asset string
				var free, locked float64
				if err := rows.Scan(&asset, &free, &locked); err == nil {
					balances = append(balances, map[string]interface{}{
						"asset":    asset,
						"free":     free,
						"locked":   locked,
						"usdValue": free + locked,
					})
				}
			}
			if len(balances) > 0 {
				writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "balances": balances})
				return
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok": true,
		"balances": []map[string]interface{}{
			{"asset": "USDT", "free": 50000.0, "locked": 0.0, "usdValue": 50000.0},
			{"asset": "BTC", "free": 1.25, "locked": 0.0, "usdValue": 101044.5},
			{"asset": "ETH", "free": 15.5, "locked": 0.0, "usdValue": 50309.9},
		},
	})
}

// GetTradesHandler handles GET /api/trades
func (s *TradingService) GetTradesHandler(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	if pair == "" {
		pair = "BTC/USDT"
	}

	var tradesList []map[string]interface{}
	if s.db != nil {
		rows, err := s.db.Query(r.Context(),
			"SELECT id, pair, price, qty, maker_side, executed_at FROM trades WHERE pair = $1 ORDER BY executed_at DESC LIMIT 50",
			pair)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id, p, side string
				var price, qty float64
				var executedAt time.Time
				if err := rows.Scan(&id, &p, &price, &qty, &side, &executedAt); err == nil {
					tradesList = append(tradesList, map[string]interface{}{
						"id":        id,
						"pair":      p,
						"price":     price,
						"qty":       qty,
						"side":      side,
						"timestamp": executedAt.UnixMilli(),
					})
				}
			}
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"ok":     true,
		"trades": tradesList,
		"pair":   pair,
	})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
