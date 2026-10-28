# Mbuni CEX 2.0 — Go Services Dockerfile (used for all 4 Go services)
FROM golang:1.23-slim AS builder

ARG SERVICE_NAME

WORKDIR /app

# Copy proto
COPY proto/ /app/proto/

# Copy the specific service
COPY services/${SERVICE_NAME}/ /app/services/${SERVICE_NAME}/

WORKDIR /app/services/${SERVICE_NAME}
RUN go mod download
RUN CGO_ENABLED=0 go build -o /app/server ./cmd/

# --- Runtime ---
FROM golang:1.23-slim
WORKDIR /app
COPY --from=builder /app/server /app/server

EXPOSE 8080
CMD ["/app/server"]
