import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth/auth.config";
import { loginSchema } from "@/lib/validations/auth.validation";
import { prisma } from "@/lib/db/prisma";
import { getDemoUserByEmail, demoPassword } from "@/server/services/demo-store";

// ---------------------------------------------------------------------------
// Node.js-only auth setup. This file adds the CredentialsProvider (which
// needs Prisma + bcrypt) on top of the Edge-safe auth.config.ts.
// The middleware uses auth.config.ts directly; API routes use this file.
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    CredentialsProvider({
      name: "Demo credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        // Demo shortcut — uses demo-store IDs so getDemoUserById works in the layout
        if (parsed.data.password === demoPassword) {
          const demoUser = getDemoUserByEmail(email);
          if (demoUser) {
            return { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role, image: null };
          }
        }

        // Real DB path (requires MongoDB to be running)
        try {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true, passwordHash: true },
          });
          if (!user || !user.passwordHash) return null;
          const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, role: user.role, image: null };
        } catch {
          return null;
        }
      },
    }),
  ],
});
