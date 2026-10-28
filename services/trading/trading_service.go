// Mbuni CEX 2.0 — Trading Service core logic
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
)

type TradingService struct {
	engineConn *grpc.ClientConn
	natsConn   *nats.Conn
	ready      bool
}

func NewTradingService(engineConn *grpc.ClientConn, dbURL, natsURL string) *TradingService {
	nc, err := nats.Connect(natsURL)
	if err != nil {
		slog.Warn("Failed to connect to NATS, running without event publishing", "error", err)
	} else {
		slog.Info("✓ Connected to NATS", "url", natsURL)
	}

	svc := &TradingService{
		engineConn: engineConn,
		natsConn:   nc,
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
		Pair      string  `json:"pair"`
		Side      string  `json:"side"`       // "BUY" or "SELL"
		Type      string  `json:"type"`       // LIMIT, MARKET, IOC, FOK, POST_ONLY
		Price     *float64 `json:"price"`
		Qty       float64 `json:"qty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Validate
	if req.Pair == "" || req.Side == "" || req.Type == "" {
		writeError(w, http.StatusBadRequest, "pair, side, and type are required")
		return
	}
	if req.Qty <= 0 {
		writeError(w, http.StatusBadRequest, "qty must be positive")
		return
	}

	// TODO: Get user ID from JWT context
	userID := "demo_user"

	// TODO: Pre-trade balance check
	// For now, just forward to the engine

	// In a real implementation, this would:
	// 1. Validate user has sufficient balance (query PostgreSQL or Redis cache)
	// 2. Reserve the balance (atomic operation)
	// 3. Forward the order to the Rust matching engine via gRPC
	// 4. On fill: update balances in PostgreSQL
	// 5. Publish event to NATS (orders.placed, trades.executed)

	// Simulated response for now
	response := map[string]interface{}{
		"ok": true,
		"order": map[string]interface{}{
			"id":         fmt.Sprintf("ord_%d", time.Now().UnixNano()),
			"pair":       req.Pair,
			"side":       req.Side,
			"type":       req.Type,
			"price":      req.Price,
			"qty":        req.Qty,
			"filledQty":  req.Qty, // Auto-fill for demo
			"status":     "FILLED",
			"userId":     userID,
			"timestamp":  time.Now().UnixMilli(),
		},
	}

	// Publish event to NATS
	if s.natsConn != nil {
		event, _ := json.Marshal(map[string]interface{}{
			"subject":   "orders.placed",
			"pair":      req.Pair,
			"side":      req.Side,
			"qty":       req.Qty,
			"userId":    userID,
			"timestamp": time.Now().UnixMilli(),
		})
		s.natsConn.Publish("orders.placed", event)
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

	// TODO: Forward cancel to the matching engine via gRPC
	// TODO: Release reserved balance

	if s.natsConn != nil {
		s.natsConn.Publish("orders.cancelled", []byte(`{"id":"`+orderID+`"}`))
	}

	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
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

	// TODO: Query from PostgreSQL
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"orders": []interface{}{},
		"pair":   pair,
		"limit":  limit,
	})
}

// GetBalancesHandler handles GET /api/balances
func (s *TradingService) GetBalancesHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Query from PostgreSQL
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"balances": []map[string]interface{}{
			{"asset": "USDT", "free": 245680.42, "locked": 4200.0, "usdValue": 245680.42},
			{"asset": "BTC", "free": 3.4521, "locked": 0.05, "usdValue": 279000.0},
			{"asset": "ETH", "free": 42.18, "locked": 1.2, "usdValue": 136900.0},
		},
	})
}

// GetTradesHandler handles GET /api/trades
func (s *TradingService) GetTradesHandler(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	limit := 50
	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil {
			limit = v
		}
	}

	// TODO: Query from PostgreSQL
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"trades": []interface{}{},
		"pair":   pair,
		"limit":  limit,
	})
}

// --- Helpers ---

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
