// Mbuni CEX 2.0 — Wallet Service (Go)
// Handles: deposits, withdrawals, custody, multi-chain, address whitelist
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
)

type Config struct {
	Port        string `env:"PORT" envDefault:"8081"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"postgres://postgres:password@db:5432/mbuni_cex?sslmode=disable"`
	NATSURL     string `env:"NATS_URL" envDefault:"nats://nats:4222"`
}

func main() {
	cfg := Config{}
	env.Parse(&cfg)

	slog.Info("🦬 Mbuni CEX Wallet Service v2.0.0 starting", "port", cfg.Port)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/wallet/balances", getBalances)
	mux.HandleFunc("GET /api/wallet/deposits", getDeposits)
	mux.HandleFunc("GET /api/wallet/withdrawals", getWithdrawals)
	mux.HandleFunc("POST /api/wallet/withdraw", requestWithdrawal)
	mux.HandleFunc("GET /api/wallet/deposit-address", getDepositAddress)
	mux.HandleFunc("GET /api/wallet/whitelist", getWhitelist)
	mux.HandleFunc("POST /api/wallet/whitelist", addWhitelist)
	mux.HandleFunc("GET /api/wallet/chains", getChains)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", healthHandler)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}

	go func() {
		slog.Info("✓ Wallet Service listening", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

func getBalances(w http.ResponseWriter, r *http.Request) {
	// TODO: Query from PostgreSQL
	writeJSON(w, map[string]interface{}{
		"balances": []map[string]interface{}{
			{"asset": "USDT", "free": 245680.42, "locked": 4200.0, "usdValue": 245680.42},
			{"asset": "BTC", "free": 3.4521, "locked": 0.05, "usdValue": 279000.0},
			{"asset": "ETH", "free": 42.18, "locked": 1.2, "usdValue": 136900.0},
			{"asset": "SOL", "free": 380.5, "locked": 0, "usdValue": 67900.0},
		},
	})
}

func getDeposits(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{"deposits": []interface{}{}})
}

func getWithdrawals(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{"withdrawals": []interface{}{}})
}

func requestWithdrawal(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Asset   string  `json:"asset"`
		Chain   string  `json:"chain"`
		Amount  float64 `json:"amount"`
		Address string  `json:"address"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	// TODO: Validate, check whitelist, check balance, create withdrawal record, publish to NATS
	writeJSON(w, map[string]interface{}{"ok": true, "status": "PENDING"})
}

func getDepositAddress(w http.ResponseWriter, r *http.Request) {
	asset := r.URL.Query().Get("asset")
	chain := r.URL.Query().Get("chain")
	writeJSON(w, map[string]string{
		"address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
		"chain":   chain,
		"asset":   asset,
	})
}

func getWhitelist(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{"addresses": []interface{}{}})
}

func addWhitelist(w http.ResponseWriter, r *http.Request) {
	// TODO: Add to DB, set 24h time-lock
	writeJSON(w, map[string]bool{"ok": true})
}

func getChains(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{
		"chains": []map[string]interface{}{
			{"name": "Bitcoin", "confirmations": 3, "withdrawalFeeUSD": 8.5},
			{"name": "Ethereum", "confirmations": 12, "withdrawalFeeUSD": 4.2},
			{"name": "Solana", "confirmations": 32, "withdrawalFeeUSD": 0.05},
			{"name": "Tron", "confirmations": 20, "withdrawalFeeUSD": 1.5},
		},
	})
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
