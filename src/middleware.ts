import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// All internal staff roles — can access /admin routes
const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "CS", "MARKETING", "CREATOR", "HEAD_TUTOR"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  const userRole = (token?.role as string) ?? "";

  // ── Protect authenticated routes ──────────────────────────────────────────
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/student");

  if (isProtectedPath) {
    // Not logged in → redirect to login
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // /admin → only staff roles allowed; others sent to their own area
    if (pathname.startsWith("/admin")) {
      if (STAFF_ROLES.includes(userRole)) {
        // ✅ Allowed — per-page guards handle finer-grained access
        return NextResponse.next();
      }
      if (userRole === "TUTOR" || userRole === "HEAD_TUTOR") return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
      if (userRole === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    // /tutor → TUTOR and HEAD_TUTOR
    if (pathname.startsWith("/tutor") && userRole !== "TUTOR" && userRole !== "HEAD_TUTOR") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    // /student → STUDENT only
    if (pathname.startsWith("/student") && userRole !== "STUDENT") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
  }

  // ── Post-login redirect from "/" or "/login" ──────────────────────────────
  if ((pathname === "/" || pathname === "/login") && token) {
    // Staff → /admin (landing page handles role-specific content)
    if (STAFF_ROLES.includes(userRole)) {
      // SUPER_ADMIN gets straight to CRM as the primary workflow
      if (userRole === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin/crm", req.url));
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (userRole === "TUTOR" || userRole === "HEAD_TUTOR") return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
    if (userRole === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/tutor/:path*",
    "/student/:path*",
    "/login",
    "/",
  ],
};
