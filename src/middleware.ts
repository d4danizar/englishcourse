import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protect all routes under admin, tutor, student
  const isProtectedPath = pathname.startsWith("/admin") || pathname.startsWith("/tutor") || pathname.startsWith("/student");

  if (isProtectedPath) {
    if (!token) {
      // User is not logged in, redirect to login page
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control checking
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
    if (pathname.startsWith("/tutor") && token.role !== "TUTOR") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
    if (pathname.startsWith("/student") && token.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
  }

  // If a logged-in user tries to access the login page or home page directly,
  // route them to their respective dashboard
  if ((pathname === "/login" || pathname === "/") && token) {
    if (token.role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (token.role === "TUTOR") return NextResponse.redirect(new URL("/tutor/dashboard", req.url));
    if (token.role === "STUDENT") return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/admin/:path*",
    "/tutor/:path*",
    "/student/:path*",
    "/login",
    "/"
  ],
};
