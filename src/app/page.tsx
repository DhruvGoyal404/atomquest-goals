import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Flame,
  Goal,
  Lock,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: "AtomQuest Goals — Enterprise Goal Setting & Tracking",
  description:
    "Plan, approve, and track employee goals across every department. FY 2026-27 goal management with real-time analytics, AI suggestions, and Microsoft Teams integration.",
  openGraph: {
    title: "AtomQuest Goals — Enterprise Goal Setting & Tracking",
    description:
      "Plan, approve, and track employee goals across every department. FY 2026-27 goal management with real-time analytics, AI suggestions, and Microsoft Teams integration.",
    type: "website",
  },
};

const features = [
  {
    icon: Goal,
    title: "Structured goal planning",
    description:
      "Create up to 8 goals per cycle with weightage, 6 measurement types, and AI-generated suggestions tailored to your role.",
  },
  {
    icon: ShieldCheck,
    title: "Manager approval workflow",
    description:
      "Submit goals for review. Managers approve or reject with comments. Approved goals are automatically locked and versioned.",
  },
  {
    icon: BarChart3,
    title: "Predictive analytics",
    description:
      "See real-time progress, at-risk signals, leaderboard standings, and velocity-based year-end projections for every goal.",
  },
  {
    icon: Bell,
    title: "Multi-channel notifications",
    description:
      "Instant alerts via in-app notifications, Resend email, and Microsoft Teams adaptive cards — no action goes unnoticed.",
  },
  {
    icon: Bot,
    title: "AI goal suggestions",
    description:
      "OpenAI-powered goal templates based on your department and designation — ready to customise in seconds.",
  },
  {
    icon: Users,
    title: "Shared goals & escalations",
    description:
      "Share goals across teammates, track collaborative accountability, and surface overdue items through an automated escalation engine.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export & audit trail",
    description:
      "Download goal sheets as CSV, Excel, or PDF. Every create, update, and decision is logged in an immutable audit trail.",
  },
  {
    icon: Flame,
    title: "Gamification & streaks",
    description:
      "Earn Bronze → Platinum badges on the leaderboard. Maintain check-in streaks to stay visible and motivated.",
  },
];

const stats = [
  { value: "6", label: "UoM measurement types" },
  { value: "3", label: "Role-based dashboards" },
  { value: "100%", label: "Type-safe API (tRPC)" },
  { value: "< 5 min", label: "Demo setup time" },
];

const steps = [
  {
    step: "01",
    title: "Admin opens a goal cycle",
    body: "HR sets FY dates, Q1–Q4 windows, and activates the planning period across the organisation.",
  },
  {
    step: "02",
    title: "Employees plan their goals",
    body: "Each employee creates up to 8 goals with weightage summing to 100%. AI suggestions speed up planning.",
  },
  {
    step: "03",
    title: "Manager reviews & approves",
    body: "The direct manager approves or rejects each goal. Approved goals are locked and notifications sent automatically.",
  },
  {
    step: "04",
    title: "Quarterly check-ins track progress",
    body: "Planned vs actual values are logged each quarter. Progress scores are computed for all 6 measurement types.",
  },
  {
    step: "05",
    title: "Analytics surface insights",
    body: "Dashboards show at-risk goals, team heatmaps, leaderboards, and predictive year-end trajectories.",
  },
];

const trust = [
  { icon: Lock, text: "Azure AD / Entra ID SSO" },
  { icon: ShieldCheck, text: "Rate limiting (100 req/min)" },
  { icon: Zap, text: "Redis-cached dashboards" },
  { icon: CheckCircle2, text: "Immutable audit trail" },
];

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role && ROLE_HOME[session.user.role]) {
    redirect(ROLE_HOME[session.user.role]);
  }

  const isAuthenticated = Boolean(session?.user);
  const ctaHref = session?.user?.role ? ROLE_HOME[session.user.role] : "/login";
  const ctaLabel = isAuthenticated ? "Go to dashboard" : "Sign in";
  const ctaLabelLong = isAuthenticated ? "Go to your dashboard" : "Sign in to your workspace";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Goal className="size-5" />
            </div>
            <span className="text-sm font-semibold">AtomQuest Goals</span>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {ctaLabel}
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              AtomQuest Hackathon 2026 · FY 2026-27 planning is open
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Goal-driven performance,
              <br />
              <span className="text-primary">quarterly visibility</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Track, approve, and align employee goals across every department — from planning to
              completion — with real-time analytics, AI suggestions, and Microsoft Teams
              integration.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {ctaLabelLong}
                <ChevronRight className="size-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border bg-background px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mt-20 max-w-3xl">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border bg-card/70 p-4 text-center backdrop-blur"
                >
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Features grid */}
        <section className="px-4 py-20 sm:px-6" aria-labelledby="features-heading">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium text-primary">Everything in one place</p>
              <h2
                id="features-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
              >
                A complete performance management system
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Built for enterprises. Designed for hackathons. Every feature you need to run a
                quarterly goal cycle end-to-end.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-xl border bg-card/60 p-6 backdrop-blur transition-colors hover:bg-card"
                  >
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="border-t bg-muted/30 px-4 py-20 sm:px-6"
          aria-labelledby="how-heading"
        >
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium text-primary">The workflow</p>
              <h2
                id="how-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-foreground"
              >
                How it works
              </h2>
            </div>
            <ol className="space-y-8">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-sm font-bold text-primary">
                    {s.step}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust bar */}
        <section className="px-4 py-16 sm:px-6" aria-label="Security and compliance highlights">
          <div className="mx-auto max-w-4xl">
            <p className="mb-8 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Enterprise-grade by default
            </p>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {trust.map((t) => {
                const Icon = t.icon;
                return (
                  <li
                    key={t.text}
                    className="flex items-center gap-3 rounded-lg border bg-card/60 px-4 py-3 text-sm font-medium text-foreground"
                  >
                    <Icon className="size-4 shrink-0 text-primary" />
                    {t.text}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Sign in with your AtomQuest credentials or use the demo accounts to explore the
              platform instantly.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                {ctaLabel}
                <ChevronRight className="size-5" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Demo credentials available on the sign-in page · No setup required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Goal className="size-4" />
            <span>AtomQuest Goals · Hackathon 2026</span>
          </div>
          <div className="flex gap-6">
            <Link href={ctaHref} className="hover:text-foreground transition-colors">{ctaLabel}</Link>
            <a
              href="https://github.com/dhruv-goyal/atomquest-portal"
              className="hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
