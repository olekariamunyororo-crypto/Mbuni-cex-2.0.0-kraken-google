// Mbuni CEX 2.0 — Market Data Service (Go)
// Handles: real-time order book, trade tape, klines, WebSocket distribution
package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/caarlos0/env"
	"github.com/gorilla/websocket"
)

type Config struct {
	Port       string `env:"PORT" envDefault:"8082"`
	EngineAddr string `env:"ENGINE_ADDR" envDefault:"engine:50051"`
	RedisURL   string `env:"REDIS_URL" envDefault:"redis://dragonfly:6379"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func main() {
	cfg := Config{}
	env.Parse(&cfg)

	slog.Info("🦬 Mbuni CEX Market Data Service v2.0.0 starting", "port", cfg.Port)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/ticker", getTicker)
	mux.HandleFunc("GET /api/klines", getKlines)
	mux.HandleFunc("GET /api/orderbook", getOrderBook)
	mux.HandleFunc("GET /api/trades", getTrades)
	mux.HandleFunc("/ws", handleWebSocket)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", healthHandler)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux}

	go func() {
		slog.Info("✓ Market Data Service listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down...")
	srv.Shutdown(context.Background())
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

func getTicker(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	// TODO: Get from Redis cache (updated by gRPC stream from engine)
	writeJSON(w, map[string]interface{}{
		"pair":          pair,
		"lastPrice":     80835.61,
		"priceChange":   -235.4,
		"priceChangePct": -0.29,
		"high":          82100.0,
		"low":           79800.0,
		"volume":        6160.5,
		"quoteVolume":   498000000,
	})
}

func getKlines(w http.ResponseWriter, r *http.Request) {
	// TODO: Query from TimescaleDB
	writeJSON(w, map[string]interface{}{"klines": []interface{}{}})
}

func getOrderBook(w http.ResponseWriter, r *http.Request) {
	pair := r.URL.Query().Get("pair")
	// TODO: Get from Redis cache (updated by gRPC stream from engine)
	writeJSON(w, map[string]interface{}{
		"pair": pair,
		"bids": [][]float64{{80835.0, 0.45}, {80834.9, 0.32}},
		"asks": [][]float64{{80835.1, 0.38}, {80835.2, 0.55}},
	})
}

func getTrades(w http.ResponseWriter, r *http.Request) {
	// TODO: Get from Redis cache
	writeJSON(w, map[string]interface{}{"trades": []interface{}{}})
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("WebSocket upgrade failed", "error", err)
		return
	}
	defer conn.Close()

	slog.Info("WebSocket client connected", "remote", conn.RemoteAddr())

	// TODO: Subscribe to gRPC stream from engine, forward to WebSocket
	// For now, send a ping every second
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := conn.WriteJSON(map[string]interface{}{
				"type": "ping",
				"time": time.Now().Unix(),
			}); err != nil {
				return
			}
		}
	}
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
