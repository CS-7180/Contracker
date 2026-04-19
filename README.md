# Contracker

Contract & Supplier Management Platform built with Next.js 14, Supabase, and deployed on Vercel.

[![CI](https://github.com/CS-7180/Contracker/actions/workflows/ci.yml/badge.svg)](https://github.com/CS-7180/Contracker/actions/workflows/ci.yml)
[![Deploy](https://github.com/CS-7180/Contracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/CS-7180/Contracker/actions/workflows/deploy.yml)
[![Production](https://img.shields.io/badge/production-live-brightgreen)](https://contracker-zeta.vercel.app/)

> **Live app:** [https://contracker-zeta.vercel.app](https://contracker-zeta.vercel.app)
> **Blog post:** [Building Contracker with TDD + Claude Code](https://medium.com/@vineela.vgoli/contracker-40789a7c71ff)

---

## Architecture

```mermaid
graph TD
    Browser[Browser]

    Browser -->|HTTPS| NextJS[Next.js 14 - App Router + API Routes]

    NextJS -->|Auth session| SupabaseAuth[Supabase Auth]
    NextJS -->|Parameterised queries| SupabaseDB[Supabase PostgreSQL]
    NextJS -->|Signed URLs| SupabaseStorage[Supabase Storage - PDFs]
    NextJS -->|Transactional email| Resend[Resend]
    NextJS -->|Error capture| Sentry[Sentry]
    NextJS -.->|Deployed to| Vercel[Vercel]

    Cron[Cron - /api/cron/notifications]
    Cron -->|Insert notifications| SupabaseDB
    Cron -->|Send alert email| Resend

    CI[GitHub Actions CI - 8 stages]
    CI -->|Preview and production deploy| Vercel
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your real values (see `.env.local.example` for required keys).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm test` | Run unit + integration tests (252 tests) |
| `npm run test:coverage` | Run tests with coverage report (≥70% gate) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:e2e` | Playwright E2E tests (7 specs, 114 tests) |
| `npx stryker run` | Mutation testing scoped to `lib/risk.ts` (local only) |

## Running Tests

Create a `.env.test` file (gitignored) with the same keys as `.env.local.example` before running tests:

```bash
cp .env.local.example .env.test
# fill in .env.test with real values
npm test
```

---

## Project Structure

```
app/
├── (auth)/login, signup       → Auth pages
├── (app)/                     → Protected app pages
│   ├── dashboard/             → Traffic-light risk dashboard
│   ├── contracts/             → Contract CRUD + PDF upload
│   ├── suppliers/             → Supplier CRUD
│   ├── compliance/            → Certification tracking
│   ├── spend/                 → Spend analytics (Recharts)
│   ├── notifications/         → In-app renewal alerts
│   └── settings/team/         → Team management (Admin only)
├── api/                       → Next.js API routes
│   ├── contracts/, suppliers/
│   ├── certifications/, notifications/
│   ├── dashboard/, spend/, team/
│   └── cron/notifications/    → Daily alert cron
├── api-docs/                  → Swagger UI API explorer (/api-docs)
components/                    → shadcn/ui + custom components
lib/
├── risk.ts                    → getContractStatus(), getRiskColour(), getCertificationStatus() — primary TDD targets
├── alerts.ts                  → shouldSendAlert() — alert threshold logic
├── openapi.ts                 → OpenAPI spec (excluded from coverage)
supabase/migrations/           → SQL schema + seed data
__tests__/                     → Vitest unit + integration tests (252)
e2e/                           → Playwright E2E specs (7 specs, 114 tests)
session_logs/                  → Development session logs
docs/                          → PRD, schema, API design, sprint plan
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + React 18 |
| Database | Supabase (PostgreSQL + RLS + Auth + Storage) |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix UI) |
| Animation | Framer Motion |
| Charts | Recharts |
| Email | Resend |
| Testing | Vitest + React Testing Library + Playwright |
| Property-based testing | fast-check v4.7.0 |
| Mutation testing | Stryker (95.65% mutation score on `lib/risk.ts`) |
| CI/CD | GitHub Actions (8 stages) + Vercel |
| Error Tracking | Sentry |
| Uptime | Better Uptime |

---

## Bonus Work

### Property-based testing (fast-check)

Seven property-based tests (`AC-PBT-1` through `AC-PBT-7`) are in `__tests__/lib/risk.test.ts`, verifying structural invariants for `getContractStatus()` and `getRiskColour()` across thousands of randomly generated date and integer combinations. fast-check v4.7.0 is installed as a dev dependency.

Invariants verified: `endDate < today` always returns `expired`; `daysToRenewal ≤ noticePeriodDays` always returns `expiring`/`red`; `daysToRenewal > 60` always returns `active`/`green`; any valid input never throws. Implemented in PR #84 following the full TDD `test:` → `feat:` → `refactor:` sequence.

### Mutation testing (Stryker)

`stryker.config.mjs` is scoped to `lib/risk.ts`. Run locally with `npx stryker run` — intentionally excluded from CI (runtime cost). **Mutation score: 95.65%** (44 killed, 2 survived out of 46 mutants). Both surviving mutants are equivalent: `StringLiteral` mutations swapping `'T00:00:00Z'` for `""` in `getCertificationStatus()`, which produce identical runtime behavior per the ECMAScript spec. Implemented in PR #85.

---

## Production Database Setup

### First-time setup

The first user to sign up automatically becomes the **admin** — this is enforced by a Postgres trigger on `auth.users` (`handle_new_user` in `supabase/migrations/001_initial_schema.sql`). Every subsequent signup defaults to `member`.

For a clean production launch:

1. Take a backup — Supabase Studio → Database → Backups → on-demand backup.
2. Create the admin account manually — Studio → Authentication → Users → Add user. Copy the UUID.
3. Run `supabase/cleanup-production.sql` in Studio → SQL Editor (replace `<YOUR_ADMIN_UUID>` with the real UUID). This script:
   - Truncates all user-generated rows (`suppliers`, `contracts`, `certifications`, `notifications`)
   - Deletes every auth user except the admin you created
   - Promotes that account to `role = 'admin'`
4. Wipe contract PDFs manually — Studio → Storage → `contract-pdfs` → select all → delete.

### Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full CRUD — contracts, suppliers, certifications. Manage team members. |
| `member` | View all, create/edit contracts and suppliers. No deletes, no team management. |

Role is stored on `profiles.role` and enforced server-side via `lib/auth.ts:requireAdmin()` on every admin-only route. Client-side role gates are UI convenience only.

---

## Docs

- [Product Requirements](docs/PRD.md)
- [Database Schema](docs/database-schema.md)
- [API Design](docs/api-design.md)
- [Architecture](docs/architecture.md)
- [Acceptance Criteria](docs/acceptance-criteria.md)
- [Sprint Plan](docs/sprint-plan.md)
- [Sprint Retrospectives](docs/sprint-retrospectives.md)
- [Security](docs/security.md)
- [Blog Post](https://medium.com/@vineela.vgoli/contracker-40789a7c71ff)
