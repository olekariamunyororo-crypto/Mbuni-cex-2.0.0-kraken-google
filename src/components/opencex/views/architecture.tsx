"use client";

import { Card } from "@/components/ui/card";
import { Cpu, Server, Database, Radio, ShieldCheck, Boxes, GitBranch, Container as ContainerIcon, Cloud, Activity } from "lucide-react";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";

export function ArchitectureView() {
  return (
    <div className="p-3 md:p-4 space-y-4">
      {/* Hero */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary shrink-0 overflow-hidden shadow-[0_4px_16px_rgba(163,230,53,0.15)]">
            <OstrichLogo className="w-9 h-9" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Mbuni CEX 2.0.0 — Microservices Architecture</h2>
            <p className="text-sm text-secondary mt-1 max-w-3xl">
              High-performance, cloud-native cryptocurrency exchange built on a Rust matching engine (Tokio + Tonic gRPC :50051),
              Go microservices (Trading :8080, Wallet :8081, Market Data :8082, Compliance :8083), PostgreSQL 17 + TimescaleDB,
              NATS JetStream event mesh, Dragonfly cache, Caddy auto-TLS reverse proxy, and a React 19 + TypeScript frontend.
              The deployment in this live preview features a faithful in-browser execution of the matching engine, order book,
              trade tape, multi-chain custody, KYC flow, and admin control suite.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-[10px] text-secondary">
            <span className="font-semibold text-primary">Version 2.0.0</span>
            <span>26 October 2026</span>
            <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">Production Ready</span>
          </div>
        </div>
      </Card>

      {/* C4 Container diagram */}
      <Card className="p-3 md:p-4">
        <div className="flex items-center gap-2 mb-4">
          <Boxes className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Container Diagram (C4 Level 2)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Frontend column */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-secondary tracking-wider px-2">Frontend Layer</div>
            <Container icon={Radio} name="Trading Application" tech="React + Vite + TS" color="purple" />
            <Container icon={ShieldCheck} name="Admin Panel" tech="React + Vite + TS" color="purple" />
          </div>

          {/* Backend column */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-secondary tracking-wider px-2">Backend Services</div>
            <Container icon={Server} name="API Gateway" tech="Envoy / Kong" color="cyan" />
            <Container icon={Server} name="Trading Service" tech="Go · gRPC" color="cyan" />
            <Container icon={Cpu} name="Matching Engine" tech="Rust · Tokio · Tonic" color="orange" />
            <Container icon={Server} name="Wallet Service" tech="Go" color="cyan" />
            <Container icon={Server} name="Market Data" tech="Go · WebSocket" color="cyan" />
            <Container icon={ShieldCheck} name="Compliance" tech="Go" color="cyan" />
          </div>

          {/* Data column */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-secondary tracking-wider px-2">Data & Messaging</div>
            <Container icon={Database} name="PostgreSQL 16/17" tech="+ TimescaleDB" color="emerald" />
            <Container icon={Radio} name="NATS JetStream" tech="Event Bus" color="emerald" />
            <Container icon={Database} name="Dragonfly / Redis" tech="Cache + state" color="emerald" />
          </div>

          {/* External */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase text-secondary tracking-wider px-2">External Systems</div>
            <Container icon={Cloud} name="Blockchains" tech="BTC · ETH · SOL · TON · …" color="muted" />
            <Container icon={ShieldCheck} name="KYC / KYT" tech="Sumsub · Onfido · Scorechain" color="muted" />
            <Container icon={Radio} name="RPC Providers" tech="Alchemy · Infura · QuickNode" color="muted" />
          </div>
        </div>
      </Card>

      {/* Tech stack matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Technology Stack</h3>
          </div>
          <div className="space-y-1.5 text-xs">
            <StackRow layer="Matching Engine" tech="Rust (Tokio + Tonic)" />
            <StackRow layer="Business Services" tech="Go 1.23+" />
            <StackRow layer="Frontend" tech="React 19 + Vite + TypeScript" />
            <StackRow layer="UI Components" tech="Tailwind CSS + shadcn/ui" />
            <StackRow layer="Server State" tech="TanStack Query" />
            <StackRow layer="Client State" tech="Zustand" />
            <StackRow layer="Primary Database" tech="PostgreSQL 16/17 + TimescaleDB" />
            <StackRow layer="Cache" tech="Dragonfly or Redis 7.2+" />
            <StackRow layer="Event Bus" tech="NATS JetStream" />
            <StackRow layer="Inter-service RPC" tech="gRPC + Protobuf" />
            <StackRow layer="Frontend API" tech="REST + WebSocket · OpenAPI 3.1" />
            <StackRow layer="Observability" tech="OpenTelemetry · Prometheus · Loki · Tempo" />
            <StackRow layer="Secrets" tech="HashiCorp Vault / Cloud KMS" />
            <StackRow layer="Deployment" tech="Kubernetes + Helm + ArgoCD (GitOps)" />
            <StackRow layer="Local Dev" tech="Docker Compose + Tilt + just" />
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Performance Targets</h3>
          </div>
          <div className="space-y-2 text-xs">
            <PerfRow metric="Order processing latency (p99)" target="< 500 µs" detail="Matching engine · §5" />
            <PerfRow metric="Matching latency (p99)" target="< 1 ms" detail="End-to-end · §12" />
            <PerfRow metric="Throughput per shard" target="100k – 150k orders/sec" detail="Pair-based sharding" />
            <PerfRow metric="Concurrent WebSocket clients" target="50,000+" detail="Market Data Service" />
            <PerfRow metric="Recovery Time Objective" target="< 30 seconds" detail="Snapshot + WAL replay" />
            <PerfRow metric="Scaling model" target="Pair-based sharding" detail="Horizontal" />
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-[10px] uppercase text-secondary tracking-wider mb-2">Recovery Strategy</div>
            <ol className="text-xs space-y-1 list-decimal list-inside text-secondary">
              <li>Load latest consistent snapshot</li>
              <li>Replay Write-Ahead Log (WAL)</li>
              <li>Resume normal operation</li>
            </ol>
          </div>
        </Card>
      </div>

      {/* NATS subjects */}
      <Card className="p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">NATS JetStream Subjects (Domain Events)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {["orders.placed", "orders.cancelled", "orders.filled", "trades.executed", "balances.updated", "deposits.confirmed", "withdrawals.completed"].map((s) => (
            <div key={s} className="bg-elevated/40 rounded px-3 py-2 font-mono text-[11px] border border-border/40">
              {s}
            </div>
          ))}
        </div>
      </Card>

      {/* Roadmap */}
      <Card className="p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Phased Delivery Roadmap</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Phase
            tag="Phase 1 · MVP"
            color="emerald"
            items={[
              "Rust Matching Engine (Limit + Market)",
              "Go Trading, Wallet, Market Data services",
              "React Professional Terminal",
              "BTC + ETH support",
              "Basic Kubernetes deployment",
            ]}
          />
          <Phase
            tag="Phase 2 · Production Hardening"
            color="cyan"
            items={[
              "Full order types + advanced risk engine",
              "Multi-chain support",
              "Hybrid custody mode",
              "Complete Admin & Compliance",
              "Load testing & security hardening",
            ]}
          />
          <Phase
            tag="Phase 3 · Advanced"
            color="purple"
            items={[
              "MPC / Account Abstraction",
              "Liquidity aggregation",
              "Institutional tools",
              "Cross-chain capabilities",
            ]}
          />
        </div>
      </Card>

      {/* Note about this preview */}
      <Card className="p-3 md:p-4 bg-elevated/40">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs text-secondary space-y-1.5">
            <p className="text-foreground font-medium">About this live preview</p>
            <p>
              This browser-based demo implements the Mbuni CEX matching engine contract in TypeScript, faithfully reproducing
              the order types, price-time priority, pre-trade risk checks, and NATS-style event publication described in §5 of
              the spec. All order book updates, trade tape entries, balance reservations, and event stream items you see here
              are produced by the in-page engine — there is no backend round-trip.
            </p>
            <p>
              In production, the same contract is implemented by the Rust engine (Tokio + Tonic) and consumed by Go services
              over gRPC. The React frontend would talk to the API gateway via REST + WebSocket, with TanStack Query for server
              state and Zustand for client state — exactly as wired up here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Container({
  icon: Icon,
  name,
  tech,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  tech: string;
  color: "purple" | "cyan" | "orange" | "emerald" | "muted";
}) {
  const colorMap = {
    purple: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    orange: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    emerald: "bg-primary/10 border-primary/30 text-primary-hover",
    muted: "bg-elevated/60 border-border text-secondary",
  };
  return (
    <div className={`rounded-md border p-2.5 ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium text-xs">{name}</span>
      </div>
      <div className="text-[10px] opacity-70 mt-0.5 pl-5">{tech}</div>
    </div>
  );
}

function StackRow({ layer, tech }: { layer: string; tech: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-secondary">{layer}</span>
      <span className="font-medium">{tech}</span>
    </div>
  );
}

function PerfRow({ metric, target, detail }: { metric: string; target: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
      <div className="flex flex-col">
        <span>{metric}</span>
        <span className="text-[10px] text-secondary">{detail}</span>
      </div>
      <span className="font-mono text-primary font-medium">{target}</span>
    </div>
  );
}

function Phase({ tag, color, items }: { tag: string; color: "emerald" | "cyan" | "purple"; items: string[] }) {
  const colorMap = {
    emerald: "border-primary/30 bg-primary/5",
    cyan: "border-cyan-500/30 bg-cyan-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  };
  const textMap = {
    emerald: "text-primary",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
  };
  return (
    <div className={`rounded-md border p-3 ${colorMap[color]}`}>
      <div className={`text-xs font-semibold mb-2 ${textMap[color]}`}>{tag}</div>
      <ul className="text-[11px] space-y-1 text-secondary">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-1.5">
            <span className={`mt-1 w-1 h-1 rounded-full shrink-0 ${textMap[color].replace("text", "bg")}`} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
