import { db } from "./index.ts";
import { users, balances, orders, whitelist } from "./schema.ts";
import { eq } from "drizzle-orm";

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split("@")[0],
        kycStatus: "VERIFIED",
        tier: 3,
        twoFA: true,
        passkey: false,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user upsert failed:", error);
    throw new Error("Failed to sync user profile with database", { cause: error });
  }
}

export async function getUserBalances(userId: string) {
  try {
    return await db.select().from(balances).where(eq(balances.userId, userId));
  } catch (error) {
    console.error("Database query balances failed:", error);
    throw new Error("Failed to load user balances", { cause: error });
  }
}

export async function getUserOrders(userId: string) {
  try {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  } catch (error) {
    console.error("Database query orders failed:", error);
    throw new Error("Failed to load user orders", { cause: error });
  }
}

export async function getUserWhitelist(userId: string) {
  try {
    return await db.select().from(whitelist).where(eq(whitelist.userId, userId));
  } catch (error) {
    console.error("Database query whitelist failed:", error);
    throw new Error("Failed to load user whitelist", { cause: error });
  }
}
