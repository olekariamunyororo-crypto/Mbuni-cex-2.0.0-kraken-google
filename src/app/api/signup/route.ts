// Mbuni CEX — Signup endpoint
// POST /api/signup  { email, password, name? }
// Creates a User with bcrypt-hashed password and returns success.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name) : null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be ≥ 8 characters" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        kycStatus: "NONE",
        tier: 0,
      },
    });

    return NextResponse.json({ ok: true, userId: user.id, email: user.email });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
