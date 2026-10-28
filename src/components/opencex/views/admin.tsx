"use client";

import { useOpenCEX } from "@/lib/opencex/store";
import { fmtDateTime, fmtCompact, fmtUSD } from "@/lib/opencex/format";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, AlertTriangle, Activity, Users, Database, Cpu, Server, Lock } from "lucide-react";
import type { ServiceHealth } from "@/lib/opencex/types";

const SERVICES: ServiceHealth[] = [
  { name: "Matching Engine", language: "Rust", status: "healthy", latencyUs: 285, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "Trading Service", language: "Go", status: "healthy", latencyUs: 1120, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "Wallet Service", language: "Go", status: "healthy", latencyUs: 1980, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "Market Data Service", language: "Go", status: "healthy", latencyUs: 420, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "Compliance Service", language: "Go", status: "healthy", latencyUs: 1540, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "API Gateway (Caddy / Envoy)", language: "Go", status: "healthy", latencyUs: 610, ready: true, uptime: "64d 14h 22m", version: "2.0.0" },
  { name: "Frontend (React 19)", language: "React", status: "healthy", latencyUs: 0, ready: true, uptime: "—", version: "2.0.0" },
];

const RISK_ALERTS = [
  { id: "ra_1", severity: "high", message: "Withdrawal velocity > 5σ for user u_4 (david.whale)", time: Date.now() - 600000 },
  { id: "ra_2", severity: "medium", message: "KYT flagged: deposit from mixer address (0x9ab…c3d)", time: Date.now() - 1800000 },
  { id: "ra_3", severity: "low", message: "Maker fee tier downgrade: 3 users (volume dropped)", time: Date.now() - 3600000 },
  { id: "ra_4", severity: "info", message: "Cold wallet sweep completed: 12.4 BTC → vault", time: Date.now() - 7200000 },
];

export function AdminView() {
  const users = useOpenCEX((s) => s.users);
  const feeSchedules = useOpenCEX((s) => s.feeSchedules);
  const pairs = useOpenCEX((s) => s.pairs);
  const tickers = useOpenCEX((s) => s.tickers);
  const events = useOpenCEX((s) => s.events);

  const totalVol24h = Object.values(tickers).reduce((s, t) => s + (t?.quoteVolume ?? 0), 0);
  const verifiedUsers = users.filter((u) => u.kycStatus === "VERIFIED").length;
  const pendingKyc = users.filter((u) => u.kycStatus === "PENDING").length;

  return (
    <div className="p-3 md:p-4 space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <MetricCard icon={Activity} label="24h Volume" value={fmtUSD(totalVol24h)} sub="all markets" tone="up" />
        <MetricCard icon={Users} label="Total Users" value={String(users.length * 4218)} sub={`${verifiedUsers * 4218} verified`} />
        <MetricCard icon={AlertTriangle} label="Pending KYC" value={String(pendingKyc * 137)} sub="awaiting review" tone="warn" />
        <MetricCard icon={ShieldCheck} label="System Health" value="6 / 7" sub="services healthy" tone={SERVICES.filter((s) => s.status === "healthy").length >= 6 ? "up" : "warn"} />
      </div>

      <Tabs defaultValue="services">
        <TabsList className="flex w-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="pairs">Pairs</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <Card key={s.name} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      s.language === "Rust" ? "bg-orange-500/15 text-orange-400" :
                      s.language === "Go" ? "bg-cyan-500/15 text-cyan-400" :
                      "bg-purple-500/15 text-purple-400"
                    }`}>
                      {s.language === "Rust" ? <Cpu className="w-5 h-5" /> : s.language === "Go" ? <Server className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-[10px] text-secondary">{s.language} · v{s.version}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    s.status === "healthy" ? "bg-primary/15 text-primary" :
                    s.status === "degraded" ? "bg-yellow-500/15 text-gold" :
                    "bg-danger/15 text-danger"
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <div className="text-secondary">p99 Latency</div>
                    <div className="tnum font-medium">{s.latencyUs > 0 ? `${s.latencyUs.toLocaleString()} µs` : "—"}</div>
                  </div>
                  <div>
                    <div className="text-secondary">Ready</div>
                    <div className={s.ready ? "text-primary" : "text-danger"}>{s.ready ? "✓ /readyz" : "✗ /readyz"}</div>
                  </div>
                  <div>
                    <div className="text-secondary">Uptime</div>
                    <div className="tnum font-medium">{s.uptime}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">Infrastructure</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <InfraItem name="PostgreSQL 17" status="healthy" detail="primary + 2 replicas · TimescaleDB" />
              <InfraItem name="NATS JetStream" status="healthy" detail="3-node cluster · 7 streams" />
              <InfraItem name="Dragonfly Cache" status="healthy" detail="2 shards · 4GB each" />
              <InfraItem name="HashiCorp Vault" status="healthy" detail="HSM-backed · 5 keys" />
              <InfraItem name="Prometheus + Loki" status="healthy" detail="30d retention" />
              <InfraItem name="Tempo (Traces)" status="healthy" detail="OTLP · 14d retention" />
              <InfraItem name="ArgoCD" status="healthy" detail="GitOps · 6 apps" />
              <InfraItem name="K8s (EKS)" status="healthy" detail="4 nodes · 96 vCPU" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-3">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div style={{ minWidth: "640px" }}>
            <div className="grid grid-cols-7 gap-2 px-4 py-2 text-[10px] uppercase text-secondary border-b border-border">
              <span className="col-span-2">User</span>
              <span>KYC</span>
              <span>Tier</span>
              <span>2FA</span>
              <span>Passkey</span>
              <span>Joined</span>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-7 gap-2 px-4 py-2 text-xs items-center border-b border-border/40 hover:bg-elevated/40">
                <span className="col-span-2 font-medium truncate">{u.email}</span>
                <span className={u.kycStatus === "VERIFIED" ? "text-primary" : u.kycStatus === "PENDING" ? "text-gold" : "text-secondary"}>{u.kycStatus}</span>
                <span><span className="px-1.5 py-0.5 rounded bg-elevated text-[10px]">T{u.tier}</span></span>
                <span className={u.twoFA ? "text-primary" : "text-secondary"}>{u.twoFA ? "Enabled" : "Off"}</span>
                <span className={u.passkey ? "text-primary" : "text-secondary"}>{u.passkey ? "Bound" : "—"}</span>
                <span className="text-secondary text-[11px]">{fmtDateTime(u.createdAt)}</span>
              </div>
            ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-3 space-y-3">
          {RISK_ALERTS.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3">
              <AlertTriangle className={`w-4 h-4 ${
                a.severity === "high" ? "text-danger" :
                a.severity === "medium" ? "text-gold" :
                a.severity === "low" ? "text-blue-400" : "text-secondary"
              }`} />
              <div className="flex-1">
                <div className="text-sm">{a.message}</div>
                <div className="text-[10px] text-secondary">{fmtDateTime(a.time)}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                a.severity === "high" ? "bg-danger/15 text-danger" :
                a.severity === "medium" ? "bg-yellow-500/15 text-gold" :
                a.severity === "low" ? "bg-blue-500/15 text-blue-400" : "bg-elevated text-secondary"
              }`}>{a.severity}</span>
            </Card>
          ))}

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Custody Controls</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <ControlRow label="Withdrawal whitelist" value="Enforced · 24h time-lock" status="active" />
              <ControlRow label="Multi-approval (large tx)" value="> $50k USD · 2 approvers" status="active" />
              <ControlRow label="Hot wallet cap" value="$250k USD · auto-sweep to cold" status="active" />
              <ControlRow label="KYT screening" value="Scorechain · all deposits" status="active" />
              <ControlRow label="MPC signing" value="Threshold 3-of-5 · cold vault" status="planned" />
              <ControlRow label="Chain reorg policy" value="3 confs BTC · 12 confs ETH" status="active" />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pairs" className="mt-3">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div style={{ minWidth: "600px" }}>
            <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[10px] uppercase text-secondary border-b border-border">
              <span>Symbol</span>
              <span>Base / Quote</span>
              <span className="text-right">Tick Size</span>
              <span className="text-right">Min Qty</span>
              <span className="text-right">24h Vol</span>
              <span>Status</span>
            </div>
            {pairs.map((p) => {
              const t = tickers[p.symbol];
              return (
                <div key={p.symbol} className="grid grid-cols-6 gap-2 px-4 py-2 text-xs items-center border-b border-border/40 tnum hover:bg-elevated/40">
                  <span className="font-medium">{p.symbol}</span>
                  <span className="text-secondary">{p.base} / {p.quote}</span>
                  <span className="text-right">{p.tickSize}</span>
                  <span className="text-right">{p.minQty}</span>
                  <span className="text-right">{t ? fmtUSD(t.quoteVolume) : "—"}</span>
                  <span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.status === "ACTIVE" ? "bg-primary/15 text-primary" : "bg-yellow-500/15 text-gold"}`}>
                      {p.status}
                    </span>
                  </span>
                </div>
              );
            })}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-3">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div style={{ minWidth: "500px" }}>
            <div className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] uppercase text-secondary border-b border-border">
              <span>Tier</span>
              <span>Label</span>
              <span className="text-right">30d Volume (USD)</span>
              <span className="text-right">Maker</span>
              <span className="text-right">Taker</span>
            </div>
            {feeSchedules.map((f) => (
              <div key={f.tier} className="grid grid-cols-5 gap-2 px-4 py-2.5 text-xs items-center border-b border-border/40 tnum hover:bg-elevated/40">
                <span className="font-medium">T{f.tier}</span>
                <span>{f.label}</span>
                <span className="text-right">{fmtUSD(f.volumeUSD)}</span>
                <span className="text-right text-primary">{f.makerFee === 0 ? "Free" : `${f.makerFee} bps`}</span>
                <span className="text-right">{f.takerFee} bps</span>
              </div>
            ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-3">
          <Card className="overflow-hidden">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold">Live Event Stream</span>
              <span className="text-[10px] text-secondary">NATS JetStream · all subjects</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {events.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-secondary">No events yet — place an order to see them flow.</div>
              )}
              {events.map((ev) => (
                <div key={ev.id} className="px-4 py-1.5 text-xs border-b border-border/40 hover:bg-elevated/40 flex items-center gap-3">
                  <span className="text-[10px] text-secondary tnum w-20">{fmtDateTime(ev.timestamp).split(" ")[1]}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    ev.subject.startsWith("orders") ? "bg-blue-500/15 text-blue-400" :
                    ev.subject.startsWith("trades") ? "bg-primary/15 text-primary" :
                    ev.subject.startsWith("balances") ? "bg-purple-500/15 text-purple-400" :
                    ev.subject.startsWith("deposits") ? "bg-cyan-500/15 text-cyan-400" :
                    "bg-orange-500/15 text-orange-400"
                  }`}>
                    {ev.subject}
                  </span>
                  <span className="text-[11px] text-secondary font-mono truncate">
                    {JSON.stringify(ev.payload).slice(0, 120)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; tone?: "up" | "warn" | "down" }) {
  const color = tone === "up" ? "text-primary" : tone === "warn" ? "text-gold" : tone === "down" ? "text-danger" : "text-white";
  return (
    <div className="glass-raised rounded-2xl p-3 md:p-4 border border-[var(--color-glass-border)] shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_var(--color-glass-highlight)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-secondary tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-secondary" />
      </div>
      <div className={`text-lg md:text-2xl font-bold tnum mt-1 ${color}`}>{value}</div>
      <div className="text-[11px] text-secondary mt-0.5">{sub}</div>
    </div>
  );
}

function InfraItem({ name, status, detail }: { name: string; status: string; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${status === "healthy" ? "bg-primary" : "bg-yellow-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{name}</div>
        <div className="text-[10px] text-secondary truncate">{detail}</div>
      </div>
    </div>
  );
}

function ControlRow({ label, value, status }: { label: string; value: string; status: "active" | "planned" }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-foreground">{value}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${status === "active" ? "bg-primary/15 text-primary" : "bg-elevated text-secondary"}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
