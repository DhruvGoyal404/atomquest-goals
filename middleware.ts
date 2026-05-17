import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants/app";

const protectedPrefixes = ["/employee", "/manager", "/admin"];

export default auth((request) => {
  const { nextUrl } = request;
  const session = request.auth;
  const pathname = nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const userRole = session?.user?.role;

  // Unauthenticated user hits protected route → redirect to /login
  if (isProtected && !userRole) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Role-based access control
  if (userRole) {
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole], nextUrl));
    }
    if (
      pathname.startsWith("/manager") &&
      !["MANAGER", "ADMIN"].includes(userRole)
    ) {
      return NextResponse.redirect(new URL(ROLE_HOME[userRole], nextUrl));
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
