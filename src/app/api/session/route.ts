// Mbuni CEX — Session check endpoint
// GET /api/session  → returns { ok, user: { id, email, name, onboardingComplete, tier, kycStatus } | null }
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, user: null });
  }
  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      onboardingComplete: session.user.onboardingComplete,
      tier: session.user.tier,
      kycStatus: session.user.kycStatus,
    },
  });
}
