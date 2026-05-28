import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/access";

const WRITE_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

const PROTECTED_PREFIXES = [
  "/api/entries",
  "/api/body",
  "/api/photos",
  "/api/supplements",
  "/api/supplement-intake",
  "/api/profile",
  "/api/water",
  "/api/workouts",
];

export function middleware(request: NextRequest) {
  if (!WRITE_METHODS.has(request.method)) {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/access")) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access !== "rodrigues") {
    return NextResponse.json(
      { error: "Read-only access. Sign in as Rodrigues to make changes." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
