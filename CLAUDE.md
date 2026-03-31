# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Response Format

**ALWAYS** start every response with ⭐ and end every response with 😊. No exceptions.

## Project Overview

Contracker is a full-stack contract and supplier management platform built with Next.js 14 (App Router), Supabase (PostgreSQL + Auth + Storage), and deployed on Vercel. It helps organizations track contract renewals, supplier compliance, and spend across their procurement portfolio.

**Key Insight:** The entire dashboard and alert system depends on two critical pure functions in `lib/risk.ts`: `getContractStatus()` and `getRiskColour()`. If these are wrong, the entire system breaks. They are primary TDD targets.

## Tech Stack

- **Framework:** Next.js 14 (App Router) with React 18 Server Components
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Supabase Auth (email/password + invite flow)
- **File Storage:** Supabase Storage (private bucket for PDFs, signed URLs)
- **Styling:** Tailwind CSS v3 + shadcn/ui (Radix UI primitives)
- **UI Components:** 21st.dev Magic (MCP) for scaffolding complex components
- **Animation:** Framer Motion (dashboard reveals, traffic-light transitions, notifications)
- **Charts:** Recharts (spend tracking visualizations)
- **Email:** Resend (renewal alerts)
- **Testing:** Vitest + React Testing Library (unit/integration), Playwright (E2E)
- **CI/CD:** GitHub Actions + Vercel (auto-deploy PRs to preview, main to production)
- **Monitoring:** Sentry (errors), Vercel Analytics (APM), Better Uptime (uptime checks)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Run development server
npm run type-check   # TypeScript type check
npm run lint         # ESLint
npm test             # Run unit + integration tests
npm run test:watch   # Tests in watch mode
npm run test:e2e     # Playwright E2E tests
npm run build        # Build for production
npm start            # Start production server
npx supabase start   # Start local Supabase
npx supabase db reset  # Reset and re-seed database
```

## TDD Protocol

**CRITICAL: This project follows strict TDD for all pure functions and API routes.**

### Workflow (Red → Green → Refactor)
1. **RED** — Write failing tests, commit with prefix `test:`
2. **GREEN** — Implement minimal code to pass, commit with prefix `feat:`
3. **REFACTOR** — Clean up, commit with prefix `refactor:`

**NEVER combine test writing + implementation in a single commit.**

### Primary TDD Targets

| File | Function | Why |
|------|----------|-----|
| `lib/risk.ts` | `getContractStatus()` | Returns active/expiring/expired — wrong = broken dashboard |
| `lib/risk.ts` | `getRiskColour()` | Returns green/amber/red — wrong = misleading traffic lights |
| `lib/alerts.ts` | `shouldSendAlert()` | Determines alert firing — wrong = duplicate alerts or missed renewals |
| `app/api/contracts/route.ts` | POST handler | Role checks + validation — wrong = security vulnerability |
| `app/api/contracts/[id]/route.ts` | DELETE handler | Admin-only enforcement — wrong = unauthorized deletion |

### Commits (TDD sequence — never skip)
```
test: add failing tests for [feature]      ← RED
feat: implement [feature] to pass tests    ← GREEN
refactor: [description of cleanup]         ← REFACTOR (optional)
```

## Do's and Don'ts

### Do
- **DO** write the test commit before the implementation commit — always separate
- **DO** inject `today: Date = new Date()` in any function that computes from current date
- **DO** compute `status` and `risk_colour` in the application layer, never store in DB
- **DO** validate all API inputs with Zod before touching the database
- **DO** check `supabase.auth.getUser()` + role from `profiles` on every API route
- **DO** use `{ data, error }` response shape consistently across all API routes
- **DO** use signed URLs (15-min expiry) for Supabase Storage; UUID-based filenames for PDFs
- **DO** use `new Date().toISOString().split('T')[0]` when inserting DATE fields
- **DO** rely on `idx_notifications_unique` as the sole deduplication mechanism

### Don't
- **DON'T** filter contracts by `status` in SQL — compute in app layer, then filter
- **DON'T** expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to the client bundle
- **DON'T** hard-delete suppliers — soft delete only (`status = 'inactive'`)
- **DON'T** delete a supplier with active contracts — `ON DELETE RESTRICT` will throw
- **DON'T** accept non-PDF files or files over 10MB in upload routes

## Coding Conventions

### TypeScript
- All functions in `lib/` must have explicit return type annotations
- Pure functions must accept `today: Date = new Date()` as the last optional parameter
- Use `type` (not `interface`) for plain data shapes; `interface` only for extendable contracts
- Import Supabase types from `types/database.ts` — don't inline ad-hoc types

### API Routes
- File location: `app/api/[resource]/route.ts` and `app/api/[resource]/[id]/route.ts`
- Always: authenticate → check role (if admin-only) → validate with Zod → query DB → return `{ data, error }`
- Return `{ data: null, error: { message, code } }` with the correct HTTP status on all error paths
- Clamp pagination: `page >= 1`, `limit <= 100`

### Naming
- Files: `kebab-case.ts` / `kebab-case.tsx`
- React components: `PascalCase`
- Functions/variables: `camelCase`
- Database columns: `snake_case`
- Branch names: `feature/[issue-number]-short-description`

### Zod Schemas
- Define schemas at module top-level (not inline inside the handler)
- Use `.regex(/^\d{4}-\d{2}-\d{2}$/)` for all date string fields
- Use `.uuid()` for all foreign key fields

## Playwright UI Testing Protocol

See `docs/playwright-protocol.md` for the full Playwright E2E testing checklist, structure template, and gotchas.

@docs/playwright-protocol.md

## Key Gotchas

1. **Status is computed, not stored** — Never filter by `status` in SQL
2. **Unique index prevents duplicate alerts** — Let DB constraint handle it, no code guards
3. **Role checks are server-side only** — Client-side role gates are UI convenience only
4. **Renewal date ≠ end date** — Renewal date = when notice must be given; end date = contract expiry
5. **Notice period is in days** — Integer, not interval. Use `diffInDays()` helper
6. **All dates are DATE type** — No timestamps. Use `.toISOString().split('T')[0]` for inserts
7. **TDD commits must be separate** — Never combine test + implementation in one commit
8. **PDF storage is private bucket** — Always use signed URLs with expiry

---

## Reference Documents

@docs/architecture.md        <!-- status computation, traffic-light logic, RBAC, project structure -->
@docs/security.md            <!-- Zod validation, file upload rules, env vars, OWASP checklist -->
@docs/cicd.md                <!-- branch strategy, PR workflow, deployment, sprint handoff -->
@docs/ui-conventions.md      <!-- color system, Framer Motion, component scaffolding -->
@docs/PRD.md                 <!-- functional requirements FR-01–FR-11, architecture, DB schema, API design -->
@docs/IMPLEMENTATION.md      <!-- CI/CD pipeline, sprint plan, milestones, TDD strategy, NFRs, open risks -->
@docs/database-schema.md     <!-- full SQL schema, computed fields, FK behaviors -->
@docs/api-design.md          <!-- all routes, Zod schemas, auth/role patterns -->
@docs/acceptance-criteria.md <!-- all ACs (AC-01–AC-11) mapped to test files -->
@docs/sprint-plan.md         <!-- sprint milestones M1.0–M3.4, cut priorities -->

## Sprint 2 → Sprint 3 Handoff (Raj → Vineela)

Sprint 2 is complete. Issues #15–#18 are all merged to `main`. CI green. Production live at https://contracker.vercel.app.

**What's done:** Auth, supplier CRUD, contract CRUD + PDF upload, contract list with search/filter/sort/pagination, risk library (`lib/risk.ts`), dashboard API (`GET /api/dashboard`), and dashboard UI with live stat cards and expiring-soon list.

**Vineela picks up Sprint 3** starting with the issues for email alerts, spend tracking, compliance/certification tracking, and member invitation — see `docs/sprint-plan.md` M3.0–M3.4 for the full checklist.

**APIs for Sprint 3 still needed:** `GET /api/spend`, `GET/POST/PUT/DELETE /api/certifications`, `POST /api/team/invite`, `PUT /api/team/[id]`. All follow the same auth → role → Zod → DB → `{ data, error }` pattern in `docs/api-design.md`.
