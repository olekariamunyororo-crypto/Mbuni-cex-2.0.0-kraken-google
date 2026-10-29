/**
 * Mbuni CEX 2.0.0
 * High-performance spot cryptocurrency exchange
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useOpenCEX } from "@/lib/opencex/store";
import { Sidebar } from "@/components/opencex/sidebar";
import { MobileNav } from "@/components/opencex/mobile-nav";
import { TopBar } from "@/components/opencex/top-bar";
import { MarketsView } from "@/components/opencex/views/markets";
import { TradingView } from "@/components/opencex/views/trading";
import { SwapView } from "@/components/opencex/views/swap";
import { WalletView } from "@/components/opencex/views/wallet";
import { AdminView } from "@/components/opencex/views/admin";
import { ArchitectureView } from "@/components/opencex/views/architecture";
import { SplashScreen } from "@/components/opencex/auth/splash-screen";
import { WelcomeScreen } from "@/components/opencex/auth/welcome-screen";
import { AuthScreen } from "@/components/opencex/auth/auth-screen";
import { OnboardingScreen } from "@/components/opencex/auth/onboarding-screen";
import { KycScreen } from "@/components/opencex/auth/kyc-screen";
import { Providers } from "@/components/opencex/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export type ViewKey =
  | "markets"
  | "trading"
  | "swap"
  | "wallet"
  | "admin"
  | "architecture";

type FlowStage = "splash" | "welcome" | "auth" | "onboarding" | "kyc" | "app";

interface SessionUserLike {
  email?: string | null;
  name?: string | null;
  onboardingComplete?: boolean;
  tier?: number;
  kycStatus?: string;
}

function MainExchange() {
  const init = useOpenCEX((s) => s.init);
  const [view, setView] = useState<ViewKey>("trading");
  const [splashDone, setSplashDone] = useState(false);
  const [manualStage, setManualStage] = useState<FlowStage | null>(null);
  const { data: session, status } = useSession();

  // Boot the trading engine on first load
  useEffect(() => {
    init();
  }, [init]);

  // Compute the effective stage from session state + user progress.
  let stage: FlowStage;
  if (!splashDone) {
    stage = "splash";
  } else if (manualStage) {
    stage = manualStage;
  } else if (status === "authenticated" && session?.user) {
    if (!session.user.onboardingComplete) {
      stage = "onboarding";
    } else if (session.user.kycStatus !== "VERIFIED") {
      stage = "kyc";
    } else {
      stage = "app";
    }
  } else {
    stage = "welcome";
  }

  const handleSplashDone = useCallback(() => setSplashDone(true), []);
  const handleWelcomeComplete = useCallback(() => setManualStage("auth"), []);
  const handleAuthComplete = useCallback(() => {
    setManualStage(null);
  }, []);
  const handleAuthBack = useCallback(() => setManualStage("welcome"), []);
  const handleOnboardingComplete = useCallback(() => setManualStage("kyc"), []);
  const handleKycComplete = useCallback(() => setManualStage("app"), []);
  const handleLogout = useCallback(() => {
    setManualStage("welcome");
  }, []);

  // Stage: Splash
  if (stage === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  // Stage: Welcome carousel
  if (stage === "welcome") {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  // Stage: Auth
  if (stage === "auth") {
    return <AuthScreen onComplete={handleAuthComplete} onBack={handleAuthBack} />;
  }

  // Stage: Onboarding
  if (stage === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Stage: KYC verification
  if (stage === "kyc") {
    return <KycScreen onComplete={handleKycComplete} />;
  }

  // Stage: App
  return (
    <AppShell
      view={view}
      onChangeView={setView}
      onLogout={handleLogout}
      sessionUser={session?.user as SessionUserLike | undefined}
    />
  );
}

function AppShell({
  view,
  onChangeView,
  onLogout,
  sessionUser,
}: {
  view: ViewKey;
  onChangeView: (v: ViewKey) => void;
  onLogout: () => void;
  sessionUser?: SessionUserLike;
}) {
  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <div className="hidden md:flex shrink-0">
        <Sidebar view={view} onChange={onChangeView} onLogout={onLogout} sessionUser={sessionUser} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar view={view} sessionUser={sessionUser} onLogout={onLogout} />
        <main
          className={cn(
            "flex-1 min-w-0 min-h-0",
            view === "trading" ? "overflow-hidden" : "overflow-auto pb-20 md:pb-3"
          )}
        >
          {view === "markets" && (
            <MarketsView
              onOpenTrading={(p) => {
                useOpenCEX.getState().setActivePair(p);
                onChangeView("trading");
              }}
            />
          )}
          {view === "trading" && <TradingView />}
          {view === "swap" && <SwapView />}
          {view === "wallet" && <WalletView />}
          {view === "admin" && <AdminView />}
          {view === "architecture" && <ArchitectureView />}
        </main>
      </div>
      <MobileNav view={view} onChange={onChangeView} onLogout={onLogout} sessionUser={sessionUser} />
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <MainExchange />
      <Toaster position="top-right" richColors />
    </Providers>
  );
}
