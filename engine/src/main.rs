// Mbuni CEX 2.0 — Matching Engine entry point
//
// Runs the Rust matching engine as a gRPC server on port 50051.
// Consumed by the Go Trading Service.
//
// Build:  cargo build --release
// Run:    ./target/release/mbuni-engine
// Test:   cargo test

use std::net::SocketAddr;
use tracing_subscriber;

mod matching_engine;
mod proto_gen;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter("mbuni_engine=info,tower_http=info")
        .init();

    let addr: SocketAddr = "0.0.0.0:50051".parse()?;
    tracing::info!("🦬 Mbuni CEX Matching Engine v2.0.0 starting on {}", addr);

    // Create the engine + seed initial books
    let engine = matching_engine::MatchingEngineServer::new();
    engine.seed_all_pairs().await;

    tracing::info!("✓ Order books seeded for 12 trading pairs");
    tracing::info!("✓ Ready to accept orders");

    // Start the gRPC server
    tonic::transport::Server::builder()
        .accept_http1(true)
        .add_service(proto_gen::matching_engine::matching_engine_server::MatchingEngineServer::new(engine))
        .serve(addr)
        .await?;

    Ok(())
}
