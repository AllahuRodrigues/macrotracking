import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, RODRIGUES_CODE, type AccessRole } from "@/lib/access";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30-day session
  secure: process.env.NODE_ENV === "production",
};

export async function GET(req: NextRequest) {
  const value = req.cookies.get(ACCESS_COOKIE)?.value;
  const role =
    value === "guest" || value === "rodrigues" ? (value as AccessRole) : null;
  return NextResponse.json({ role });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const role = body.role as AccessRole;

  if (role === "guest") {
    const res = NextResponse.json({ ok: true, role: "guest" });
    res.cookies.set(ACCESS_COOKIE, "guest", COOKIE_OPTS);
    return res;
  }

  if (role === "rodrigues") {
    if (body.code !== RODRIGUES_CODE) {
      return NextResponse.json({ error: "Invalid access code" }, { status: 403 });
    }
    const res = NextResponse.json({ ok: true, role: "rodrigues" });
    res.cookies.set(ACCESS_COOKIE, "rodrigues", COOKIE_OPTS);
    return res;
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
