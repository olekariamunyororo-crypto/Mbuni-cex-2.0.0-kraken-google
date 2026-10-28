// Mbuni CEX — Save onboarding preferences
// POST /api/onboarding  { experience, followedPairs[], enable2FA, passkeyEnrolled, acceptedTerms }
// Requires authenticated session.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const experience = String(body.experience ?? "INTERMEDIATE");
    const followedPairs = Array.isArray(body.followedPairs)
      ? body.followedPairs.join(",")
      : String(body.followedPairs ?? "");
    const enable2FA = Boolean(body.enable2FA);
    const passkeyEnrolled = Boolean(body.passkeyEnrolled);
    const acceptedTerms = Boolean(body.acceptedTerms);

    if (!acceptedTerms) {
      return NextResponse.json({ ok: false, error: "You must accept the terms to continue" }, { status: 400 });
    }

    // Upsert onboarding record + mark user onboardingComplete
    const [onboarding] = await db.$transaction([
      db.onboarding.upsert({
        where: { userId: session.user.id },
        update: { experience, followedPairs, enable2FA, passkeyEnrolled, acceptedTerms },
        create: { userId: session.user.id, experience, followedPairs, enable2FA, passkeyEnrolled, acceptedTerms },
      }),
      db.user.update({
        where: { id: session.user.id },
        data: { onboardingComplete: true, twoFA: enable2FA, passkey: passkeyEnrolled },
      }),
    ]);

    return NextResponse.json({ ok: true, onboarding });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

// GET — fetch current user's onboarding state
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const onboarding = await db.onboarding.findUnique({ where: { userId: session.user.id } });
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingComplete: true, tier: true, kycStatus: true, name: true, email: true, twoFA: true, passkey: true },
  });
  return NextResponse.json({ ok: true, onboarding, user });
}
