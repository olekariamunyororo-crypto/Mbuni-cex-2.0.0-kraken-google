// Mbuni CEX 2.0 — Trading Service entry point
package main

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/caarlos0/env"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type Config struct {
	Port            string `env:"PORT" envDefault:"8080"`
	EngineAddr      string `env:"ENGINE_ADDR" envDefault:"engine:50051"`
	DatabaseURL     string `env:"DATABASE_URL" envDefault:"postgres://postgres:password@db:5432/mbuni_cex?sslmode=disable"`
	NATSURL         string `env:"NATS_URL" envDefault:"nats://nats:4222"`
	RedisURL        string `env:"REDIS_URL" envDefault:"redis://dragonfly:6379"`
	JWTSecret       string `env:"JWT_SECRET" envDefault:"dev-secret"`
}

func main() {
	cfg := Config{}
	if _, err := env.Parse(&cfg); err != nil {
		slog.Error("Failed to parse config", "error", err)
		os.Exit(1)
	}

	slog.Info("🦬 Mbuni CEX Trading Service v2.0.0 starting", "port", cfg.Port)

	// Connect to the Rust matching engine via gRPC
	engineConn, err := grpc.NewClient(cfg.EngineAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		slog.Error("Failed to connect to matching engine", "addr", cfg.EngineAddr, "error", err)
		os.Exit(1)
	}
	defer engineConn.Close()
	slog.Info("✓ Connected to matching engine", "addr", cfg.EngineAddr)

	// Initialize the trading service
	svc := NewTradingService(engineConn, cfg.DatabaseURL, cfg.NATSURL)

	// Set up HTTP routes
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/orders", svc.PlaceOrderHandler)
	mux.HandleFunc("DELETE /api/orders/{id}", svc.CancelOrderHandler)
	mux.HandleFunc("GET /api/orders", svc.GetOrdersHandler)
	mux.HandleFunc("GET /api/balances", svc.GetBalancesHandler)
	mux.HandleFunc("GET /api/trades", svc.GetTradesHandler)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", readyHandler(svc))

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	slog.Info("✓ Trading Service listening", "port", cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	slog.Info("✓ Shutdown complete")
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

func readyHandler(svc *TradingService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if svc.IsReady() {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"status":"ready"}`))
		} else {
			w.WriteHeader(http.StatusServiceUnavailable)
			w.Write([]byte(`{"status":"not_ready"}`))
		}
	}
}
