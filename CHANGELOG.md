# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full employee goal-setting workflow: create, submit, lock, export (CSV/Excel/PDF)
- Manager approval/rejection queue with comment support
- Quarterly check-ins with UoM-aware progress scoring (6 types: MIN/MAX numeric, MIN/MAX percentage, TIMELINE, ZERO)
- Analytics dashboard: summary cards, department bar chart, risk heatmap, predictive trajectory chart, leaderboard with badge tiers (Bronze → Platinum)
- Goal-level predictive analytics: fiscal-year velocity model, per-goal year-end projection
- Shared goals workflow: peer-selector dialog, audit trail, SSE push to all collaborators
- Escalation system: auto-detect unsubmitted/unapproved goals, manager escalation panel with open/resolved tables
- Real-time updates via Server-Sent Events (SSE) backed by Redis pub/sub — invalidates tRPC cache on GOAL_APPROVED, GOAL_REJECTED, CHECK_IN_ADDED, ESCALATION_CREATED, etc.
- Streak UI: flame badge in app-shell sidebar, leaderboard streak column
- In-app notification centre with bell icon, unread count, mark-as-read
- Email notifications via Resend on goal approve/reject
- Microsoft Teams adaptive-card notifications via Graph API
- Admin cycle management: create/edit fiscal-year cycles with Q1–Q4 windows
- Dual backend: demo-store (in-memory, zero-config) + db-store (Prisma/MongoDB)
- NextAuth v5 with credentials provider and optional Azure AD SSO
- Role-based middleware: EMPLOYEE, MANAGER, ADMIN guards on all protected routes
- AI goal suggestions powered by OpenAI gpt-4.1-mini with JSON schema output
- Redis sliding-window rate limiting on all tRPC mutations
- Redis JSON caching with TTLs for analytics and dashboard queries
- Dark/light theme toggle with smooth CSS transitions
- Accessibility: high-contrast mode, font-scale control
- PWA: web app manifest, service-worker offline shell cache
- SEO: `robots.ts`, `sitemap.ts`, comprehensive OG/Twitter metadata
- Public landing page with feature grid, "How it works" walkthrough, and CTA
- Public GitHub repo files: LICENSE (MIT), SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, issue templates, PR template
- `.env.example` with documentation for all environment variables
