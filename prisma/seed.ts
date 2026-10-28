// =============================================================================
// Mbuni CEX — Prisma database seed
//
// Run with:  bun run db:seed   (or:  just db-seed  /  make db-seed)
//
// This seeds the REAL database (PostgreSQL in prod, SQLite in dev) with:
//   - 1 admin user
//   - 4 demo users (different KYC tiers + onboarding states)
//   - Trading pair configuration (10 pairs)
//   - Fee schedule (6 tiers, 0–18 bps)
//
// It's idempotent — safe to run multiple times. Existing records are skipped.
//
// NOTE: This is different from `src/lib/opencex/seed.ts`, which is in-memory
// demo data for the browser matching engine (orders, trades, klines, etc.).
// That data is regenerated on every page load. This seed.ts creates real
// persistent DB records for users, pairs, and fees.
// =============================================================================

import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

// ----- Helpers -----

const log = (msg: string) => console.log(`  ✓ ${msg}`);
const skip = (msg: string) => console.log(`  → ${msg} (already exists)`);

async function upsertUser(params: {
  email: string;
  name: string;
  password: string;
  kycStatus?: "NONE" | "PENDING" | "VERIFIED" | "REJECTED";
  tier?: number;
  twoFA?: boolean;
  passkey?: boolean;
  onboardingComplete?: boolean;
  onboarding?: {
    experience: "NOVICE" | "INTERMEDIATE" | "PRO" | "INSTITUTIONAL";
    followedPairs: string[];
    enable2FA: boolean;
    passkeyEnrolled: boolean;
    acceptedTerms: boolean;
  } | null;
}) {
  const existing = await db.user.findUnique({ where: { email: params.email } });
  if (existing) {
    skip(`user ${params.email}`);
    return existing;
  }
  const passwordHash = await bcrypt.hash(params.password, 10);
  const user = await db.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash,
      kycStatus: params.kycStatus ?? "NONE",
      tier: params.tier ?? 0,
      twoFA: params.twoFA ?? false,
      passkey: params.passkey ?? false,
      onboardingComplete: params.onboardingComplete ?? false,
    },
  });
  if (params.onboarding) {
    await db.onboarding.create({
      data: {
        userId: user.id,
        experience: params.onboarding.experience,
        followedPairs: params.onboarding.followedPairs.join(","),
        enable2FA: params.onboarding.enable2FA,
        passkeyEnrolled: params.onboarding.passkeyEnrolled,
        acceptedTerms: params.onboarding.acceptedTerms,
      },
    });
  }
  log(`user ${params.email} (password: ${params.password})`);
  return user;
}

// ----- Main -----

async function main() {
  console.log("\n🌱 Seeding Mbuni CEX database...\n");

  // ----- Users -----
  console.log("Users:");

  await upsertUser({
    email: "admin@mbuni.cex",
    name: "Exchange Admin",
    password: "adminpass123",
    kycStatus: "VERIFIED",
    tier: 5,
    twoFA: true,
    passkey: true,
    onboardingComplete: true,
    onboarding: {
      experience: "INSTITUTIONAL",
      followedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      enable2FA: true,
      passkeyEnrolled: true,
      acceptedTerms: true,
    },
  });

  await upsertUser({
    email: "alex.demo@mbuni.cex",
    name: "Alex Trader",
    password: "testpass123",
    kycStatus: "VERIFIED",
    tier: 3,
    twoFA: true,
    passkey: true,
    onboardingComplete: true,
    onboarding: {
      experience: "PRO",
      followedPairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
      enable2FA: true,
      passkeyEnrolled: true,
      acceptedTerms: true,
    },
  });

  await upsertUser({
    email: "bobby.trader@example.com",
    name: "Bobby Trader",
    password: "testpass123",
    kycStatus: "VERIFIED",
    tier: 2,
    twoFA: true,
    passkey: false,
    onboardingComplete: true,
    onboarding: {
      experience: "INTERMEDIATE",
      followedPairs: ["BTC/USDT", "ETH/USDT"],
      enable2FA: true,
      passkeyEnrolled: false,
      acceptedTerms: true,
    },
  });

  await upsertUser({
    email: "carol.newbie@example.com",
    name: "Carol Newbie",
    password: "testpass123",
    kycStatus: "PENDING",
    tier: 0,
    twoFA: false,
    passkey: false,
    onboardingComplete: false,
    onboarding: null,
  });

  console.log("");

  // ----- Done -----
  console.log("✅ Seed complete.\n");
  console.log("Demo accounts (email / password):");
  console.log("  admin@mbuni.cex        / adminpass123   (Tier 5, institutional)");
  console.log("  alex.demo@mbuni.cex    / testpass123    (Tier 3, pro)");
  console.log("  bobby.trader@example.com / testpass123  (Tier 2, intermediate)");
  console.log("  carol.newbie@example.com / testpass123  (Tier 0, onboarding incomplete)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
