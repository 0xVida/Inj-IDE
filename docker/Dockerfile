# Get injectived from official image
FROM public.ecr.aws/l9h3g6c6/injective-core:v1.15.0 AS injective-source

FROM rust:1.85-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --fix-missing --no-install-recommends \
    git \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    jq \
    vim \
    ca-certificates \
    binaryen \
    && rm -rf /var/lib/apt/lists/*

# Copy injectived binary and its required shared library from official image
COPY --from=injective-source /usr/local/bin/injectived /usr/local/bin/injectived
COPY --from=injective-source /usr/lib/libwasmvm.*.so /usr/lib/

# Install wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Install cargo-generate pinned to a stable version
RUN cargo install cargo-generate --version 0.21.0 --locked

# Set up working directory
WORKDIR /workspace

# Keep container running
CMD ["tail", "-f", "/dev/null"]
