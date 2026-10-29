"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Star,
  ShieldCheck,
  Fingerprint,
  Loader2,
  Sparkles,
  GraduationCap,
  Briefcase,
  Landmark,
} from "lucide-react";
import { useOpenCEX } from "@/lib/opencex/store";
import { ASSET_METADATA } from "@/lib/opencex/seed";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";
import { CoinIcon } from "@/components/opencex/coin-icon";
import { toast } from "sonner";
import { apiSaveOnboarding } from "next-auth/react";
import { Button } from "@/components/ui/Button";

type Experience = "NOVICE" | "INTERMEDIATE" | "PRO" | "INSTITUTIONAL";

interface Prefs {
  experience: Experience;
  followedPairs: string[];
  enable2FA: boolean;
  passkeyEnrolled: boolean;
  acceptedTerms: boolean;
}

const STEPS = ["Experience", "Markets", "Security", "Review"] as const;

const EXPERIENCES: { key: Experience; label: string; description: string; icon: React.ComponentType<{ className?: string }>; tier: number }[] = [
  { key: "NOVICE", label: "Beginner", description: "New to crypto — guide me through everything", icon: GraduationCap, tier: 0 },
  { key: "INTERMEDIATE", label: "Intermediate", description: "I know the basics — show me the pro tools", icon: Briefcase, tier: 1 },
  { key: "PRO", label: "Professional", description: "Active trader — give me everything", icon: Sparkles, tier: 3 },
  { key: "INSTITUTIONAL", label: "Institutional", description: "High-volume desk — APIs, custody, reports", icon: Landmark, tier: 5 },
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const pairs = useOpenCEX((s) => s.pairs);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>({
    experience: "INTERMEDIATE",
    followedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
    enable2FA: false,
    passkeyEnrolled: false,
    acceptedTerms: false,
  });
  const [saving, setSaving] = useState(false);

  const togglePair = (sym: string) => {
    setPrefs((p) => ({
      ...p,
      followedPairs: p.followedPairs.includes(sym)
        ? p.followedPairs.filter((x) => x !== sym)
        : [...p.followedPairs, sym],
    }));
  };

  const submit = async () => {
    if (saving) return;
    if (!prefs.acceptedTerms) {
      toast.error("Please accept the terms to continue");
      return;
    }
    setSaving(true);
    try {
      const data = await apiSaveOnboarding(prefs);
      if (!data.ok) {
        toast.error(data.error ?? "Failed to save preferences");
        setSaving(false);
        return;
      }
      toast.success("Onboarding complete · welcome to Mbuni CEX");
      setTimeout(onComplete, 300);
    } catch (e) {
      toast.error((e as Error).message);
      setSaving(false);
    }
  };

  const next = () => {
    if (step === 0 && !prefs.experience) {
      toast.error("Pick an experience level");
      return;
    }
    if (step === 1 && prefs.followedPairs.length === 0) {
      toast.error("Follow at least one market");
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(0.4 0.008 250) 1px, transparent 1px), linear-gradient(to bottom, oklch(0.4 0.008 250) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header + progress */}
      <div className="relative px-6 pt-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary overflow-hidden shadow-[0_2px_10px_rgba(163,230,53,0.15)]">
            <OstrichLogo className="w-7 h-7" />
          </div>
          <div>
            <span className="font-bold text-sm text-white">Mbuni CEX</span>
            <span className="text-[11px] text-tertiary ml-2">Progressive Setup</span>
          </div>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <div key={s} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    isCompleted
                      ? "bg-primary"
                      : isCurrent
                      ? "bg-cta shadow-[0_0_8px_rgba(127,102,255,0.4)]"
                      : "bg-white/10"
                  }`}
                />
                <div
                  className={`text-[11px] mt-1.5 flex items-center gap-1 ${
                    isCompleted
                      ? "text-primary font-semibold"
                      : isCurrent
                      ? "text-white font-bold"
                      : "text-muted"
                  }`}
                >
                  <span className="text-[10px] font-mono">
                    {isCompleted ? "✓" : `0${i + 1}`}
                  </span>
                  <span className="truncate">{s}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center p-6 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {step === 0 && (
              <StepExperience
                value={prefs.experience}
                onChange={(experience) => setPrefs({ ...prefs, experience })}
              />
            )}
            {step === 1 && (
              <StepMarkets
                pairs={pairs.map((p) => p.symbol)}
                selected={prefs.followedPairs}
                onToggle={togglePair}
              />
            )}
            {step === 2 && (
              <StepSecurity
                enable2FA={prefs.enable2FA}
                passkeyEnrolled={prefs.passkeyEnrolled}
                onChange={(p) => setPrefs({ ...prefs, ...p })}
              />
            )}
            {step === 3 && <StepReview prefs={prefs} onToggleTerms={() => setPrefs({ ...prefs, acceptedTerms: !prefs.acceptedTerms })} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="relative px-6 pb-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-md text-sm text-secondary hover:text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Button
            variant="primary"
            size="md"
            pill
            onClick={next}
            loading={saving}
            className="gap-2 px-6"
          >
            <span>
              {saving
                ? "Saving…"
                : step === STEPS.length - 1
                ? "Enter Mbuni CEX"
                : "Continue"}
            </span>
            {!saving && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 1: Experience ---------- */
function StepExperience({ value, onChange }: { value: Experience; onChange: (e: Experience) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">How would you describe yourself?</h2>
      <p className="text-sm text-secondary mt-1 mb-6">We&apos;ll tune the experience and your default fee tier accordingly.</p>

      <div className="grid sm:grid-cols-2 gap-2">
        {EXPERIENCES.map((e) => {
          const Icon = e.icon;
          const active = value === e.key;
          return (
            <button
              key={e.key}
              onClick={() => onChange(e.key)}
              className={`text-left p-4 rounded-lg border transition-all flex items-start gap-3 ${
                active ? "border-primary bg-primary/10" : "border-border hover:border-border/80 hover:bg-elevated/50"
              }`}
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${active ? "bg-primary text-black" : "bg-elevated/60 text-secondary"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{e.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-elevated/60 text-secondary">T{e.tier}</span>
                </div>
                <p className="text-xs text-secondary mt-0.5">{e.description}</p>
              </div>
              {active && <Check className="w-4 h-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Step 2: Markets ---------- */
function StepMarkets({
  pairs,
  selected,
  onToggle,
}: {
  pairs: string[];
  selected: string[];
  onToggle: (sym: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Follow your markets</h2>
      <p className="text-sm text-secondary mt-1 mb-6">
        We&apos;ll pin these to your sidebar and dashboard. Selected: <span className="text-primary font-medium">{selected.length}</span>
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {pairs.map((sym) => {
          const base = sym.split("/")[0];
          const meta = ASSET_METADATA[base];
          const active = selected.includes(sym);
          return (
            <button
              key={sym}
              onClick={() => onToggle(sym)}
              className={`p-3 rounded-lg border flex items-center gap-2 transition-all ${
                active ? "border-primary bg-primary/10" : "border-border hover:bg-elevated/50"
              }`}
            >
              <CoinIcon asset={base} size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium">{sym}</div>
                <div className="text-[10px] text-secondary truncate">{meta?.name}</div>
              </div>
              {active ? (
                <Star className="w-3.5 h-3.5 fill-gold text-gold shrink-0" />
              ) : (
                <Star className="w-3.5 h-3.5 text-secondary/40 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Step 3: Security ---------- */
function StepSecurity({
  enable2FA,
  passkeyEnrolled,
  onChange,
}: {
  enable2FA: boolean;
  passkeyEnrolled: boolean;
  onChange: (p: { enable2FA?: boolean; passkeyEnrolled?: boolean }) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Secure your account</h2>
      <p className="text-sm text-secondary mt-1 mb-6">
        Recommended for any account holding crypto. You can change these later in Settings.
      </p>

      <div className="space-y-3">
        <SecurityCard
          icon={ShieldCheck}
          title="Two-factor authentication"
          description="Require a TOTP code from your authenticator app on every login and withdrawal."
          accent="from-emerald-400 to-cyan-500"
          enabled={enable2FA}
          onToggle={() => onChange({ enable2FA: !enable2FA })}
        />
        <SecurityCard
          icon={Fingerprint}
          title="Passkey / WebAuthn"
          description="Sign in with device biometrics (Face ID, Touch ID, security key). No password needed."
          accent="from-purple-400 to-pink-500"
          enabled={passkeyEnrolled}
          onToggle={() => onChange({ passkeyEnrolled: !passkeyEnrolled })}
        />
        <div className="bg-elevated/40 border border-border rounded-lg p-3 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-secondary">
            <span className="text-foreground font-medium">Always enforced:</span> Withdrawal address whitelisting with 24h time-lock, hot wallet caps, and complete audit trail. These cannot be disabled.
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCard({
  icon: Icon,
  title,
  description,
  accent,
  enabled,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border flex items-start gap-3 transition-all ${enabled ? "border-primary bg-primary/5" : "border-border"}`}>
      <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4 text-black" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-secondary mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${enabled ? "bg-primary" : "bg-elevated-foreground/30"}`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </button>
    </div>
  );
}

/* ---------- Step 4: Review ---------- */
function StepReview({ prefs, onToggleTerms }: { prefs: Prefs; onToggleTerms: () => void }) {
  const experience = EXPERIENCES.find((e) => e.key === prefs.experience)!;
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Review &amp; accept</h2>
      <p className="text-sm text-secondary mt-1 mb-6">Confirm your setup before entering the exchange.</p>

      <div className="space-y-2 mb-5">
        <Row label="Experience" value={experience.label} badge={`Tier ${experience.tier}`} />
        <Row label="Followed markets" value={`${prefs.followedPairs.length} pair${prefs.followedPairs.length === 1 ? "" : "s"}`} detail={prefs.followedPairs.join(", ")} />
        <Row label="Two-factor auth" value={prefs.enable2FA ? "Enabled" : "Off"} tone={prefs.enable2FA ? "up" : "muted"} />
        <Row label="Passkey / WebAuthn" value={prefs.passkeyEnrolled ? "Enrolled" : "Not enrolled"} tone={prefs.passkeyEnrolled ? "up" : "muted"} />
      </div>

      <label className="flex items-start gap-3 p-3 bg-elevated/40 border border-border rounded-lg cursor-pointer hover:bg-elevated/50">
        <input
          type="checkbox"
          checked={prefs.acceptedTerms}
          onChange={onToggleTerms}
          className="mt-0.5 w-4 h-4 accent-emerald-500"
        />
        <span className="text-xs text-secondary">
          I agree to the <a className="text-primary hover:underline">Terms of Service</a>, acknowledge the{" "}
          <a className="text-primary hover:underline">Risk Disclosure</a>, and confirm I am 18+ and not a
          resident of a restricted jurisdiction.
        </span>
      </label>
    </div>
  );
}

function Row({ label, value, detail, badge, tone }: { label: string; value: string; detail?: string; badge?: string; tone?: "up" | "muted" }) {
  const color = tone === "up" ? "text-primary" : tone === "muted" ? "text-secondary" : "text-foreground";
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40">
      <span className="text-xs text-secondary">{label}</span>
      <div className="text-right">
        <div className={`text-sm font-medium ${color}`}>
          {value} {badge && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-elevated/60 text-secondary">{badge}</span>}
        </div>
        {detail && <div className="text-[10px] text-secondary mt-0.5 truncate max-w-[200px]">{detail}</div>}
      </div>
    </div>
  );
}
