import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Pages that require admin login
const ADMIN_ONLY_PAGES = ["/championships/new", "/sponsors/new", "/staff/new"];

// API mutations only admins can perform
const ADMIN_ONLY_API: { path: string; methods: string[]; matchSuffix?: string; matchContains?: string; excludeSuffix?: string }[] = [
  { path: "/api/championships", methods: ["POST"] },
  { path: "/api/championships/", methods: ["PATCH", "DELETE"] },
  { path: "/api/championships/", matchSuffix: "/fixtures", methods: ["POST"] },
  { path: "/api/championships/", matchSuffix: "/sponsors", methods: ["POST"] },
  { path: "/api/championships/", matchSuffix: "/nominations", methods: ["POST"] },
  { path: "/api/championships/", matchContains: "/nominations/", methods: ["PATCH", "DELETE"] },
  { path: "/api/teams", methods: ["POST"] },
  { path: "/api/teams/", methods: ["DELETE"] },
  { path: "/api/sponsors", methods: ["POST"] },
  { path: "/api/sponsors/", methods: ["PATCH", "DELETE"] },
  { path: "/api/matches", methods: ["POST"] },
  { path: "/api/matches/", methods: ["PATCH", "DELETE"] },
  { path: "/api/matches/", matchSuffix: "/staff", methods: ["POST"] },
  { path: "/api/users", methods: ["POST"] },
  { path: "/api/support/", methods: ["PATCH"] },
  { path: "/api/settings/charity-collected", methods: ["PATCH"] },
];

function isAdminOnlyApi(pathname: string, method: string): boolean {
  return ADMIN_ONLY_API.some((rule) => {
    if (!rule.methods.includes(method)) return false;
    if (rule.matchSuffix) {
      return pathname.includes(rule.path) && pathname.endsWith(rule.matchSuffix);
    }
    if (rule.matchContains) {
      return pathname.includes(rule.path) && pathname.includes(rule.matchContains);
    }
    if (rule.excludeSuffix && pathname.endsWith(rule.excludeSuffix)) return false;
    const exactMatch = pathname === rule.path;
    const dynamicMatch = pathname.startsWith(rule.path) && rule.path.endsWith("/");
    return exactMatch || dynamicMatch;
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Static assets — always pass through
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Auth API endpoints — always public
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // All GET requests (pages and API reads) are public — no login required
  if (method === "GET") {
    return NextResponse.next();
  }

  // Everything below is a mutation (POST, PATCH, DELETE, etc.) — requires auth
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  // Admin-only API mutations
  if (pathname.startsWith("/api/") && isAdminOnlyApi(pathname, method) && payload.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  // Admin-only page POST (e.g. form submissions on admin pages)
  if (ADMIN_ONLY_PAGES.some((p) => pathname.startsWith(p)) && payload.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
