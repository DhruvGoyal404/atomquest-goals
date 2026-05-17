import type { NextAuthConfig } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { Role } from "@/types/domain";

// ---------------------------------------------------------------------------
// Type augmentation for NextAuth
declare module "next-auth" {
  interface JWT {
    id?: string;
    email?: string;
    role?: Role;
  }
  interface Session {
    user: {
      id?: string;
      email?: string;
      role?: Role;
      name?: string | null;
      image?: string | null;
    };
  }
}

// ---------------------------------------------------------------------------
// Edge-safe auth config. This file is imported by middleware.ts which runs
// on the Edge runtime. It MUST NOT import Prisma, bcryptjs, or any Node-only
// module. The CredentialsProvider (which needs Prisma + bcrypt) is added in
// src/lib/auth/index.ts which only runs on the Node.js runtime.
// ---------------------------------------------------------------------------

const azureConfigured = Boolean(
  process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID,
);

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    ...(azureConfigured
      ? [
          AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            authorization: {
              params: {
                scope: "openid profile email User.Read GroupMember.Read.All",
              },
            },
            async profile(profile) {
              return {
                id: profile.sub,
                email: profile.email ?? profile.preferred_username,
                name: profile.name,
                role: "EMPLOYEE" satisfies Role,
                azureAdId: profile.sub,
                azureAdEmail: profile.email ?? profile.preferred_username,
                managerId: null,
                department: null,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first login, set user data
      if (user?.id) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role || "EMPLOYEE";
      }
      // ✅ PRESERVE role on token refresh (when user is undefined)
      // This ensures role is always in the JWT even on subsequent requests
      if (!token.role && user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = (token.role as Role) || "EMPLOYEE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
} satisfies NextAuthConfig;
