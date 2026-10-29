// Build script — compiles proto files into Rust code
fn main() -> Result<(), Box<dyn std::error::Error>> {
    std::fs::create_dir_all("src/proto_gen")?;
    tonic_build::configure()
        .build_server(true)
        .build_client(false) // Engine is server-only
        .out_dir("src/proto_gen")
        .compile_protos(&["proto/matching_engine.proto"], &["proto", "../proto"])?;
    println!("cargo:rerun-if-changed=proto/matching_engine.proto");
    println!("cargo:rerun-if-changed=../proto/matching_engine.proto");
    Ok(())
}
