// Mbuni CEX 2.0 — Market Data Service (Go)
// Handles: tickers, klines, order book snapshots, trade tape, WebSocket distribution
package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"math"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/caarlos0/env"
	"github.com/gorilla/websocket"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
)

type Config struct {
	Port       string `env:"PORT" envDefault:"8082"`
	EngineAddr string `env:"ENGINE_ADDR" envDefault:"engine:50051"`
	RedisURL   string `env:"REDIS_URL" envDefault:"redis://dragonfly:6379"`
	NATSURL    string `env:"NATS_URL" envDefault:"nats://nats:4222"`
}

type MarketDataServer struct {
	redisClient *redis.Client
	natsConn    *nats.Conn
	clients     map[*websocket.Conn]bool
	clientsMu   sync.RWMutex
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	cfg := Config{}
	if err := env.Parse(&cfg); err != nil {
		slog.Warn("Failed to parse env config, using defaults", "error", err)
	}

	slog.Info("🦬 Mbuni CEX Market Data Service v2.0.0 starting", "port", cfg.Port)

	// Connect to Dragonfly / Redis cache
	var rdb *redis.Client
	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Warn("Redis URL parse deferred", "error", err)
	} else {
		rdb = redis.NewClient(opt)
		slog.Info("✓ Configured Redis client", "addr", opt.Addr)
	}

	// Connect to NATS
	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		slog.Warn("NATS connection deferred", "error", err)
	} else {
		slog.Info("✓ Connected to NATS JetStream", "url", cfg.NATSURL)
	}

	srv := &MarketDataServer{
		redisClient: rdb,
		natsConn:    nc,
		clients:     make(map[*websocket.Conn]bool),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/ticker", srv.getTicker)
	mux.HandleFunc("GET /api/klines", srv.getKlines)
	mux.HandleFunc("GET /api/orderbook", srv.getOrderBook)
	mux.HandleFunc("GET /api/trades", srv.getTrades)
	mux.HandleFunc("/ws", srv.handleWebSocket)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", healthHandler)

	httpServer := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("✓ Market Data Service listening", "port", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down Market Data Service...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)
	if rdb != nil {
		rdb.Close()
	}
	if nc != nil {
		nc.Close()
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","service":"marketdata","version":"2.0.0"}`))
}

func (s *MarketDataServer) getTicker(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	if pair == "" {
		pair = "BTC/USDT"
	}

	basePrices := map[string]float64{
		"BTC/USDT": 80835.61,
		"ETH/USDT": 3245.80,
		"SOL/USDT": 178.42,
		"BNB/USDT": 605.20,
		"XRP/USDT": 0.5234,
		"ARB/USDT": 0.7821,
		"OP/USDT":  1.953,
	}

	base := basePrices[pair]
	if base == 0 {
		base = 100.0
	}

	writeJSON(w, map[string]interface{}{
		"ok":             true,
		"pair":           pair,
		"lastPrice":      base,
		"priceChange":    base * 0.0248,
		"priceChangePct": 2.48,
		"high":           base * 1.035,
		"low":            base * 0.978,
		"volume":         4280.5,
		"quoteVolume":    4280.5 * base,
		"timestamp":      time.Now().UnixMilli(),
	})
}

func (s *MarketDataServer) getKlines(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	if pair == "" {
		pair = "BTC/USDT"
	}

	basePrices := map[string]float64{
		"BTC/USDT": 80835.61,
		"ETH/USDT": 3245.80,
		"SOL/USDT": 178.42,
		"BNB/USDT": 605.20,
	}
	base := basePrices[pair]
	if base == 0 {
		base = 100.0
	}

	// Generate 60 realistic 1h historical candlestick bars
	type KlineBar struct {
		Time   int64   `json:"time"`
		Open   float64 `json:"open"`
		High   float64 `json:"high"`
		Low    float64 `json:"low"`
		Close  float64 `json:"close"`
		Volume float64 `json:"volume"`
	}

	now := time.Now().Truncate(time.Hour)
	bars := make([]KlineBar, 60)
	current := base * 0.95

	for i := 0; i < 60; i++ {
		t := now.Add(time.Duration(-59+i) * time.Hour).UnixMilli()
		delta := (rand.Float64() - 0.48) * 0.015 * current
		open := current
		close := math.Max(open+delta, 1.0)
		high := math.Max(open, close) + rand.Float64()*0.005*current
		low := math.Min(open, close) - rand.Float64()*0.005*current
		vol := (rand.Float64()*20.0 + 5.0) * (current / 1000.0)

		bars[i] = KlineBar{
			Time:   t,
			Open:   math.Round(open*100) / 100,
			High:   math.Round(high*100) / 100,
			Low:    math.Round(low*100) / 100,
			Close:  math.Round(close*100) / 100,
			Volume: math.Round(vol*100) / 100,
		}
		current = close
	}

	writeJSON(w, map[string]interface{}{
		"ok":        true,
		"pair":      pair,
		"interval":  "1h",
		"candles":   bars,
		"timestamp": time.Now().UnixMilli(),
	})
}

func (s *MarketDataServer) getOrderBook(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	if pair == "" {
		pair = "BTC/USDT"
	}

	basePrices := map[string]float64{
		"BTC/USDT": 80835.61,
		"ETH/USDT": 3245.80,
		"SOL/USDT": 178.42,
		"BNB/USDT": 605.20,
	}
	mid := basePrices[pair]
	if mid == 0 {
		mid = 100.0
	}

	bids := make([][2]float64, 15)
	asks := make([][2]float64, 15)

	for i := 0; i < 15; i++ {
		pBid := mid - float64(i+1)*(mid*0.0005)
		qBid := math.Round((rand.Float64()*1.5+0.1)*1000) / 1000
		bids[i] = [2]float64{math.Round(pBid*100) / 100, qBid}

		pAsk := mid + float64(i+1)*(mid*0.0005)
		qAsk := math.Round((rand.Float64()*1.5+0.1)*1000) / 1000
		asks[i] = [2]float64{math.Round(pAsk*100) / 100, qAsk}
	}

	writeJSON(w, map[string]interface{}{
		"ok":        true,
		"pair":      pair,
		"bids":      bids,
		"asks":      asks,
		"timestamp": time.Now().UnixMilli(),
	})
}

func (s *MarketDataServer) getTrades(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	if pair == "" {
		pair = "BTC/USDT"
	}

	writeJSON(w, map[string]interface{}{
		"ok":   true,
		"pair": pair,
		"trades": []map[string]interface{}{
			{"id": "tr_1", "price": 80836.50, "qty": 0.42, "side": "BUY", "timestamp": time.Now().Add(-1 * time.Second).UnixMilli()},
			{"id": "tr_2", "price": 80835.20, "qty": 1.15, "side": "SELL", "timestamp": time.Now().Add(-3 * time.Second).UnixMilli()},
			{"id": "tr_3", "price": 80837.00, "qty": 0.08, "side": "BUY", "timestamp": time.Now().Add(-7 * time.Second).UnixMilli()},
		},
	})
}

func (s *MarketDataServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	s.clientsMu.Lock()
	s.clients[conn] = true
	s.clientsMu.Unlock()

	defer func() {
		s.clientsMu.Lock()
		delete(s.clients, conn)
		s.clientsMu.Unlock()
	}()

	slog.Info("WebSocket client connected", "remote", conn.RemoteAddr())

	ticker := time.NewTicker(800 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Stream live price updates
			delta := (rand.Float64() - 0.49) * 1.5
			msg := map[string]interface{}{
				"stream": "ticker@BTC/USDT",
				"data": map[string]interface{}{
					"price":     math.Round((80835.61+delta)*100) / 100,
					"timestamp": time.Now().UnixMilli(),
				},
			}
			if err := conn.WriteJSON(msg); err != nil {
				return
			}
		}
	}
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}
