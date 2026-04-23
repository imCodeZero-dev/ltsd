import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Pages only accessible when NOT logged in
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Pages that require a valid session
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/watchlist",
  "/notifications",
  "/settings",
  "/admin",
];

// Next.js 16 uses proxy.ts with a named `proxy` export (formerly middleware.ts default)
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session      = req.auth;
  const isLoggedIn   = !!session;

  const onAuthPage      = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const onProtectedPage = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Logged-in user hit landing page or auth page → send to dashboard
  if (isLoggedIn && (pathname === "/" || onAuthPage)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Unauthenticated user hit a protected page → send to login
  if (!isLoggedIn && onProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next.js internals, static files, and image assets
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|images|figma-previews|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp)$).*)",
  ],
};
