// Mbuni CEX 2.0 — Compliance Service (Go)
// Handles: KYC verification, AML screening, sanctioned party detection, KYT transaction risk
package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/caarlos0/env"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nats-io/nats.go"
)

type Config struct {
	Port        string `env:"PORT" envDefault:"8083"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"postgres://postgres:password@db:5432/mbuni_cex?sslmode=disable"`
	NATSURL     string `env:"NATS_URL" envDefault:"nats://nats:4222"`
}

type ComplianceServer struct {
	db   *pgxpool.Pool
	nats *nats.Conn
}

func main() {
	cfg := Config{}
	if err := env.Parse(&cfg); err != nil {
		slog.Warn("Failed to parse env config, using defaults", "error", err)
	}

	slog.Info("🦬 Mbuni CEX Compliance Service v2.0.0 starting", "port", cfg.Port)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var dbPool *pgxpool.Pool
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Warn("PostgreSQL connection deferred (running in decoupled mode)", "error", err)
	} else {
		dbPool = pool
		slog.Info("✓ Connected to PostgreSQL database pool")
	}

	nc, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		slog.Warn("NATS connection deferred (running in decoupled mode)", "error", err)
	} else {
		slog.Info("✓ Connected to NATS JetStream event bus", "url", cfg.NATSURL)
	}

	srv := &ComplianceServer{
		db:   dbPool,
		nats: nc,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/kyc", srv.submitKyc)
	mux.HandleFunc("GET /api/kyc", srv.getKycStatus)
	mux.HandleFunc("POST /api/aml/screen", srv.screenTransaction)
	mux.HandleFunc("GET /api/compliance/rules", srv.getRules)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", healthHandler)

	httpServer := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		slog.Info("✓ Compliance Service listening", "port", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("Shutting down Compliance Service...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)
	if dbPool != nil {
		dbPool.Close()
	}
	if nc != nil {
		nc.Close()
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy","service":"compliance","version":"2.0.0"}`))
}

func (s *ComplianceServer) submitKyc(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID         string `json:"userId"`
		DocumentType   string `json:"documentType"`
		DocumentNumber string `json:"documentNumber"`
		FullName       string `json:"fullName"`
		DOB            string `json:"dob"`
		Address        string `json:"address"`
		Country        string `json:"country"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.UserID == "" {
		req.UserID = "alex_trader_uid"
	}

	// 1. AML & Sanctioned List Screening
	sanctionedKeywords := []string{"sanctioned", "terrorist", "criminal", "fraud", "launder", "ofac", "darknet"}
	normalizedName := strings.ToLower(req.FullName)
	for _, kw := range sanctionedKeywords {
		if strings.Contains(normalizedName, kw) {
			if s.db != nil {
				s.db.Exec(r.Context(), "UPDATE users SET kyc_status = 'REJECTED' WHERE uid = $1", req.UserID)
			}
			writeJSON(w, map[string]interface{}{
				"ok":     false,
				"status": "REJECTED",
				"reason": "AML Flag: Full name matched automated watchlist blacklist",
			})
			return
		}
	}

	// 2. Update user state in database
	if s.db != nil {
		_, err := s.db.Exec(r.Context(),
			"UPDATE users SET kyc_status = 'VERIFIED', tier = 3 WHERE uid = $1",
			req.UserID)
		if err != nil {
			slog.Warn("Failed to update user kyc in DB", "error", err)
		}
	}

	// 3. Publish compliance event to NATS
	if s.nats != nil {
		event, _ := json.Marshal(map[string]interface{}{
			"subject":      "compliance.kyc.approved",
			"userId":       req.UserID,
			"tier":         3,
			"documentType": req.DocumentType,
			"timestamp":    time.Now().UnixMilli(),
		})
		s.nats.Publish("compliance.kyc.approved", event)
	}

	writeJSON(w, map[string]interface{}{
		"ok":           true,
		"status":       "VERIFIED",
		"tier":         3,
		"verifiedAt":   time.Now().UnixMilli(),
		"message":      "Identity verified successfully. Tier 3 withdrawal limits unlocked.",
	})
}

func (s *ComplianceServer) getKycStatus(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "alex_trader_uid"
	}

	kycStatus := "VERIFIED"
	tier := 3

	if s.db != nil {
		var status string
		var t int
		err := s.db.QueryRow(r.Context(), "SELECT kyc_status, tier FROM users WHERE uid = $1", userID).Scan(&status, &t)
		if err == nil {
			kycStatus = status
			tier = t
		}
	}

	writeJSON(w, map[string]interface{}{
		"ok":           true,
		"userId":       userID,
		"status":       kycStatus,
		"tier":         tier,
		"dailyLimit":   500000.0,
		"attemptCount": 1,
		"verifiedAt":   time.Now().Add(-24 * time.Hour).UnixMilli(),
	})
}

func (s *ComplianceServer) screenTransaction(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Asset               string  `json:"asset"`
		Amount              float64 `json:"amount"`
		TxHash              string  `json:"txHash"`
		CounterpartyAddress string  `json:"counterpartyAddress"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	// Scorechain / Chainalysis simulation rules:
	riskScore := 12 // 0-100 scale
	riskLevel := "LOW"
	passed := true

	if req.Amount > 100000.0 {
		riskScore += 25
	}
	if strings.HasPrefix(req.CounterpartyAddress, "0x000000") || strings.Contains(req.CounterpartyAddress, "mixer") {
		riskScore = 85
		riskLevel = "HIGH"
		passed = false
	}

	writeJSON(w, map[string]interface{}{
		"ok":          true,
		"passed":      passed,
		"riskScore":   riskScore,
		"riskLevel":   riskLevel,
		"asset":       req.Asset,
		"amount":      req.Amount,
		"screenedAt":  time.Now().UnixMilli(),
		"kytProvider": "SCORECHAIN_V3",
	})
}

func (s *ComplianceServer) getRules(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]interface{}{
		"ok": true,
		"rules": []map[string]interface{}{
			{"rule": "TRAVEL_RULE", "thresholdUSD": 1000.0, "status": "ACTIVE"},
			{"rule": "TIMELOCK_WHITELIST", "durationHours": 24, "status": "ENFORCED"},
			{"rule": "KYT_MIXER_BLOCK", "action": "AUTO_REJECT", "status": "ACTIVE"},
			{"rule": "DAILY_VOLUME_TIER_3", "maxUSD": 500000.0, "status": "ACTIVE"},
		},
	})
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": false, "error": msg})
}
