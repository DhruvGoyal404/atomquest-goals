import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/features/auth/login-form";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: "Sign in — AtomQuest Goals",
  description: "Sign in to your AtomQuest Goals workspace to plan, track, and achieve your FY 2026-27 performance goals.",
  robots: { index: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.role && ROLE_HOME[session.user.role]) {
    redirect(ROLE_HOME[session.user.role]);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-0 bg-muted/30" />
      <section className="relative grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex rounded-md border bg-card/80 px-3 py-1 text-sm text-muted-foreground backdrop-blur">
            AtomQuest Hackathon 2026
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              AtomQuest Goals
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              FY 2026-27 planning is open. Submit goals, clear approvals, and keep quarterly progress visible.
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ["82%", "Q1 check-ins complete"],
              ["3", "manager approvals pending"],
              ["Jun 30", "Q1 window close"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border bg-card/75 p-4 backdrop-blur">
                <span className="block text-2xl font-semibold">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
