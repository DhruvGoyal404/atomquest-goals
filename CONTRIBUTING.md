# Contributing to AtomQuest Goals

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| npm | 10+ |
| MongoDB | 7+ (local) or Atlas free tier |

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/DhruvGoyal404/atomquest-goals
cd atomquest-portal

# 2. Install dependencies
npm install

# 3. Copy environment template and fill in values
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Push Prisma schema and seed demo data
npm run db:push
npm run db:seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `employee@atomquest.com / demo123` to log in.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | MongoDB connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret (run `openssl rand -base64 32`) |
| `NEXTAUTH_SECRET` | ✅ | Same value as AUTH_SECRET |
| `AUTH_URL` | ✅ | App base URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_URL` | ✅ | Same as AUTH_URL |
| `AZURE_AD_CLIENT_ID` | ⬜ | Azure AD app client ID (SSO) |
| `AZURE_AD_CLIENT_SECRET` | ⬜ | Azure AD app secret |
| `AZURE_AD_TENANT_ID` | ⬜ | Azure AD tenant ID |
| `REDIS_URL` | ⬜ | Redis/Valkey connection (caching + rate limiting) |
| `RESEND_API_KEY` | ⬜ | Resend API key (email notifications) |
| `OPENAI_API_KEY` | ⬜ | OpenAI key (AI goal suggestions) |
| `NEXT_PUBLIC_APP_URL` | ⬜ | Public URL for OG/sitemap (defaults to localhost) |

## Available Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type check
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to MongoDB
npm run db:seed      # Seed demo data
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── (auth)/           # Login page (public)
│   ├── (dashboard)/      # Protected dashboards (employee, manager, admin)
│   └── api/              # API routes (NextAuth, tRPC, SSE, webhooks)
├── components/
│   ├── features/         # Domain components (goals, analytics, escalations…)
│   ├── layouts/          # AppShell, NotificationBell, ThemeToggle
│   ├── providers/        # tRPC, Theme, ServiceWorker providers
│   └── ui/               # shadcn/ui base components
├── lib/
│   ├── auth/             # NextAuth config (edge-safe + Node.js)
│   ├── cache/            # Redis helpers + pub/sub
│   ├── constants/        # App-wide constants
│   ├── integrations/     # Resend, Microsoft Teams, Graph API
│   ├── utils/            # cn, format, progress calculator, exporters
│   └── validations/      # Zod schemas
├── server/
│   ├── routers/          # tRPC routers (goals, check-ins, analytics…)
│   ├── services/         # Business logic (db-store, demo-store, ai-goals)
│   └── middleware/       # Rate limiter
├── hooks/                # Custom React hooks
└── types/                # TypeScript domain types
```

## Coding Standards

- **TypeScript strict mode** — no `any` types
- **No comments** unless explaining a non-obvious WHY (not WHAT)
- **Prefer editing existing files** over creating new ones
- **Server components by default** — add `"use client"` only when needed
- **tRPC for all data mutations** — no raw `fetch` to `/api/trpc`
- **Zod for all inputs** — validate at the router layer
- **Sanitise all strings** before writing to DB (use the `sanitize()` helper in `db-store.ts`)

## Pull Request Process

1. Fork the repository and create a branch: `git checkout -b feat/your-feature`
2. Make your changes and ensure `npm run typecheck` and `npm run lint` pass
3. Update `CHANGELOG.md` under **Unreleased** with a brief description
4. Open a PR against `main` — fill in the PR template
5. A maintainer will review within 3 business days

## Commit Message Format

```
<type>(<scope>): <short summary>

Types: feat | fix | refactor | docs | chore | perf | test
Scope: goals | analytics | auth | escalations | ui | db | ci | deps
```

Examples:
```
feat(goals): add shared-goal peer selector dialog
fix(auth): remove Prisma import from login page to fix 404
```

## Reporting Bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md). Include reproduction steps, expected vs actual behaviour, and your environment.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to abide by its terms.
