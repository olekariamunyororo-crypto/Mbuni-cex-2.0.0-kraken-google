# Mbuni CEX

[![CI/CD](https://github.com/your-org/mbuni-cex/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/your-org/mbuni-cex/actions/workflows/ci-cd.yml)
[![Preview Envs](https://github.com/your-org/mbuni-cex/actions/workflows/preview.yml/badge.svg)](https://github.com/your-org/mbuni-cex/actions/workflows/preview.yml)
[![Pages](https://github.com/your-org/mbuni-cex/actions/workflows/pages.yml/badge.svg?branch=main)](https://your-org.github.io/mbuni-cex/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Security](https://img.shields.io/badge/Security-Policy-blue?logo=shieldedperson&logoColor=white)](SECURITY.md)
[![Made with Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/tests-57%20passing-brightgreen)](#testing)
[![Storybook](https://img.shields.io/badge/Storybook-10-FF4785?logo=storybook&logoColor=white)](#storybook)
[![Renovate](https://img.shields.io/badge/Renovate-enabled-blue?logo=renovatebot&logoColor=white)](https://renovatebot.com/)
[![code style: eslint](https://img.shields.io/badge/code%20style-eslint-4B32C3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Changelog](https://img.shields.io/badge/CHANGELOG-up_to_date-success)](CHANGELOG.md)

A modern, high-performance spot cryptocurrency exchange — Rust-grade matching engine (TypeScript reference impl), Go-style microservices contract, and a React + Vite + TypeScript frontend. Originally a redesign of the Polygant OpenCEX architecture, now branded **Mbuni CEX** (Swahili for "ostrich" — see the logo).

![Mbuni CEX](public/ostrich.svg)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Quick Start (Local Dev)](#quick-start-local-dev)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Available Scripts](#available-scripts)
8. [Project Structure](#project-structure)
9. [Auth & Onboarding Flow](#auth--onboarding-flow)
10. [Production Build](#production-build)
11. [Deployment](#deployment)
    - [Option A: Vercel (easiest)](#option-a-vercel-easiest)
    - [Option B: Docker / Self-hosted VPS](#option-b-docker--self-hosted-vps)
    - [Option C: Kubernetes + Helm](#option-c-kubernetes--helm)
12. [Production Hardening Checklist](#production-hardening-checklist)
13. [Database Migrations](#database-migrations)
14. [Testing](#testing)
15. [Storybook](#storybook)
16. [Reports (GitHub Pages)](#reports-github-pages)
17. [Preview Environments](#preview-environments)
18. [Dependency management](#dependency-management)
19. [Changelog](#changelog)
20. [Security](#security)
21. [Community](#community)
22. [Troubleshooting](#troubleshooting)
23. [License](#license)

---

## Overview

Mbuni CEX is a fullstack cryptocurrency exchange demo with:

- **Matching engine** — price-time priority, all 5 order types (LIMIT, MARKET, IOC, FOK, POST_ONLY), pre-trade risk checks, NATS-style event publication. The TypeScript implementation in `src/lib/opencex/engine.ts` mirrors the production Rust contract.
- **Professional CLOB terminal** — live order book, trade tape, candlestick chart with multiple timeframes, deep order entry, open orders table.
- **Simple Swap** — multi-hop spot convert with slippage control.
- **Hybrid custody wallet** — balances, deposits, withdrawals, address whitelisting with 24h time-locks, 10 supported chains.
- **Admin back-office** — service health, users, risk alerts, trading pairs, fee tiers, live event stream.
- **Auth + onboarding** — splash screen, 3-slide welcome carousel, login/signup with NextAuth + bcrypt, 4-step onboarding wizard.
- **Mobile-first responsive UI** — bottom tab bar, bottom-sheet order entry, card layouts on mobile; full desktop grid layouts ≥ `md`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Auth | NextAuth.js v4 (Credentials provider, JWT sessions) |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) |
| Password hashing | bcryptjs |
| State | Zustand (client) + `useSession()` (auth) |
| Animations | Framer Motion |
| Charts | Custom SVG (candlestick) + Recharts (where applicable) |
| Icons | Lucide React |
| Package manager | Bun (recommended) — npm/yarn/pnpm also work |

---

## Prerequisites

| Tool | Min version | Why |
|---|---|---|
| Node.js | 20+ | Next.js 16 runtime |
| Bun | 1.1+ | Fast dev server + script runner (recommended) |
| Git | any | Cloning the repo |

If you don't have Bun, install it:

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

Or use `npm` / `yarn` / `pnpm` instead — every `bun run <script>` below has an `npm run <script>` equivalent.

---

## Quick Start (Local Dev)

```bash
# 1. Clone
git clone <your-repo-url> mbuni-cex
cd mbuni-cex

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env — see "Environment Variables" below

# 4. Create the database + apply schema
bun run db:push

# 5. (Optional) Seed demo users — admin@mbuni.cex, alex.demo@mbuni.cex, etc.
bun run db:seed

# 6. Start the dev server
bun run dev
```

Open <http://localhost:3000> in your browser. The splash screen plays for ~2 seconds, then routes you to:

- The **welcome carousel** if you're not signed in
- The **onboarding wizard** if you're signed in but haven't completed it
- The **trading terminal** if you're signed in and onboarding is complete

### Even quicker: `just` or `make`

If you have [`just`](https://github.com/casey/just) or `make` installed, common commands are aliased (matching the OpenCEX 2026 spec convention from §15):

```bash
just dev            # or: make dev          → bun run dev
just db-push        # or: make db-push      → apply schema
just db-seed        # or: make db-seed      → seed demo users
just test           # or: make test         → run unit + e2e tests
just up             # or: make docker-up    → full Docker stack
just helm-install   # or: make helm-install → deploy to Kubernetes
```

Run `just --list` or `make help` to see all available commands.

### First-run signup

1. Click **Get started** on the last welcome slide.
2. Switch to the **Sign up** tab on the auth screen.
3. Enter a display name (optional), email, and password (≥ 8 chars).
4. Walk through the 4-step onboarding wizard (experience → markets → security → review).
5. Accept the terms and click **Enter Mbuni CEX**.

Or skip signup entirely — `bun run db:seed` creates demo accounts:

| Email | Password | Tier |
|---|---|---|
| `admin@mbuni.cex` | `adminpass123` | 5 (Institutional) |
| `alex.demo@mbuni.cex` | `testpass123` | 3 (Pro) |
| `bobby.trader@example.com` | `testpass123` | 2 (Intermediate) |
| `carol.newbie@example.com` | `testpass123` | 0 (onboarding incomplete) |

Your account is now persisted in SQLite. Reload the page — the splash will play, then you'll be routed straight to the trading terminal.

---

## Environment Variables

Create a `.env` file in the project root. **Never commit this file.**

```bash
# Database — SQLite for dev (file path), PostgreSQL URL for prod
DATABASE_URL=file:./db/custom.db
# Production example (PostgreSQL):
# DATABASE_URL=postgresql://user:password@localhost:5432/mbuni_cex?schema=public

# NextAuth — REQUIRED in production
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=replace-with-a-strong-random-string-min-32-chars

# Public URL of the deployment (no trailing slash)
NEXTAUTH_URL=http://localhost:3000
# Production example:
# NEXTAUTH_URL=https://cex.your-domain.com
```

A `.env.example` file is included in the repo as a template.

### Generating a strong `NEXTAUTH_SECRET`

```bash
# macOS / Linux
openssl rand -base64 32

# Bun
bun -e "console.log(btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))))"

# Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Database Setup

This project uses Prisma. The schema lives at `prisma/schema.prisma` and defines:

- `User` — id, email, name, passwordHash, kycStatus, tier, twoFA, passkey, onboardingComplete
- `Account`, `Session`, `VerificationToken` — standard NextAuth tables
- `Onboarding` — experience, followedPairs, enable2FA, passkeyEnrolled, acceptedTerms

### Initial setup

```bash
# Create the DB file (if using SQLite) and apply the schema
bun run db:push

# Regenerate the Prisma Client (usually auto-run by db:push)
bun run db:generate
```

### Switching to PostgreSQL for production

1. Edit `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string.
3. Run `bun run db:push` (or `bun run db:migrate dev --name init` for proper migrations).

### Inspecting the database

A helper script is included:

```bash
bunx tsx scripts/check-db.ts
```

This prints every user with their onboarding state — useful for debugging the auth flow.

---

## Available Scripts

| Script | What it does |
|---|---|
| `bun run dev` | Start the Next.js dev server on port 3000 with hot reload |
| `bun run build` | Production build (runs `prisma generate` first, then Next.js standalone output) |
| `bun run start` | Run the production server (after `build`) |
| `bun run lint` | ESLint check |
| `bun run db:push` | Apply schema changes to the DB (dev — uses `--accept-data-loss`) |
| `bun run db:generate` | Regenerate the Prisma Client after schema changes |
| `bun run db:migrate` | Create + apply a named migration (interactive — pass `--name foo`) |
| `bun run db:migrate:deploy` | Apply pending migrations (non-interactive, prod-safe) |
| `bun run db:seed` | Seed the DB with demo users (admin, alex.demo, bobby, carol) |
| `bun run db:reset` | Drop all data and re-apply migrations (⚠️ destructive) |
| `bun run test:unit` | Run Vitest unit tests (matching engine, formatters) |
| `bun run test:unit:watch` | Vitest in watch mode |
| `bun run test:e2e` | Run Playwright e2e tests (requires `bunx playwright install` first) |
| `bun run test:e2e:ui` | Playwright in interactive UI mode (great for debugging) |
| `bun run test` | Run all tests (unit + e2e) |

### Makefile + justfile shortcuts

Common commands are aliased via `make` and `just` (the latter matches the OpenCEX 2026 spec convention from §15). Run `make help` or `just --list` to see all targets. Highlights:

| Command | Equivalent |
|---|---|
| `make dev` / `just dev` | `bun run dev` |
| `make test` / `just test` | `bun run test` |
| `make docker-up` / `just up` | `docker compose up -d --build` |
| `make helm-install` / `just helm-install` | `helm upgrade --install mbuni-cex infra/k8s/ ...` |
| `make ci-check` / `just ci-check` | lint + unit tests + build (what CI runs) |

---

## Project Structure

```
mbuni-cex/
├── prisma/
│   └── schema.prisma              # Database schema (User, Account, Session, Onboarding, …)
├── public/
│   └── ostrich.svg                # Brand logo + favicon
├── scripts/
│   └── check-db.ts                # DB inspection helper
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler
│   │   │   ├── signup/route.ts               # POST /api/signup
│   │   │   ├── onboarding/route.ts           # GET/POST /api/onboarding
│   │   │   └── session/route.ts              # GET /api/session
│   │   ├── globals.css           # Dark trading terminal theme + Tailwind
│   │   ├── layout.tsx            # Root layout (SessionProvider, fonts, metadata)
│   │   └── page.tsx              # Flow orchestrator (splash → welcome → auth → onboarding → app)
│   ├── components/
│   │   ├── opencex/
│   │   │   ├── auth/             # Splash, Welcome, Auth, Onboarding screens
│   │   │   ├── views/            # Trading, Markets, Swap, Wallet, Admin, Architecture
│   │   │   ├── ostrich-logo.tsx  # Brand logo (inline SVG, inherits currentColor)
│   │   │   ├── sidebar.tsx       # Desktop sidebar nav
│   │   │   ├── mobile-nav.tsx    # Mobile bottom tab bar + More drawer
│   │   │   ├── top-bar.tsx       # Top bar (responsive)
│   │   │   ├── order-book.tsx    # Live order book component
│   │   │   ├── trade-tape.tsx    # Recent trades feed
│   │   │   ├── price-chart.tsx   # SVG candlestick chart
│   │   │   ├── order-entry.tsx   # Order entry panel (all 5 order types)
│   │   │   ├── pair-selector.tsx # Trading pair dropdown
│   │   │   └── open-orders.tsx   # User's open orders table
│   │   └── ui/                   # shadcn/ui primitives (Button, Card, Tabs, …)
│   ├── lib/
│   │   ├── auth/config.ts        # NextAuth options + TypeScript module augmentation
│   │   ├── db.ts                 # Prisma client singleton
│   │   └── opencex/
│   │       ├── engine.ts         # Matching engine (price-time priority, 5 order types)
│   │       ├── store.ts          # Zustand store (engines, balances, orders, events)
│   │       ├── seed.ts           # Pairs, balances, fees, deposits, withdrawals, klines
│   │       ├── types.ts          # Domain types (Order, Trade, Balance, …)
│   │       └── format.ts         # Price/qty/USD/pct/time formatters
│   └── hooks/
│       └── use-mobile.ts         # useIsMobile() hook (768px breakpoint)
├── .env                           # Local env vars (not committed)
├── .env.example                   # Template for .env
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── eslint.config.mjs
└── README.md                      # ← you are here
```

---

## Auth & Onboarding Flow

The app has 5 stages, orchestrated by `src/app/page.tsx`:

```
   ┌─────────┐
   │ Splash  │  ~2s animated intro (always plays first)
   └────┬────┘
        │
        ▼
   ┌─────────────────────────────────────────────┐
   │ Session check (NextAuth useSession)         │
   └────┬──────────────────────┬─────────────────┘
        │                      │
   authenticated           unauthenticated
   + onboarding complete   + onboarding incomplete
        │                      │
        ▼                      ▼
   ┌─────────┐              ┌──────────────┐
   │   App   │              │  Onboarding  │
   └─────────┘              └──────┬───────┘
                                   │ complete
                                   ▼
                                ┌─────┐
                                │ App │
                                └─────┘

   unauthenticated →
        ▼
   ┌─────────┐    skip / continue    ┌──────┐
   │ Welcome │ ────────────────────► │ Auth │ ── sign in ──► (session check)
   │ (3 slides)│                     │      │
   └─────────┘                       └──────┘
```

### What's persisted

| Where | What |
|---|---|
| `User` table | email, bcrypt-hashed password, name, kycStatus, tier, twoFA, passkey, onboardingComplete |
| `Onboarding` table | experience level, followed pairs (CSV), 2FA + passkey toggles, terms acceptance |
| JWT cookie | userId, email, onboardingComplete, tier, kycStatus (30-day expiry) |

### Logout

- **Desktop**: click the logout icon in the sidebar footer (click once to arm, click again to confirm).
- **Mobile**: tap the logout icon in the top bar, or open the **More** drawer and tap **Sign out**.

---

## Production Build

```bash
# 1. Set production env vars
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://your-domain.com"
export DATABASE_URL="postgresql://user:pass@host:5432/mbuni_cex"

# 2. Install deps (use --frozen-lockfile in CI for reproducibility)
bun install --frozen-lockfile

# 3. Generate Prisma client + push schema
bun run db:generate
bun run db:push    # or: bun run db:migrate deploy

# 4. Build (produces .next/standalone/)
bun run build

# 5. Run the production server
bun run start
```

The build outputs a **standalone** Next.js server at `.next/standalone/server.js` — it includes only the necessary `node_modules` for production, so the deploy artifact is small.

### Health checks

Once running, verify:

```bash
curl https://your-domain.com/api/session
# → {"ok":false,"user":null}   (means the server is up; user just isn't signed in)
```

---

## Deployment

Mbuni CEX is a standard Next.js app — it deploys anywhere Next.js deploys. Three options below, from easiest to most production-grade.

### Option A: Vercel (easiest)

Vercel is Next.js's native platform — zero-config deploys.

1. **Push your repo to GitHub/GitLab/Bitbucket.**

2. **Import the project** at <https://vercel.com/new>.

3. **Set environment variables** in the Vercel dashboard (Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your PostgreSQL connection string (use Vercel Postgres, Neon, Supabase, or any external PG) |
   | `NEXTAUTH_SECRET` | Output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-project.vercel.app` (Vercel will give you this URL after first deploy — set it then redeploy) |

4. **Switch the database provider to PostgreSQL** (Vercel doesn't support SQLite):

   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. **Deploy.** Vercel runs `bun install` → `bun run build` automatically. The first deploy will fail because the DB schema isn't applied — fix by adding a build script:

   ```json
   // package.json
   "build": "prisma generate && next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"
   ```

   Or run `bun run db:push` from your local machine against the production `DATABASE_URL` once:

   ```bash
   DATABASE_URL="postgresql://..." bun run db:push
   ```

6. **Redeploy.** Once the DB is initialized, the app should boot.

### Option B: Docker / Self-hosted VPS

Recommended for full control. Works on any VPS (DigitalOcean, Hetzner, AWS EC2, Fly.io, Railway, etc.).

#### 1. Create a `Dockerfile`

```dockerfile
# ---------- Dockerfile ----------
FROM oven/bun:1.1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run db:generate
RUN bun run build

FROM oven/bun:1.1 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["bun", "server.js"]
```

#### 2. Create a `docker-compose.yml`

```yaml
# ---------- docker-compose.yml ----------
services:
  db:
    image: postgres:17-alpine
    restart: always
    environment:
      POSTGRES_USER: mbuni
      POSTGRES_PASSWORD: change-me-in-prod
      POSTGRES_DB: mbuni_cex
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mbuni"]
      interval: 5s
      retries: 5

  app:
    build: .
    restart: always
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://mbuni:change-me-in-prod@db:5432/mbuni_cex?schema=public"
      NEXTAUTH_SECRET: "${NEXTAUTH_SECRET}"
      NEXTAUTH_URL: "${NEXTAUTH_URL}"

volumes:
  pgdata:
```

#### 3. Create a `.env.example`

```bash
# ---------- .env.example ----------
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="replace-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

#### 4. Update `prisma/schema.prisma` for PostgreSQL

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 5. Build + run

```bash
# Generate a strong secret
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://your-domain.com"

# Build + start (PostgreSQL + app)
docker compose up -d --build

# Apply the DB schema (one-time)
docker compose exec app bun run db:push

# Tail logs
docker compose logs -f app
```

#### 6. Put Caddy / Nginx in front for TLS

Example Caddyfile:

```caddyfile
cex.your-domain.com {
  reverse_proxy localhost:3000
}
```

Caddy auto-provisions Let's Encrypt certificates. Install with `apt install caddy`, drop the Caddyfile at `/etc/caddy/Caddyfile`, and `systemctl reload caddy`.

### Option C: Kubernetes + Helm

For scale and operational maturity. Mirrors the deployment architecture described in the original OpenCEX 2026 spec (§11).

#### 1. Create a Helm chart

```text
infra/k8s/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── secret.yaml      # NEXTAUTH_SECRET, DATABASE_URL
    └── hpa.yaml         # HorizontalPodAutoscaler
```

#### 2. Example `deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mbuni-cex
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mbuni-cex
  template:
    metadata:
      labels:
        app: mbuni-cex
    spec:
      containers:
        - name: app
          image: your-registry/mbuni-cex:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: mbuni-cex-secrets
                  key: database-url
            - name: NEXTAUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: mbuni-cex-secrets
                  key: nextauth-secret
            - name: NEXTAUTH_URL
              value: "https://cex.your-domain.com"
          resources:
            requests:
              cpu: 200m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 1Gi
          livenessProbe:
            httpGet:
              path: /api/session
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/session
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

#### 3. Use a managed PostgreSQL (recommended)

Don't run Postgres inside Kubernetes unless you know what you're doing. Use **Cloud SQL**, **RDS**, **Neon**, **Supabase**, or **Crunchy Bridge** instead. Point `DATABASE_URL` at the managed instance.

#### 4. Deploy with GitOps (ArgoCD)

```bash
# One-time: create the namespace + secrets
kubectl create namespace mbuni-cex
kubectl create secret generic mbuni-cex-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=nextauth-secret='...' \
  -n mbuni-cex

# Apply the Helm chart
helm install mbuni-cex infra/k8s/ -n mbuni-cex

# Or with ArgoCD (GitOps)
argocd app create mbuni-cex \
  --repo https://github.com/your-org/mbuni-cex \
  --path infra/k8s \
  --dest-namespace mbuni-cex \
  --dest-server https://kubernetes.default.svc \
  --sync-policy auto
```

---

## Production Hardening Checklist

Before going live, work through this list:

### Secrets & config

- [ ] `NEXTAUTH_SECRET` is a strong 32+ char random string (NOT the dev fallback)
- [ ] `NEXTAUTH_URL` matches the exact public URL (including `https://`)
- [ ] `.env` is in `.gitignore` (it is by default in this scaffold)
- [ ] Database password is strong and not reused
- [ ] All secrets are in a secrets manager (Vault, AWS Secrets Manager, Doppler) for prod — not plain K8s secrets

### Database

- [ ] Switched from SQLite to PostgreSQL
- [ ] Backups are configured (daily snapshot + WAL archiving)
- [ ] Connection pooling enabled (PgBouncer / Supabase pooler / Neon pooler)
- [ ] `db:push` replaced with proper migrations (`db:migrate deploy`) in CI
- [ ] Prisma Studio is NOT exposed publicly

### Auth

- [ ] Add rate limiting on `/api/signup` and `/api/auth/callback/credentials` (e.g. `upstash/ratelimit` or `express-rate-limit`)
- [ ] Add email verification after signup (currently emails are accepted unverified)
- [ ] Add password reset flow (currently `/signup` is the only way to recover)
- [ ] Replace the simulated Passkey flow in `auth-screen.tsx` with real WebAuthn (`navigator.credentials.create` / `get`)
- [ ] Consider switching from JWT to database sessions (`session.strategy: "database"`) if you need server-side revocation
- [ ] Set `cookies.secure = true` in production (NextAuth does this automatically when `NEXTAUTH_URL` is `https://`)

### App

- [ ] `next.config.ts` has `compress: true` (default)
- [ ] CSP headers configured (`next.config.ts` → `headers()`)
- [ ] HSTS enabled (handled by your reverse proxy / Vercel)
- [ ] CORS locked down to your domain (the API is same-origin by default)
- [ ] All API routes that mutate state check the session (they do — see `getServerSession` calls)

### Ops

- [ ] Logs are aggregated (Vercel logs, or Loki/CloudWatch for self-hosted)
- [ ] Error tracking (Sentry, etc.)
- [ ] Uptime monitoring (Better Stack, Uptime Kuma, etc.)
- [ ] Runbook for: DB failover, secret rotation, deploy rollback

### Legal / compliance

- [ ] Terms of Service and Privacy Policy pages (referenced in onboarding — currently dead links)
- [ ] KYC/AML provider integration if serving regulated jurisdictions (Sumsub, Onfido, Scorechain)
- [ ] Geoblocking for restricted jurisdictions
- [ ] Cookie consent banner if serving EU users

---

## Database Migrations

In **development**, use `db:push` — it's fast and applies schema changes directly:

```bash
bun run db:push
```

In **production**, use proper migrations so you have a versioned history:

```bash
# Create a migration from your schema changes
bun run db:migrate --name add_user_table

# Apply pending migrations in prod (non-interactive)
bun run db:migrate deploy

# Reset everything (⚠️ destroys data — dev only)
bun run db:reset
```

Migrations live in `prisma/migrations/` — commit them to git.

### Switching database providers

If you started with SQLite and want to move to PostgreSQL:

1. Update `prisma/schema.prisma` `datasource.provider` from `"sqlite"` to `"postgresql"`.
2. Update `DATABASE_URL` in `.env`.
3. Delete `prisma/migrations/` (SQLite migrations don't apply to PG).
4. Run `bun run db:migrate dev --name init` to regenerate.
5. Migrate any existing user data manually (write a one-off script using Prisma Client).

---

## Testing

Mbuni CEX has **Vitest** for unit tests and **Playwright** for e2e tests. See `CONTRIBUTING.md` for the full testing guide.

### Unit tests (Vitest)

Pure-logic tests for the matching engine + formatters. Fast — runs in ~500ms.

```bash
bun run test:unit              # one-shot
bun run test:unit:watch        # watch mode
bun run test:unit -- --coverage # with coverage report (v8 provider)
```

Existing test files:

| File | What it covers |
|---|---|
| `src/lib/opencex/engine.test.ts` | All 5 order types (LIMIT, MARKET, IOC, FOK, POST_ONLY), price-time priority, FOK pre-flight liquidity check, cancel, events, snapshot math |
| `src/lib/opencex/engine.property.test.ts` | **Property-based tests** (fast-check, 500 runs each) — quantity conservation, FOK all-or-nothing, POST_ONLY maker-only, no-crossed-book invariant, IOC never rests, well-formed trades, cancel preserves book integrity |
| `src/lib/opencex/format.test.ts` | `fmtPrice`, `fmtQty`, `fmtUSD`, `fmtCompact`, `fmtPct`, `shortAddr`, `shortHash` — including null/undefined/NaN edge cases |

**Coverage**: run `bun run test:unit -- --coverage` to generate an HTML coverage report at `coverage/index.html`. The CI workflow uploads the report as an artifact on every push to `main`.

### E2e tests (Playwright)

Browser-driven tests for the full user flow + visual regression. Slower — runs against the dev server.

```bash
# One-time: download browser binaries (~150MB)
bunx playwright install --with-deps chromium

# Run all e2e tests (functional + visual regression)
bun run test:e2e

# Interactive UI mode (great for debugging)
bun run test:e2e:ui

# Update visual regression baselines after an intentional UI change
bun run test:e2e:update
```

Two test projects are configured:

- **`desktop-chrome`** — 1280×720 viewport
- **`mobile-iphone`** — iPhone 14 viewport (390×844) — tests the mobile bottom-nav + bottom-sheet order entry

Existing test files:

| File | What it covers |
|---|---|
| `tests/e2e/auth-flow.spec.ts` | splash → welcome → signup → onboarding → app → logout; login with existing user; wrong password rejection |
| `tests/e2e/trading.spec.ts` | Place LIMIT BUY that crosses → fills; switch trading pair; cancel resting order |
| `tests/e2e/visual.spec.ts` | **Visual regression** — captures screenshots of splash, all 3 welcome slides, auth (login + signup), trading terminal, markets, wallet, admin, architecture. Diffs against baselines on every run. |

### Visual regression

The `tests/e2e/visual.spec.ts` file captures screenshots of every major screen and compares them against baselines in `tests/e2e/__screenshots__/`. If a screenshot differs from the baseline by more than the threshold (1-2% pixel ratio), the test fails — catching unintended visual regressions.

Dynamic content (live prices, timestamps, chart ticks, balances) is masked out so the diff only fires on actual layout/style changes.

**After an intentional UI change**, update the baselines and commit them:

```bash
bun run test:e2e:update          # or: just test-e2e-update / make test-e2e-update
git add tests/e2e/__screenshots__/
git commit -m "test(visual): update baselines after UI refresh"
```

### Run everything

```bash
bun run test                   # unit + e2e
make test                      # via Makefile
just test                      # via justfile
make ci-check                  # lint + unit tests + build (what CI runs)
```

---

## Storybook

Component-driven development playground. Browse + develop UI components in isolation, with hot reload and visual regression support.

### Run Storybook locally

```bash
bun run storybook               # or: just storybook / make storybook
# → http://localhost:6006
```

### Build Storybook as a static site

```bash
bun run build-storybook         # or: just storybook-build / make storybook-build
# → ./storybook-static/
```

### Available stories

| Story | What it shows |
|---|---|
| `Brand/OstrichLogo` | The ostrich logo at various sizes, on different backgrounds (gradient, dark, emerald, red) |
| `Lib/Formatters` | All formatting functions (`fmtPrice`, `fmtQty`, `fmtUSD`, `fmtCompact`, `fmtPct`, `shortAddr`, `shortHash`) with edge cases — useful for visual QA |
| `Trading/OrderBook` | Live order book for BTC/ETH/SOL/DOGE pairs |
| `Trading/TradeTape` | Live trade tape for various pairs |
| `Trading/OrderEntry` | Order entry panel (all 5 order types) with pre-set BUY/SELL modes for the mobile sheet scenario |

### Adding stories

- Name the file `<component>.stories.tsx` next to the component.
- Use the Component Story Format (CSF) — see existing stories for examples.
- For components that depend on the Zustand store, use a decorator that calls `useOpenCEX((s) => s.init)` in a `useEffect`.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for full Storybook conventions.

---

## Reports (GitHub Pages)

The latest coverage + Playwright reports are published to GitHub Pages on every push to `main`:

- **Coverage report**: <https://your-org.github.io/mbuni-cex/reports/coverage/>
- **Playwright report**: <https://your-org.github.io/mbuni-cex/reports/playwright/>
- **Index page**: <https://your-org.github.io/mbuni-cex/>

These are generated by [`.github/workflows/pages.yml`](.github/workflows/pages.yml). The Playwright report includes interactive traces, screenshots, and visual regression diffs — click any test to drill in.

**One-time setup**: in your repo's Settings → Pages, set "Source" to "GitHub Actions". The workflow handles the rest.

---

## Preview Environments

Every PR automatically gets its own ephemeral deployment, so reviewers can test changes live without running anything locally.

### How it works

The [`.github/workflows/preview.yml`](.github/workflows/preview.yml) workflow:

1. **On PR open / sync / reopen**: builds a Docker image tagged `pr-<number>`, pushes it to GHCR, creates a unique namespace `mbuni-cex-pr-<number>`, deploys ephemeral PostgreSQL + Mbuni CEX via the same Helm chart as production, runs `db:push` + `db:seed` to seed demo users, and comments on the PR with the preview URL.
2. **On PR close**: uninstalls the Helm release, deletes the namespace, and confirms cleanup in a comment.

### Preview URL format

```
https://pr-<PR_NUMBER>.cex-preview.your-domain.com
```

For example, PR #42 → `https://pr-42.cex-preview.your-domain.com`.

The bot comments on the PR with the URL, the commit SHA, the namespace name, the image tag, and demo credentials.

### One-time setup (cluster admin)

1. **Wildcard DNS**: `*.cex-preview.your-domain.com` → your ingress controller's IP
2. **Wildcard TLS**: either a wildcard cert in the cluster, or cert-manager with a wildcard `ClusterIssuer` (letsencrypt-prod)
3. **Cluster access**: create a `KUBE_CONFIG_PREVIEWS` GitHub secret with base64-encoded kubeconfig for a ServiceAccount that can `create namespace`, `deploy`, `ingress`, etc.
4. **GHCR access**: the cluster needs to pull from `ghcr.io`. If the image is public, no setup needed. If private, create an `imagePullSecret` and reference it via `image.pullSecrets` in the Helm values.

### Cost considerations

- Each preview uses 1 small pod + 1 small Postgres pod — roughly 512Mi-1Gi RAM per PR
- No persistent volumes (Postgres uses `persistence.enabled=false` — data is lost when the PR closes, which is the point)
- Auto-cleanup on PR close — no orphaned namespaces
- For high-PR-volume repos, consider adding a TTL (e.g. auto-destroy previews after 7 days even if the PR is still open)

### Demo accounts on previews

Every preview is auto-seeded with the same demo accounts as the seed script:

| Email | Password | Tier |
|---|---|---|
| `admin@mbuni.cex` | `adminpass123` | 5 (Institutional) |
| `alex.demo@mbuni.cex` | `testpass123` | 3 (Pro) |
| `bobby.trader@example.com` | `testpass123` | 2 (Intermediate) |
| `carol.newbie@example.com` | `testpass123` | 0 (onboarding incomplete) |

---

## Dependency management

This repo has **both** Dependabot and Renovate configured. They serve slightly different needs — pick one (or run both).

### Dependabot (`.github/dependabot.yml`)

GitHub-native, runs on GitHub's infrastructure. Configured for:
- **npm** — weekly, groups minor+patch, ignores major bumps for next/react/prisma/next-auth (so they get reviewed individually)
- **Docker** + **docker-compose** — monthly base image updates
- **GitHub Actions** — weekly action version updates

### Renovate (`renovate.json`)

More powerful, runs via the [Renovate GitHub App](https://github.com/apps/renovate). Configured for:
- Same ecosystems as Dependabot, plus regex-based version detection for `oven/bun` in Dockerfiles + `node-version` in workflow files
- **Auto-merge patch updates for devDependencies** after CI passes (Dependabot doesn't auto-merge by default)
- **Grouped major bumps** for next/react/prisma/next-auth (separate PRs, each needs review)
- **Vulnerability alerts** at any time (don't wait for the weekly schedule)
- **Lock file maintenance** monthly (keeps transitive deps fresh)

**To enable Renovate**: install the [Renovate GitHub App](https://github.com/apps/renovate) on your repo. Once installed, it picks up `renovate.json` automatically. To disable Dependabot (if you prefer Renovate only), delete `.github/dependabot.yml`.

---

## Changelog

All notable changes are documented in [CHANGELOG.md](CHANGELOG.md), following the [Keep a Changelog](https://keepachangelog.com/) format. See the [GitHub releases page](https://github.com/your-org/mbuni-cex/releases) for versioned releases with auto-generated notes.

When opening a PR, add an entry under `[Unreleased]` at the top of the changelog. See [CONTRIBUTING.md](CONTRIBUTING.md) for the changelog conventions.

---

## Security

### Reporting a vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.** Instead, report them privately via [GitHub Security Advisories](https://github.com/your-org/mbuni-cex/security/advisories/new) or email `security@mbuni.cex` (PGP-encrypted).

We follow coordinated disclosure with a 48-hour acknowledgment SLA. See [`SECURITY.md`](SECURITY.md) for the full policy, including:

- Supported versions
- Response timeline (acknowledgment → fix → disclosure)
- Scope (what's in/out of scope)
- Safe harbor for researchers
- PGP public key (replace the placeholder with your real key)
- List of security measures already in place
- Known limitations (don't bother reporting these — we know)

### Code owners

[`.github/CODEOWNERS`](.github/CODEOWNERS) defines which teams are automatically requested as reviewers when a PR modifies specific paths. Key owners:

| Path | Owner(s) |
|---|---|
| `src/lib/opencex/engine.ts` + tests | `@your-org/engine-team` |
| `src/lib/auth/`, `src/app/api/auth/` | `@your-org/security-team` |
| `prisma/schema.prisma` | `@your-org/db-team` + `@your-org/security-team` |
| `src/components/opencex/views/admin.tsx` | `@your-org/frontend-team` + `@your-org/security-team` |
| `Dockerfile`, `infra/`, `.github/workflows/` | `@your-org/infra-team` + `@your-org/security-team` |
| `CHANGELOG.md` | `@your-org/core-maintainers` + `@your-org/release-team` |
| Everything else (default) | `@your-org/core-maintainers` |

Create these teams in your GitHub org settings (Settings → Teams), or replace `@your-org/<team>` with individual usernames until the teams exist.

---

## Community

### Discussions

[GitHub Discussions](https://github.com/your-org/mbuni-cex/discussions) is the place for Q&A, feature ideas, and showing off what you've built. We have 4 categories with templates:

| Category | Use for | Template |
|---|---|---|
| **📢 Announcements** | Release notes, roadmap updates, breaking change previews (maintainers only) | [`.github/discussions/Announcements.md`](.github/discussions/Announcements.md) |
| **💬 Q&A** | "How do I...?" questions | [`.github/discussions/Q&A.md`](.github/discussions/Q&A.md) |
| **💡 Ideas** | Feature requests, suggestions, product feedback | [`.github/discussions/Ideas.md`](.github/discussions/Ideas.md) |
| **🏆 Show & Tell** | Projects built with Mbuni CEX, tutorials, blog posts | [`.github/discussions/Show & Tell.md`](.github/discussions/Show%20%26%20Tell.md) |

### Issues

For bug reports and feature requests that need tracking, use [GitHub Issues](https://github.com/your-org/mbuni-cex/issues). Templates:

- [🐛 Bug Report](https://github.com/your-org/mbuni-cex/issues/new?template=bug_report.md) — describe / reproduce / expected / actual / environment / console output
- [✨ Feature Request](https://github.com/your-org/mbuni-cex/issues/new?template=feature_request.md) — problem / proposed solution / alternatives / mockup / scope

**When to use Discussions vs Issues:**

- **Discussion → Issue** when an Idea gets enough traction to be scheduled for work
- **Issue → Discussion** if it's actually a question, not a bug
- **Issue → Security Advisory** if it's a security vulnerability (never discuss security in public issues)

### Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full contributor guide — project setup, code style, commit conventions, PR process, testing, Storybook, changelog rules, database changes, and area-specific guidance (engine, auth, UI, infra).

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be kind. Be patient. Assume good intent.

---

## Troubleshooting

### `Error: PrismaClientInitializationError` on startup

The Prisma Client isn't generated. Run:

```bash
bun run db:generate
```

### Auth fails with "Invalid email or password" but the user exists

- Make sure `NEXTAUTH_SECRET` is the same value used when the user signed up (changing the secret invalidates all JWTs).
- Check that `NEXTAUTH_URL` matches the URL you're accessing the app from (mismatches break cookie scope).
- Verify the user record exists: `bunx tsx scripts/check-db.ts`.

### Splash screen loops forever

This usually means `useSession()` is stuck in `loading` state. Check:

- The `<SessionProvider>` is wrapping the app (it does — see `src/components/opencex/providers.tsx`).
- `/api/auth/session` returns 200 (check the Network tab).
- `NEXTAUTH_URL` is set and matches the browser URL.

### Database locked / `SQLITE_BUSY`

SQLite doesn't handle concurrent writes well. Switch to PostgreSQL for any non-trivial workload (see [Database Migrations](#database-migrations)).

### Build fails on Vercel with "Prisma Client not found"

Add `prisma generate` to the build script:

```json
"build": "prisma generate && next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/"
```

### Mobile bottom nav overlaps content

The main element has `pb-16 md:pb-0` to leave room for the bottom nav. If you customized the nav height, update that padding to match (`h-14` → `pb-14`).

### The ostrich logo doesn't show

Check that `public/ostrich.svg` exists. The `OstrichLogo` component inlines the SVG path directly, so it doesn't depend on the public file — but if you're using it as a favicon (set in `layout.tsx` `metadata.icons.icon`), the public file must exist.

### Lint errors

```bash
bun run lint
```

The project uses ESLint with `eslint-config-next`. Common fixes:

- `react-hooks/set-state-in-effect` — refactor to compute state during render instead of setting it in a `useEffect`.
- `react-hooks/exhaustive-deps` — add the missing dependency, or wrap the function in `useCallback`.

---

## License

MIT — see `LICENSE` file (or whatever license you choose for your fork). The original Polygant OpenCEX was also MIT-licensed.

---

*Built with Next.js 16, Prisma, NextAuth, Tailwind CSS 4, shadcn/ui, Framer Motion, and a TypeScript port of the OpenCEX 2026 matching engine. Branded with the running ostrich logo (Swahili: mbuni).*
