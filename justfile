# =============================================================================
# Mbuni CEX — justfile
#
# Mirrors the command convention from the OpenCEX 2026 spec (§15):
#   just up          # Start all infrastructure + services
#   just engine      # Run matching engine (in this repo: not separate — runs in-app)
#   just trading     # Run trading service (in this repo: not separate — runs in-app)
#   just frontend    # Start Vite dev server (here: Next.js dev server)
#   just proto       # Regenerate code from Protobuf (here: regenerate Prisma Client)
#   just test        # Run all tests
#
# Install `just`:  https://github.com/casey/just#installation
#   macOS:   brew install just
#   Linux:   curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash
#   Windows: scoop install just
#
# List all recipes:  just --list
# Show one recipe:   just --show <recipe>
# =============================================================================

# Default recipe — show available commands
default:
    @just --list

# =============================================================================
# Development
# =============================================================================

# Start the Next.js dev server on port 3000
frontend:
    bun run dev

# Alias — `just dev` is more conventional than `just frontend`
dev: frontend

# Install dependencies
install:
    bun install

# Run ESLint
lint:
    bun run lint

# Run production build
build:
    bun run build

# Start the production server (after `just build`)
start:
    bun run start

# Remove build artifacts + caches
clean:
    rm -rf .next out dist coverage test-results playwright-report
    rm -f dev.log server.log

# =============================================================================
# Database
# =============================================================================

# Apply schema to DB (dev — uses --accept-data-loss)
db-push:
    bun run db:push

# Regenerate Prisma Client after schema changes (spec: `just proto`)
proto: db-generate

# Regenerate Prisma Client after schema changes
db-generate:
    bun run db:generate

# Create + apply a named migration (usage: just db-migrate add_user_table)
db-migrate name:
    bun run db:migrate --name {{name}}

# Apply pending migrations (non-interactive, prod-safe)
db-migrate-deploy:
    bun run db:migrate:deploy

# Seed the database with demo data
db-seed:
    bun run db:seed

# Open Prisma Studio (DB GUI on http://localhost:5555)
db-studio:
    bunx prisma studio

# Print all users + onboarding state (debug helper)
db-check:
    bunx tsx scripts/check-db.ts

# ⚠️ Drop all data and re-apply migrations
db-reset:
    @echo "This will destroy all data. Press Ctrl+C to abort, Enter to continue."
    @read _
    bun run db:reset

# =============================================================================
# Testing
# =============================================================================

# Run all tests (unit + e2e)
test: test-unit test-e2e

# Run Vitest unit tests
test-unit:
    bun run test:unit

# Run Vitest in watch mode
test-unit-watch:
    bun run test:unit --watch

# Run Playwright e2e tests (requires `just playwright-install` first)
test-e2e:
    bun run test:e2e

# Run Playwright e2e tests with interactive UI mode
test-e2e-ui:
    bun run test:e2e --ui

# Update Playwright visual regression baselines after an intentional UI change
test-e2e-update:
    bun run test:e2e:update

# Download Playwright browser binaries (one-time)
playwright-install:
    bunx playwright install --with-deps chromium

# =============================================================================
# Storybook
# =============================================================================

# Start Storybook dev server on http://localhost:6006
storybook:
    bun run storybook

# Build Storybook as a static site (output: ./storybook-static)
storybook-build:
    bun run build-storybook

# =============================================================================
# Docker
# =============================================================================

# Build the Docker image
docker-build:
    docker build -t mbuni-cex:latest .

# Build + start the full Docker stack (app + Postgres + Caddy)
up:
    docker compose up -d --build
    @echo "✓ Stack running. App on http://localhost:3000, Caddy on http://localhost:8080"
    @echo "  Apply DB schema:  just db-push-docker"
    @echo "  Tail logs:        docker compose logs -f app"

# Stop the Docker stack (data preserved)
down:
    docker compose down

# ⚠️ Stop the Docker stack AND delete the DB volume
down-volumes:
    @echo "This will destroy the database. Press Ctrl+C to abort, Enter to continue."
    @read _
    docker compose down -v

# Tail Docker logs (default: app; pass svc=db for postgres)
logs svc='app':
    docker compose logs -f {{svc}}

# Apply DB schema inside the running Docker container
db-push-docker:
    docker compose exec app bun run db:push

# Open a shell inside the running app container
docker-shell:
    docker compose exec app /bin/sh

# =============================================================================
# Helm / Kubernetes
# =============================================================================

# Lint the Helm chart
helm-lint:
    helm lint infra/k8s/

# Render the Helm chart templates (no cluster needed)
helm-template:
    helm template mbuni-cex infra/k8s/ \
        --set envSecrets.DATABASE_URL="postgresql://fake:fake@db:5432/fake" \
        --set envSecrets.NEXTAUTH_SECRET="fake-secret-for-rendering"

# Deploy to Kubernetes (requires cluster + secrets set)
helm-install namespace='mbuni-cex' release='mbuni-cex':
    helm upgrade --install {{release}} infra/k8s/ \
        --namespace {{namespace}} \
        --create-namespace \
        --atomic \
        --timeout 5m

# Deploy to Kubernetes with the prod values overlay
helm-install-prod namespace='mbuni-cex' release='mbuni-cex':
    helm upgrade --install {{release}} infra/k8s/ \
        --namespace {{namespace}} \
        --create-namespace \
        --atomic \
        --timeout 10m \
        -f infra/k8s/values-prod.yaml

# Uninstall the Helm release
helm-uninstall namespace='mbuni-cex' release='mbuni-cex':
    helm uninstall {{release}} --namespace {{namespace}}

# List running pods in the namespace
k8s-pods namespace='mbuni-cex':
    kubectl get pods -n {{namespace}} -l app.kubernetes.io/name=mbuni-cex

# Tail app logs in Kubernetes
k8s-logs namespace='mbuni-cex':
    kubectl logs -n {{namespace}} -l app.kubernetes.io/name=mbuni-cex -f

# Port-forward the app to localhost:3000
k8s-port-forward namespace='mbuni-cex' release='mbuni-cex':
    kubectl port-forward -n {{namespace}} svc/{{release}} 3000:80

# =============================================================================
# CI helpers
# =============================================================================

# Run the same checks as CI (lint + unit tests + build)
ci-check: lint test-unit build
    @echo "✓ All CI checks passed"

# =============================================================================
# Reference: matching engine + trading service
# (In the original spec these are separate Rust + Go services. In this repo
# the matching engine is a TypeScript reference impl running in-browser, so
# `just engine` and `just trading` just alias to the dev server.)
# =============================================================================

# Alias for `just dev` — in the spec this would run the Rust matching engine
engine: dev

# Alias for `just dev` — in the spec this would run the Go trading service
trading: dev
