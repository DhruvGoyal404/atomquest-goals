import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// ---------------------------------------------------------------------------
// Edge-safe auth wrapper for middleware.ts
// This file creates the auth function WITHOUT Prisma/Node.js dependencies
// ---------------------------------------------------------------------------

export const auth = NextAuth(authConfig).auth;
