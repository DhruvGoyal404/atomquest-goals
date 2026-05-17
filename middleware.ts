import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { ROLE_HOME } from "@/lib/constants/app";

const protectedPrefixes = ["/employee", "/manager", "/admin"];
const authPaths = ["/login", "/"];

// ✅ Use Edge-safe authConfig (no Prisma/bcryptjs)
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { nextUrl } = request;
  const session = request.auth;
  const pathname = nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPath = authPaths.includes(pathname);
  const hasRole = session?.user?.role as keyof typeof ROLE_HOME | undefined;

  // Logged-in user hits /login or / → redirect to role-specific dashboard
  if (isAuthPath && hasRole && ROLE_HOME[hasRole]) {
    return NextResponse.redirect(new URL(ROLE_HOME[hasRole], nextUrl));
  }

  // Unauthenticated user hits protected route → redirect to /login
  if (isProtected && !session?.user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Role-based access control for protected routes
  if (hasRole) {
    if (pathname.startsWith("/admin") && hasRole !== "ADMIN") {
      return NextResponse.redirect(new URL(ROLE_HOME[hasRole], nextUrl));
    }
    if (
      pathname.startsWith("/manager") &&
      !["MANAGER", "ADMIN"].includes(hasRole)
    ) {
      return NextResponse.redirect(new URL(ROLE_HOME[hasRole], nextUrl));
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
