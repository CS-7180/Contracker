# Contracker

Contract & Supplier Management Platform built with Next.js 14, Supabase, and deployed on Vercel.

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

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm test` | Run unit + integration tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:e2e` | Playwright E2E tests |

## Running Tests

Create a `.env.test` file (gitignored) with the same keys as `.env.local.example` before running tests:

```bash
cp .env.local.example .env.test
# fill in .env.test with real values
npm test
```

## Project Structure

```
app/          → Next.js App Router pages and API routes
components/   → React components (shadcn/ui + custom)
lib/          → Pure functions and Supabase clients
types/        → TypeScript types from database schema
supabase/     → SQL migrations and seed data
__tests__/    → Vitest unit + integration tests
e2e/          → Playwright end-to-end tests
docs/         → PRD, schema, API design, sprint plan
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **Styling:** Tailwind CSS v3 + shadcn/ui
- **Animation:** Framer Motion
- **Charts:** Recharts
- **Email:** Resend
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions + Vercel

## Docs

- [Product Requirements](docs/Contracker_PRD.md)
- [Database Schema](docs/database-schema.md)
- [API Design](docs/api-design.md)
- [Acceptance Criteria](docs/acceptance-criteria.md)
- [Sprint Plan](docs/sprint-plan.md)
