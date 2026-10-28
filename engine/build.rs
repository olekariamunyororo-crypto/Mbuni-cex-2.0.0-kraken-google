// Build script — compiles proto files into Rust code
fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(false)  // Engine is server-only
        .out_dir("src/proto_gen")
        .compile_protos(
            &["proto/matching_engine.proto"],
            &["../proto"],
        )?;
    println!("cargo:rerun-if-changed=proto/matching_engine.proto");
    println!("cargo:rerun-if-changed=../proto/matching_engine.proto");
    Ok(())
}
