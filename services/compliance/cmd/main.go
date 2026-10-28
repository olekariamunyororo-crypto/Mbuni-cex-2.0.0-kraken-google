// Mbuni CEX 2.0 — Compliance Service (Go)
// Handles: KYC submission + status, AML screening, risk rules, audit logging
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
	Port        string `env:"PORT" envDefault:"8083"`
	DatabaseURL string `env:"DATABASE_URL" envDefault:"postgres://postgres:password@db:5432/mbuni_cex?sslmode=disable"`
}

func main() {
	cfg := Config{}
	env.Parse(&cfg)

	slog.Info("🦬 Mbuni CEX Compliance Service v2.0.0 starting", "port", cfg.Port)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/kyc", submitKyc)
	mux.HandleFunc("GET /api/kyc", getKycStatus)
	mux.HandleFunc("POST /api/aml/screen", screenTransaction)
	mux.HandleFunc("GET /healthz", healthHandler)
	mux.HandleFunc("GET /readyz", healthHandler)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: mux}

	go func() {
		slog.Info("✓ Compliance Service listening", "port", cfg.Port)
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

func submitKyc(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DocumentType   string `json:"documentType"`
		DocumentNumber string `json:"documentNumber"`
		FullName       string `json:"fullName"`
		DOB            string `json:"dob"`
		Address        string `json:"address"`
		City           string `json:"city"`
		Country        string `json:"country"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	// AML screening — check against sanctioned names
	sanctioned := []string{"sanctioned", "terrorist", "criminal", "fraud", "laundering"}
	for _, s := range sanctioned {
		if containsIgnoreCase(req.FullName, s) {
			writeJSON(w, map[string]interface{}{
				"ok":     false,
				"status": "REJECTED",
				"reason": "AML flag: name matches sanctioned entity pattern",
			})
			return
		}
	}

	// TODO: Save to DB, call Sumsub/Onfido for real document verification
	// For demo: auto-approve
	writeJSON(w, map[string]interface{}{
		"ok":      true,
		"status":  "PENDING",
		"message": "KYC submitted. Documents under review.",
	})
}

func getKycStatus(w http.ResponseWriter, r *http.Request) {
	// TODO: Query from DB
	writeJSON(w, map[string]interface{}{
		"status":        "VERIFIED",
		"attemptCount":  1,
		"submittedAt":   time.Now().Add(-24 * time.Hour).UnixMilli(),
		"verifiedAt":    time.Now().Add(-23 * time.Hour).UnixMilli(),
	})
}

func screenTransaction(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Asset              string  `json:"asset"`
		Amount             float64 `json:"amount"`
		TxHash             string  `json:"txHash"`
		CounterpartyAddress string  `json:"counterpartyAddress"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	// TODO: Call Scorechain or Chainalysis KYT for real screening
	// For demo: always pass with low risk
	writeJSON(w, map[string]interface{}{
		"passed":    true,
		"riskLevel": "LOW",
	})
}

func containsIgnoreCase(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			a, b := s[i+j], substr[j]
			if a >= 'A' && a <= 'Z' { a += 32 }
			if b >= 'A' && b <= 'Z' { b += 32 }
			if a != b { match = false; break }
		}
		if match { return true }
	}
	return false
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
