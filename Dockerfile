# syntax=docker/dockerfile:1.7

# =============================================================================
# Mbuni CEX — multi-stage Dockerfile
#
# Stages:
#   1. deps      — install production node_modules
#   2. builder   — install ALL deps, generate Prisma client, build Next.js
#   3. runner    — minimal runtime image with standalone Next.js server
#
# Build:
#   docker build -t mbuni-cex:latest .
#
# Run (with docker-compose.yml):
#   docker compose up -d --build
# =============================================================================

# ---------- Stage 1: deps ----------
FROM oven/bun:1.1 AS deps
WORKDIR /app

# Copy only lockfile + package.json for layer caching
COPY package.json bun.lock ./

# Install ALL dependencies (we need devDependencies for the build)
RUN bun install --frozen-lockfile

# ---------- Stage 2: builder ----------
FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Build-time env (no secrets here — runtime env is injected at deploy time)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma client + build Next.js (produces .next/standalone/)
RUN bun run db:generate
RUN bun run build

# ---------- Stage 3: runner ----------
FROM oven/bun:1.1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy the standalone Next.js server (already includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma client + schema (needed at runtime for db:push / migrations)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check — /api/session returns 200 even when not authenticated
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/session').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "server.js"]
