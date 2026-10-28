// Mbuni CEX 2.0 — Trading Service (Go)
//
// Handles: order validation, balance reservation, fee calculation,
// gRPC client to Rust matching engine, NATS event publishing.
//
// Run: go run cmd/main.go

module github.com/olekariamunyororo-crypto/mbuni-cex/services/trading

go 1.23

require (
	google.golang.org/grpc v1.67.0
	google.golang.org/protobuf v1.35.1
	github.com/nats-io/nats.go v1.37.0
	github.com/jackc/pgx/v5 v5.7.0
	github.com/redis/go-redis/v9 v9.7.0
	github.com/caarlos0/env v3.4.0+incompatible
	golang.org/x/sync v0.10.0
)
