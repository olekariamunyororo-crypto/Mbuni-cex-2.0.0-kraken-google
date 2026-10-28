// Quick DB check — list users + their onboarding state
import { db } from "../src/lib/db";

async function main() {
  const users = await db.user.findMany({
    include: { onboarding: true },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  for (const u of users) {
    console.log({
      id: u.id,
      email: u.email,
      name: u.name,
      kycStatus: u.kycStatus,
      tier: u.tier,
      twoFA: u.twoFA,
      passkey: u.passkey,
      onboardingComplete: u.onboardingComplete,
      onboarding: u.onboarding
        ? {
            experience: u.onboarding.experience,
            followedPairs: u.onboarding.followedPairs,
            enable2FA: u.onboarding.enable2FA,
            passkeyEnrolled: u.onboarding.passkeyEnrolled,
            acceptedTerms: u.onboarding.acceptedTerms,
          }
        : null,
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
