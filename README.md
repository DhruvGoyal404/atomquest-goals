# AtomQuest Goals

Enterprise goal-setting and quarterly tracking portal. AtomQuest Hackathon 2026 submission.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Demo

| Role | Email | Password |
|---|---|---|
| Employee | `employee@atomquest.com` | `demo123` |
| Manager | `manager@atomquest.com` | `demo123` |
| Admin | `admin@atomquest.com` | `demo123` |

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL + AUTH_SECRET
npm run db:push && npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js 16 · tRPC v11 · Prisma + MongoDB · NextAuth v5 · Redis · Tailwind 4 · shadcn/ui

## Docker

```bash
docker compose up --build
```

## Deploy on Vercel

1. Push to GitHub
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Set environment variables from `.env.example`
4. Deploy

## Docs

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © 2026 Dhruv Goyal
