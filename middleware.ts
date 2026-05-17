import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { ROLE_HOME } from "@/lib/constants/app";

const protectedPrefixes = ["/employee", "/manager", "/admin"];
const publicOnlyPaths = ["/login", "/"];

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const session = request.auth;
  const isProtected = protectedPrefixes.some((prefix) => nextUrl.pathname.startsWith(prefix));
  const isPublicOnly = publicOnlyPaths.includes(nextUrl.pathname);

  // Authenticated users should not see /login or / — send them to their dashboard
  if (isPublicOnly && session?.user?.role) {
    const home = ROLE_HOME[session.user.role];
    if (home) return NextResponse.redirect(new URL(home, nextUrl));
  }

  // Unauthenticated users trying to reach protected routes → /login
  if (isProtected && !session?.user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Role-based guards for protected routes
  if (session?.user?.role) {
    const home = ROLE_HOME[session.user.role];
    if (nextUrl.pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
      return home ? NextResponse.redirect(new URL(home, nextUrl)) : NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (
      nextUrl.pathname.startsWith("/manager") &&
      !["MANAGER", "ADMIN"].includes(session.user.role)
    ) {
      return home ? NextResponse.redirect(new URL(home, nextUrl)) : NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on every route except Next.js internals and static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|icon\\.svg|robots\\.txt|sitemap\\.xml).*)",
  ],
};
