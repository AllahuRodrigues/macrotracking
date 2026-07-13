import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_CODE_HEADER, RODRIGUES_CODE } from "@/lib/access";

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
  "/api/analyze-food",
];

/** Allow the native app (and browsers) to call the API cross-origin. */
function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    `Content-Type, Authorization, ${ACCESS_CODE_HEADER}`
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  return res;
}

/** A request is authorized to write if it has the Rodrigues cookie OR the access-code header. */
function canWriteRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (cookie === "rodrigues") return true;
  const headerCode = request.headers.get(ACCESS_CODE_HEADER);
  return headerCode === RODRIGUES_CODE;
}

export function middleware(request: NextRequest) {
  // Preflight — always answer with CORS headers.
  if (request.method === "OPTIONS") {
    return withCors(new NextResponse(null, { status: 204 }));
  }

  if (!WRITE_METHODS.has(request.method)) {
    return withCors(NextResponse.next());
  }

  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/access")) {
    return withCors(NextResponse.next());
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isProtected) {
    return withCors(NextResponse.next());
  }

  if (!canWriteRequest(request)) {
    return withCors(
      NextResponse.json(
        { error: "Read-only access. Sign in as Rodrigues to make changes." },
        { status: 403 }
      )
    );
  }

  return withCors(NextResponse.next());
}

export const config = {
  matcher: "/api/:path*",
};
