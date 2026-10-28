# =============================================================================
# Mbuni CEX — Makefile
#
# Common commands for development, testing, building, and deployment.
# If you have `just` installed, the justfile mirrors these targets with the
# naming convention from the OpenCEX 2026 spec (§15).
#
# Quick start:
#   make help           # show all targets
#   make dev            # start the dev server
#   make test           # run unit + e2e tests
#   make docker-up      # build + start the full Docker stack
#   make helm-install   # deploy to Kubernetes
# =============================================================================

# ----- Config -----
BUN        ?= bun
HELM       ?= helm
KUBECTL    ?= kubectl
DOCKER     ?= docker
PORT       ?= 3000
NAMESPACE  ?= mbuni-cex
RELEASE    ?= mbuni-cex

# Color output if stderr is a TTY
ifeq ($(shell test -t 1 && echo yes), yes)
        BLUE   := \033[34m
        GREEN  := \033[32m
        YELLOW := \033[33m
        RED    := \033[31m
        RESET  := \033[0m
endif

.DEFAULT_GOAL := help

# =============================================================================
# Targets
# =============================================================================

.PHONY: help
help: ## Show this help message
        @echo "Mbuni CEX — common commands"
        @echo ""
        @echo "Usage: make <target>"
        @echo ""
        @echo "Targets:"
        @awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(BLUE)%-22s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
        @echo ""
        @echo "Environment variables (override with VAR=value):"
        @echo "  BUN=bun                Package manager (default: bun)"
        @echo "  PORT=3000              Dev server port (default: 3000)"
        @echo "  NAMESPACE=mbuni-cex    K8s namespace (default: mbuni-cex)"
        @echo "  RELEASE=mbuni-cex      Helm release name (default: mbuni-cex)"

# ----- Development -----

.PHONY: install
install: ## Install dependencies
        $(BUN) install

.PHONY: dev
dev: ## Start the dev server (http://localhost:3000)
        $(BUN) run dev

.PHONY: lint
lint: ## Run ESLint
        $(BUN) run lint

.PHONY: clean
clean: ## Remove build artifacts + caches
        rm -rf .next out dist coverage test-results playwright-report
        rm -f dev.log server.log
        @echo "$(GREEN)✓$(RESET) Cleaned"

# ----- Database -----

.PHONY: db-push
db-push: ## Apply schema to DB (dev — uses --accept-data-loss)
        $(BUN) run db:push

.PHONY: db-generate
db-generate: ## Regenerate Prisma Client after schema changes
        $(BUN) run db:generate

.PHONY: db-migrate
db-migrate: ## Create + apply a named migration (interactive — pass NAME=foo)
        @if [ -z "$(NAME)" ]; then echo "$(RED)Usage:$(RESET) make db-migrate NAME=add_user_table"; exit 1; fi
        $(BUN) run db:migrate --name $(NAME)

.PHONY: db-migrate-deploy
db-migrate-deploy: ## Apply pending migrations (non-interactive, prod-safe)
        $(BUN) run db:migrate:deploy

.PHONY: db-seed
db-seed: ## Seed the database with demo data
        $(BUN) run db:seed

.PHONY: db-reset
db-reset: ## ⚠️ Drop all data and re-apply migrations
        @echo "$(RED)This will destroy all data. Press Ctrl+C to abort, Enter to continue.$(RESET)"
        @read _
        $(BUN) run db:reset

.PHONY: db-studio
db-studio: ## Open Prisma Studio (DB GUI on http://localhost:5555)
        $(BUN) prisma studio

.PHONY: db-check
db-check: ## Print all users + onboarding state (debug helper)
        $(BUN) tsx scripts/check-db.ts

# ----- Testing -----

.PHONY: test
test: test-unit test-e2e ## Run all tests (unit + e2e)

.PHONY: test-unit
test-unit: ## Run Vitest unit tests
        $(BUN) run test:unit

.PHONY: test-unit-watch
test-unit-watch: ## Run Vitest in watch mode
        $(BUN) run test:unit --watch

.PHONY: test-e2e
test-e2e: ## Run Playwright e2e tests (requires `make playwright-install` first)
        $(BUN) run test:e2e

.PHONY: test-e2e-ui
test-e2e-ui: ## Run Playwright e2e tests with interactive UI mode
        $(BUN) run test:e2e --ui

.PHONY: test-e2e-update
test-e2e-update: ## Update Playwright visual regression baselines after an intentional UI change
        $(BUN) run test:e2e:update

.PHONY: playwright-install
playwright-install: ## Download Playwright browser binaries (one-time)
        $(BUN) playwright install --with-deps chromium

# ----- Storybook -----

.PHONY: storybook
storybook: ## Start Storybook dev server on http://localhost:6006
        $(BUN) run storybook

.PHONY: storybook-build
storybook-build: ## Build Storybook as a static site (output: ./storybook-static)
        $(BUN) run build-storybook

# ----- Build -----

.PHONY: build
build: ## Production build (Next.js standalone)
        $(BUN) run build

.PHONY: start
start: ## Run the production server (after `make build`)
        $(BUN) run start

# ----- Docker -----

.PHONY: docker-build
docker-build: ## Build the Docker image
        $(DOCKER) build -t mbuni-cex:latest .

.PHONY: docker-up
docker-up: ## Build + start the full Docker stack (app + Postgres + Caddy)
        $(DOCKER) compose up -d --build
        @echo "$(GREEN)✓$(RESET) Stack running. App on http://localhost:3000, Caddy on http://localhost:8080"
        @echo "  Apply DB schema:  $(BUN) make db-push-docker"
        @echo "  Tail logs:        $(DOCKER) compose logs -f app"

.PHONY: docker-down
docker-down: ## Stop the Docker stack (data preserved)
        $(DOCKER) compose down

.PHONY: docker-down-volumes
docker-down-volumes: ## ⚠️ Stop the Docker stack AND delete the DB volume
        @echo "$(RED)This will destroy the database. Press Ctrl+C to abort, Enter to continue.$(RESET)"
        @read _
        $(DOCKER) compose down -v

.PHONY: docker-logs
docker-logs: ## Tail Docker logs (pass SVC=app or SVC=db)
        $(DOCKER) compose logs -f $(or $(SVC),app)

.PHONY: db-push-docker
db-push-docker: ## Apply DB schema inside the running Docker container
        $(DOCKER) compose exec app $(BUN) run db:push

.PHONY: docker-shell
docker-shell: ## Open a shell inside the running app container
        $(DOCKER) compose exec app /bin/sh

# ----- Helm / Kubernetes -----

.PHONY: helm-lint
helm-lint: ## Lint the Helm chart
        $(HELM) lint infra/k8s/

.PHONY: helm-template
helm-template: ## Render the Helm chart templates (no cluster needed)
        $(HELM) template $(RELEASE) infra/k8s/ \
                --set envSecrets.DATABASE_URL="postgresql://fake:fake@db:5432/fake" \
                --set envSecrets.NEXTAUTH_SECRET="fake-secret-for-rendering"

.PHONY: helm-install
helm-install: ## Deploy to Kubernetes (requires cluster + secrets set)
        $(HELM) upgrade --install $(RELEASE) infra/k8s/ \
                --namespace $(NAMESPACE) \
                --create-namespace \
                --atomic \
                --timeout 5m \
                $(HELM_FLAGS)

.PHONY: helm-install-prod
helm-install-prod: ## Deploy to Kubernetes with the prod values overlay
        $(HELM) upgrade --install $(RELEASE) infra/k8s/ \
                --namespace $(NAMESPACE) \
                --create-namespace \
                --atomic \
                --timeout 10m \
                -f infra/k8s/values-prod.yaml \
                $(HELM_FLAGS)

.PHONY: helm-uninstall
helm-uninstall: ## Uninstall the Helm release
        $(HELM) uninstall $(RELEASE) --namespace $(NAMESPACE)

.PHONY: k8s-pods
k8s-pods: ## List running pods in the namespace
        $(KUBECTL) get pods -n $(NAMESPACE) -l app.kubernetes.io/name=mbuni-cex

.PHONY: k8s-logs
k8s-logs: ## Tail app logs in Kubernetes
        $(KUBECTL) logs -n $(NAMESPACE) -l app.kubernetes.io/name=mbuni-cex -f

.PHONY: k8s-shell
k8s-shell: ## Open a shell in the running app pod
        @POD=$$($(KUBECTL) get pod -n $(NAMESPACE) -l app.kubernetes.io/name=mbuni-cex -o jsonpath='{.items[0].metadata.name}'); \
        $(KUBECTL) exec -n $(NAMESPACE) -it $$POD -- /bin/sh

.PHONY: k8s-port-forward
k8s-port-forward: ## Port-forward the app to localhost:3000
        $(KUBECTL) port-forward -n $(NAMESPACE) svc/$(RELEASE) 3000:80

# ----- CI helpers -----

.PHONY: ci-check
ci-check: lint test-unit build ## Run the same checks as CI (lint + unit tests + build)
        @echo "$(GREEN)✓$(RESET) All CI checks passed"
