"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { OstrichLogo } from "@/components/opencex/ostrich-logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(onDone, 300);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--color-bg)" }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Gradient mesh — animated orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(127, 102, 255, 0.15), transparent 70%)" }}
        initial={{ scale: 0.5, opacity: 0, x: "-20%" }}
        animate={{ scale: 1.2, opacity: 1, x: "0%" }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(163, 230, 53, 0.1), transparent 70%)" }}
        initial={{ scale: 0.3, opacity: 0, x: "30%", y: "20%" }}
        animate={{ scale: 1, opacity: 1, x: "10%", y: "0%" }}
        transition={{ duration: 2.5, ease: "easeOut" }}
      />

      {/* Glass logo container */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
          {/* Glow behind logo */}
          <div
            className="absolute inset-0 rounded-[1.75rem] blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(163, 230, 53, 0.3), transparent 70%)" }}
          />
          {/* Glass tile with ostrich */}
          <motion.div
            className="glass-strong relative w-24 h-24 rounded-[1.75rem] flex items-center justify-center text-primary"
            animate={{
              boxShadow: [
                "0 0 40px rgba(163, 230, 53, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
                "0 0 80px rgba(163, 230, 53, 0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
                "0 0 40px rgba(163, 230, 53, 0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <OstrichLogo className="w-20 h-20" />
          </motion.div>
        </div>

        {/* Wordmark */}
        <motion.h1
          className="relative mt-8 text-3xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Mbuni CEX
          <span className="ml-2 text-primary text-glow-primary">2.0</span>
        </motion.h1>

        <motion.p
          className="relative mt-2 text-sm text-secondary font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Spot Cryptocurrency Exchange · Rust · Go · React
        </motion.p>

        {/* Liquid loading bar */}
        <div className="relative mt-10 w-56 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #a3e635, #7f66ff)",
              boxShadow: "0 0 12px rgba(163, 230, 53, 0.4)",
            }}
          />
        </div>
        <div className="relative mt-3 text-[10px] text-tertiary tabular w-56 flex justify-between">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Initializing engine
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-6 text-[10px] text-tertiary/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        © 2026 Mbuni CEX · Tempered Glass UI
      </motion.div>
    </motion.div>
  );
}
