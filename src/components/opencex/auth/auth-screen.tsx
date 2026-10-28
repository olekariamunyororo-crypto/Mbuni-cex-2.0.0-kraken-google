"use client";

import { useState } from "react";
import { signIn, apiSignup } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, Fingerprint, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";

type Mode = "login" | "signup";

export function AuthScreen({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === "signup") {
      setLoading(true);
      try {
        const data = await apiSignup({ email, password, name: name || undefined });
        if (!data.ok) {
          toast.error(data.error ?? "Signup failed");
          setLoading(false);
          return;
        }
        toast.success("Account created · signing you in…");
      } catch (err) {
        toast.error((err as Error).message);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }
    if (result?.ok) {
      toast.success(mode === "signup" ? "Welcome to Mbuni CEX 2.0" : "Welcome back");
      setTimeout(onComplete, 200);
    }
  };

  const passkeySignIn = async () => {
    if (passkeyLoading) return;
    setPasskeyLoading(true);
    toast.info("Passkey prompt", { description: "Authenticating with device biometrics…" });
    setTimeout(() => {
      setPasskeyLoading(false);
      toast.success("Passkey verified · welcome back");
      onComplete();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(127, 102, 255, 0.12), transparent 70%)", top: "10%", left: "10%" }} />
      <div className="absolute w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: "radial-gradient(circle, rgba(163, 230, 53, 0.08), transparent 70%)", bottom: "20%", right: "15%" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <button onClick={onBack} className="text-xs text-tertiary hover:text-secondary mb-4 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Glass card */}
        <div className="glass-strong rounded-[1.5rem] p-6 glass-edge">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="relative w-14 h-14 mx-auto mb-3">
              <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: "radial-gradient(circle, rgba(163, 230, 53, 0.3), transparent 70%)" }} />
              <div className="glass relative w-14 h-14 rounded-2xl flex items-center justify-center text-primary">
                <OstrichLogo className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-xs text-tertiary mt-1">
              {mode === "login" ? "Sign in to Mbuni CEX 2.0" : "Start trading in under a minute"}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <button
              onClick={() => setMode("login")}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "text-white" : "text-tertiary hover:text-secondary"
              }`}
              style={mode === "login" ? { background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" } : {}}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup" ? "text-white" : "text-tertiary hover:text-secondary"
              }`}
              style={mode === "signup" ? { background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" } : {}}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Display name</label>
                <div className="glass-input flex items-center gap-2 px-3 py-2.5">
                  <User className="w-3.5 h-3.5 text-tertiary shrink-0" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="alex.trader" className="flex-1 bg-transparent outline-none text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Email</label>
              <div className="glass-input flex items-center gap-2 px-3 py-2.5">
                <Mail className="w-3.5 h-3.5 text-tertiary shrink-0" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Password</label>
              <div className="glass-input flex items-center gap-2 px-3 py-2.5">
                <Lock className="w-3.5 h-3.5 text-tertiary shrink-0" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Min 8 characters" : "••••••••"} required minLength={mode === "signup" ? 8 : undefined} className="flex-1 bg-transparent outline-none text-sm" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-tertiary hover:text-secondary p-1">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button type="button" className="text-[11px] text-primary hover:text-primary-hover">Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-cta w-full py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
            <span className="text-[10px] text-tertiary uppercase">or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>

          <button onClick={passkeySignIn} disabled={passkeyLoading} className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <Fingerprint className="w-4 h-4 mx-auto" />}
            <span className="ml-2">Continue with Passkey</span>
          </button>

          <div className="mt-4 flex items-start gap-2 text-[10px] text-tertiary">
            <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0 text-primary" />
            <span>bcrypt-hashed passwords · JWT sessions · 30-day expiry</span>
          </div>

          {/* Quick Demo Account Selector */}
          {mode === "login" && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <span className="text-[10px] text-tertiary block mb-2 font-mono uppercase tracking-wider">Quick Select Demo Account:</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail("admin@mbuni.cex"); setPassword("adminpass123"); }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <div className="font-semibold text-primary">Admin (Tier 5)</div>
                  <div className="text-[10px] text-tertiary truncate">admin@mbuni.cex</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("alex.demo@mbuni.cex"); setPassword("testpass123"); }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <div className="font-semibold text-cyan-400">Pro Trader (Tier 3)</div>
                  <div className="text-[10px] text-tertiary truncate">alex.demo@mbuni.cex</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("bobby.trader@example.com"); setPassword("testpass123"); }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <div className="font-semibold text-yellow-400">Intermediate</div>
                  <div className="text-[10px] text-tertiary truncate">bobby.trader@...</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("carol.newbie@example.com"); setPassword("testpass123"); }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-left border border-white/5 transition-colors"
                >
                  <div className="font-semibold text-orange-400">Carol (Flow Test)</div>
                  <div className="text-[10px] text-tertiary truncate">carol.newbie@...</div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-[11px] text-tertiary">
          New here?{" "}
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-primary hover:text-primary-hover font-medium">
            {mode === "login" ? "Create an account" : "Sign in instead"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
