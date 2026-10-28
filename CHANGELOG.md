# Changelog

All notable changes to Mbuni CEX are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For a complete diff between any two versions, see the
[GitHub releases page](https://github.com/your-org/mbuni-cex/releases).

---

## [Unreleased]

### Added — Documentation & Community
- `SECURITY.md` — responsible disclosure policy with response timeline (48h acknowledgment, 90/180-day fix SLAs), PGP key placeholder, scope (in/out), safe harbor, list of security measures already in place, known limitations
- `.github/CODEOWNERS` — automatic reviewer assignment by area (engine, auth, frontend, db, infra, security, docs, release). Default: `@your-org/core-maintainers`; security-sensitive paths (auth, schema, infra, CI) get `@your-org/security-team` as a co-owner
- `.github/discussions/` — 4 GitHub Discussions category templates: Announcements (maintainers only), Q&A, Ideas, Show & Tell
- README sections: Preview Environments, Security, Community

### Added — CI/CD
- `.github/workflows/preview.yml` — ephemeral preview environments per PR. Builds a `pr-<number>`-tagged Docker image, creates a unique namespace `mbuni-cex-pr-<number>`, deploys ephemeral PostgreSQL + Mbuni CEX via the same Helm chart as production, auto-seeds demo users, comments on the PR with the preview URL. Auto-destroys on PR close. Requires `KUBE_CONFIG_PREVIEWS` secret + wildcard DNS + wildcard TLS.

### Planned
- Real WebAuthn passkey enrollment (replacing the simulated flow)
- Email verification via SMTP
- Password reset flow
- KYC document upload
- Stop-limit + OCO order types
- Order book depth chart (TradingView-style)
- WebSocket-based live updates (currently the matching engine ticks via setInterval)

---

## [1.0.0] — 2026-10-24

Initial release. Branded "Mbuni CEX" (Swahili for ostrich — see the logo).
Originally a redesign of the Polygant OpenCEX architecture, rebranded from
"OpenCEX 2026".

### Added — Application

#### Matching engine (`src/lib/opencex/engine.ts`)
- TypeScript reference implementation of the production Rust matching engine contract
- Price-time priority matching
- All 5 order types from the spec (§5): LIMIT, MARKET, IOC, FOK, POST_ONLY
- Pre-trade risk checks (zero qty, non-positive price, POST_ONLY crossing)
- FOK pre-flight liquidity check (rejects before touching the book if can't fully fill)
- NATS-style event publication (`orders.placed`, `orders.filled`, `trades.executed`, `balances.updated`, `orders.cancelled`)
- Snapshot generation (bids sorted desc, asks sorted asc, spread, midPrice, cumulative totals)
- Order cancellation by ID
- Simulated bot activity (market-maker rebalancing + taker orders every 1.2s)

#### Trading terminal (`src/components/opencex/views/trading.tsx`)
- Live order book with depth visualization (red/green bars, spread, mid-price)
- Live trade tape (filterable by pair)
- Custom SVG candlestick chart with 1m/5m/15m/1h/4h timeframes, hover crosshair, last-price line, volume bars, OHLC legend
- Order entry panel supporting all 5 order types
- Buy/Sell toggle with percent buttons (25/50/75/100% of available)
- Live cost + fee calculation
- Balance reservation + release
- Open orders table with cancel
- 12 trading pairs (BTC, ETH, SOL, BNB, XRP, ARB, OP, DOGE, MATIC, AVAX, LINK, TON — all vs USDT)
- Pair selector with search, favorites, 24h stats

#### Mobile experience
- Bottom tab bar (Trade / Markets / Swap / Wallet / More) with safe-area inset padding
- "More" drawer (shadcn Drawer) for Admin, Architecture, portfolio summary, user info, logout
- Mobile trading terminal: chart at top, swipeable Book/Trades/Orders tabs, floating Buy/Sell buttons
- Bottom-sheet order entry (shadcn Sheet, 80vh) pre-set to the chosen side, auto-closes on submit
- All other views (Markets, Swap, Wallet, Admin, Architecture) responsive with card layouts on mobile

#### Other views
- **Markets** — All-pairs overview with All/Favorites/Gainers/Losers tabs, mobile card list
- **Swap** — Simple spot convert with multi-hop routing (direct, inverse, USDT-bridged), slippage control
- **Wallet** — Portfolio summary, balances (mobile card list / desktop table), deposits, withdrawals, address whitelist with 24h time-locks, supported chains reference
- **Admin** — Service health (7 services with p99 latency, /readyz, uptime, version), users, risk alerts, custody controls, trading pairs, fee tiers (6 tiers, 0–18 bps), live NATS event stream
- **Architecture** — C4 container diagram, full tech-stack matrix, performance targets, NATS subjects, phased roadmap, in-browser engine note

#### Auth + onboarding
- Splash screen (~2s) with animated ostrich logo, pulsing glow, orbiting ₿ coin, loading bar
- 3-slide welcome carousel:
  1. Matching Engine — animated order book visual + "p99 < 500µs" badge
  2. Hybrid Custody — floating coin grid (8 coins) + chain label chips
  3. Pro CLOB Terminal — stylized candlestick chart + BUY/SELL buttons
- Auth screen with login/signup tabs, password show/hide, Passkey button (simulated WebAuthn)
- 4-step onboarding wizard:
  1. Experience (Beginner T0 / Intermediate T1 / Professional T3 / Institutional T5)
  2. Markets (12-pair grid with star to follow/unfollow)
  3. Security (2FA toggle + Passkey toggle with animated switches)
  4. Review (summary + Terms acceptance)
- Flow orchestration via stage machine in `page.tsx` (splash → welcome → auth → onboarding → app)

#### Branding
- Running ostrich logo (Swahili: mbuni) — inlined SVG component (`OstrichLogo`)
- Logo appears in sidebar header, splash, auth, onboarding, architecture views
- Favicon (`public/ostrich.svg`)
- Dark trading terminal theme (OKLCH palette with emerald/red semantic colors)

### Added — Backend

#### Database (Prisma + SQLite/PostgreSQL)
- `User` — id, email, name, passwordHash, kycStatus, tier, twoFA, passkey, onboardingComplete, timestamps
- `Account`, `Session`, `VerificationToken` — standard NextAuth tables
- `Onboarding` — experience, followedPairs (CSV), enable2FA, passkeyEnrolled, acceptedTerms, timestamps
- Schema at `prisma/schema.prisma`
- Seed script (`prisma/seed.ts`) — creates 4 demo users (admin, alex.demo, bobby, carol), idempotent

#### API routes
- `POST /api/auth/[...nextauth]` — NextAuth handler (Credentials provider, JWT strategy, 30-day sessions)
- `POST /api/signup` — email validation, password ≥8 chars, duplicate detection, bcrypt hashing (10 rounds)
- `GET/POST /api/onboarding` — save/retrieve onboarding preferences (authenticated)
- `GET /api/session` — session check for client-side routing

### Added — Infrastructure

#### Docker
- Multi-stage `Dockerfile` (deps → builder → runner) based on `oven/bun:1.1`
- Non-root user (`nextjs:nodejs`, uid 1001)
- `HEALTHCHECK` against `/api/session`
- `.dockerignore` (excludes node_modules, .next, .env*, db/*.db, IDE files, docs, infra)
- `docker-compose.yml` — 3-service stack: PostgreSQL 17 (healthcheck + persistent volume), app (built from Dockerfile), Caddy 2.8 (auto-TLS reverse proxy on ports 80/443)
- `infra/caddy/Caddyfile` — parameterized via `{$DOMAIN}`, security headers (HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, CSP), long-cache for `/_next/static/*`

#### Helm chart (`infra/k8s/`)
- `Chart.yaml` (v2 API, appVersion 1.0.0)
- `values.yaml` (~140 lines) — every knob documented: image, replicaCount, autoscaling, resources, service, ingress, config, envSecrets, secretExistingSecretName, probes, securityContext, nodeSelector/tolerations/affinity/topologySpreadConstraints, podDisruptionBudget, serviceAccount, migration, networkPolicy
- `values-prod.yaml` — production overlay (3→20 replicas with HPA, tighter resources, topology spread across AZs, NetworkPolicy enabled, `prisma migrate deploy`, PDB minAvailable: 2)
- 9 templates (all `helm lint` clean): ServiceAccount, Secret, ConfigMap, Deployment (rolling update, envFrom, probes, tmpfs for `.next/cache`, checksum annotations), Service, Ingress (TLS), HPA (CPU+memory with stabilization), PDB, migration-job (pre-install/pre-upgrade Helm hook), NetworkPolicy
- `_helpers.tpl` — name/fullname/chart/labels/selectorLabels/serviceAccountName/secretName helpers
- `infra/k8s/README.md` — chart docs with 3 secret-management strategies (command-line `--set`, ExternalSecrets Operator, SealedSecrets) + ArgoCD GitOps setup

#### CI/CD (`.github/workflows/ci-cd.yml`)
- 5-job pipeline:
  1. **build** — lint + unit tests (with coverage) + build, uploads standalone artifact + coverage report
  2. **e2e** — installs Playwright, applies DB schema, seeds demo users, runs e2e tests, uploads Playwright report + traces + visual regression diffs on failure, comments on PRs when visual regression fails
  3. **docker** — builds + pushes Docker image to GHCR with smart tagging (branch, semver, sha, latest)
  4. **deploy-staging** — Helm upgrade on push to main/master with `KUBE_CONFIG_STAGING` secret
  5. **deploy-production** — Helm upgrade with `values-prod.yaml` on `v*.*.*` tags OR manual dispatch, creates GitHub Release with auto-generated notes
- Concurrency control (cancels in-progress runs for the same ref)
- Least-privilege permissions (`contents: read`, `packages: write`, `pull-requests: write`)
- Commented-out Vercel deploy job included for teams that prefer Vercel

#### Dependabot + Renovate
- `.github/dependabot.yml` — 4 ecosystems (npm weekly, docker monthly, docker-compose monthly, github-actions weekly), groups minor+patch, ignores major bumps for next/react/prisma/next-auth
- `renovate.json` — alternative to Dependabot with more aggressive grouping (separate major bumps for next/react/prisma, grouped everything else)

#### GitHub templates
- `.github/PULL_REQUEST_TEMPLATE.md` — 9 type-of-change checkboxes, 9-item checklist, screenshots, notes for reviewers
- `.github/ISSUE_TEMPLATE/bug_report.md` — describe/reproduce/expected/actual/screenshots/environment/console output
- `.github/ISSUE_TEMPLATE/feature_request.md` — problem/proposed solution/alternatives/mockup/scope checklist

### Added — Testing

#### Unit tests (Vitest)
- `vitest.config.ts` — Node environment, v8 coverage, `@/` alias, excludes shadcn primitives
- `src/lib/opencex/engine.test.ts` — 22 tests covering all 5 order types, price-time priority, FOK pre-flight check, POST_ONLY rejection, cancel, events, snapshot math
- `src/lib/opencex/engine.property.test.ts` — 9 property-based tests (fast-check, 500 runs each = ~4,500 cases): quantity conservation, FOK all-or-nothing, POST_ONLY maker-only, no-crossed-book invariant, IOC never rests, well-formed trades, trade aggressor side, snapshot read-only, cancel preserves book integrity
- `src/lib/opencex/format.test.ts` — 26 tests for all formatters with null/undefined/NaN edge cases

#### E2e tests (Playwright)
- `playwright.config.ts` — 2 projects (desktop-chrome 1280×720, mobile-iphone iPhone 14 390×844), auto-starts dev server, serial execution, trace + screenshot + video on failure
- `tests/e2e/auth-flow.spec.ts` — splash → welcome → signup → onboarding → app → logout; login with existing user; wrong password rejection
- `tests/e2e/trading.spec.ts` — place LIMIT BUY that crosses → fills; switch trading pair; cancel resting order
- `tests/e2e/visual.spec.ts` — 11 visual regression tests (splash, 3 welcome slides, auth login+signup, trading terminal, markets, wallet, admin, architecture) with dynamic content masked

#### Pre-commit hook (husky + lint-staged)
- `.husky/pre-commit` — runs lint-staged (eslint --fix on staged TS/TSX), full Vitest run, secret scan (NEXTAUTH_SECRET, password, api_key, sk_live, ghp, AKIA patterns with placeholder filter)
- `.lintstagedrc.json` — eslint on TS/TSX/JS/JSX, prettier on JSON/MD/YAML
- Auto-installs on `bun install` via `prepare` script

### Added — Documentation

- `README.md` (~890 lines) — 16-section guide with 7 badges, TOC, quick start, env vars, DB setup, all scripts, project structure, auth flow diagram, production build, 3 deployment options (Vercel / Docker / Kubernetes), production hardening checklist (25+ items), DB migrations, testing (unit + property + e2e + visual regression), troubleshooting (8 common issues)
- `CONTRIBUTING.md` (~620 lines) — Code of Conduct, project setup, dev workflow, code style (ESLint rules, formatting, TS rules, React rules, Zustand selector rules, Tailwind rules, accessibility), commit conventions (Conventional Commits), PR process, testing (unit + property + e2e + visual regression + pre-commit hook), DB changes, working on specific areas (engine, auth, UI, infra), releasing, getting help
- `LICENSE` — MIT
- `infra/k8s/README.md` — Helm chart docs
- `.env.example` — env template

### Added — Tooling

- `Makefile` — 25+ targets with `make help` (dev, build, lint, db, test, docker, helm, k8s, ci-check)
- `justfile` — mirrors the OpenCEX 2026 spec convention from §15 (`just up`, `just engine`, `just trading`, `just frontend`, `just proto`, `just test`)
- `scripts/check-db.ts` — DB inspection helper (prints users + onboarding state)

### Added — Dependencies

#### Runtime
- `next` 16, `react` 19, `react-dom` 19
- `next-auth` 4 (Credentials provider, JWT sessions)
- `@prisma/client` 6, `prisma` 6
- `bcryptjs` 3 (password hashing)
- `zustand` 5 (client state)
- `@tanstack/react-query` 5 (server state — used in patterns)
- `framer-motion` 12 (animations)
- `lucide-react` 0.525 (icons)
- `tailwindcss` 4, `tailwindcss-animate`, `tw-animate-css`
- shadcn/ui primitives (60+ components in `src/components/ui/`)
- Full Radix UI primitive set (accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip)
- `class-variance-authority`, `clsx`, `tailwind-merge` (cn utility)
- `cmdk` (command palette)
- `react-hook-form`, `@hookform/resolvers`, `zod` (forms + validation)
- `react-resizable-panels` (resizable layouts)
- `recharts` (charts — used sparingly, mostly custom SVG)
- `react-markdown`, `react-syntax-highlighter` (markdown rendering)
- `react-day-picker`, `date-fns` (date handling)
- `sonner` (toast notifications)
- `vaul` (drawer component)
- `next-themes` (theme switching)
- `next-intl` (i18n)
- `uuid` (ID generation)
- `sharp` (image optimization)

#### Dev
- `vitest` 5, `@playwright/test` 1.64
- `fast-check` 4 (property-based testing)
- `husky` 9, `lint-staged` 17 (pre-commit hooks)
- `eslint` 9, `eslint-config-next` 16
- `typescript` 5
- `bun-types`

### Security
- bcrypt password hashing (10 rounds)
- NextAuth JWT sessions (30-day expiry)
- Non-root Docker user (uid 1001)
- Container security context (drop ALL capabilities, no privilege escalation)
- Caddy security headers (HSTS, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, CSP)
- Pre-commit secret scan
- Withdrawal address whitelisting with 24h time-locks (in-app demo)
- Hot wallet caps + complete audit trail (in-app demo)

### Known limitations
- Passkey flow is simulated (no real WebAuthn)
- No email verification after signup
- No password reset flow
- No KYC document upload
- No real WebSocket — matching engine ticks via setInterval
- Stop-limit / OCO order types not implemented
- SQLite in dev (PostgreSQL recommended for prod — schema is provider-agnostic)
- `NEXTAUTH_SECRET` defaults to a known dev value — must be rotated for prod

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR** (1.x.x → 2.0.0) — breaking changes (API, DB schema, auth)
- **MINOR** (1.0.x → 1.1.0) — new features, backward-compatible
- **PATCH** (1.0.0 → 1.0.1) — bug fixes, backward-compatible

Pre-release versions use suffixes: `1.1.0-rc.1`, `1.1.0-beta.2`, etc.

---

## How to add a changelog entry

When opening a PR, add an entry under `[Unreleased]` at the top of this file
under the appropriate section:

- `### Added` — new features
- `### Changed` — changes in existing functionality
- `### Deprecated` — soon-to-be removed features
- `### Removed` — now removed features
- `### Fixed` — bug fixes
- `### Security` — vulnerability fixes

Example:

```markdown
## [Unreleased]

### Added
- Stop-limit order type (`feat(trading): add stop-limit orders`)
```

When a release is cut, rename `[Unreleased]` to `[1.1.0] — YYYY-MM-DD` and
start a fresh `[Unreleased]` section above it. The CI/CD pipeline
auto-creates the GitHub Release with `softprops/action-gh-release` when a
`v*.*.*` tag is pushed.

---

[Unreleased]: https://github.com/your-org/mbuni-cex/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/mbuni-cex/releases/tag/v1.0.0
