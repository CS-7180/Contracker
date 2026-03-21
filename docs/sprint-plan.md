# Sprint Plan Reference

## Sprint Overview

| Sprint | Duration | Owner | Goal |
|--------|----------|-------|------|
| Sprint 1 | Mar 24 – Apr 3 | Raj | Auth, Supplier CRUD, Contract CRUD + PDF, CI/CD live |
| Sprint 2 | Apr 4 – Apr 12 | Raj → Vineela handoff | Contract list/search, dashboard, traffic-light UI, notifications |
| Sprint 3 | Apr 13 – Apr 17 | Vineela | Email alerts, spend tracking, compliance, member invitation |

---

## Sprint 1 Milestones (Raj)

### M1.0 — Scaffolding, CI/CD & Monitoring (Mar 24)
- Next.js 14 + Tailwind + shadcn/ui + Framer Motion installed
- Supabase project created, env vars in Vercel
- Full DB schema migrated
- GitHub repo with branch protection on `main`
- `.github/workflows/ci.yml` — lint + test + build on PR
- `.github/workflows/deploy.yml` — Vercel preview on PR, production on merge
- Sentry installed (`@sentry/nextjs`)
- Better Uptime monitor created

### M1.1 — Authentication & Role Gate (Mar 26)
- Login page (email/password)
- Signup page — new user profile with `role = 'admin'`
- Next.js middleware auth gate — unauthenticated → `/login`
- `lib/auth.ts` — `requireAdmin()` server-side helper
- Tests: `__tests__/api/auth.test.ts` (red → green)

### M1.2 — Supplier CRUD (Mar 28)
- Supplier list, create, detail, edit pages
- Admin-only soft delete — 403 for Member; `status = 'inactive'` for Admin
- Tests: `__tests__/api/suppliers.test.ts` (red → green → refactor)

### M1.3 — Contract CRUD + PDF Upload (Apr 1)
- Contract create form with auto-generated `contract_number`
- PDF upload to Supabase Storage (private bucket, signed URL)
- Contract detail + edit pages
- Admin-only delete (403 for Member)
- Status computed via `lib/risk.ts` in API response
- Zod validation on all inputs
- Tests: `__tests__/api/contracts.test.ts` (red → green → refactor)

### M1.4 — Sprint 1 QA & Deploy (Apr 3)
- Happy path: Signup → Create Supplier → Create Contract → View Contract (zero errors)
- Role checks confirmed via automated tests
- CI passing on all PRs
- Production URL live with Sentry + Better Uptime active

---

## Sprint 2 Milestones

### M2.0 — Contract List, Search & Filter (Apr 5) — Raj
- Contract list page with all columns
- Search by name and supplier
- Filter by status, supplier, category
- Sort by renewal date (default ascending)
- Pagination (20 per page)
- Tests: AC-04-x

### M2.1 — Basic Dashboard + Risk Logic (Apr 7) — Raj
- `GET /api/dashboard` — counts by status, expiring-soon list, total value
- Basic dashboard page renders counts
- `lib/risk.ts` — `getContractStatus()` and `getRiskColour()` pure functions
- **HANDOFF COMMIT:** `feature/[n]-risk-lib` merged to main

### M2.2 — Traffic-Light Dashboard UI (Apr 9) — Vineela
- Dashboard extended with risk colour per contract
- Traffic-light badges (green/amber/red) rendered
- Portfolio summary bar (count per colour)
- Contracts sorted red → amber → green
- Supplier risk roll-up
- Tests: AC-06-4, AC-06-5

### M2.3 — In-App Notifications (Apr 11) — Vineela
- `lib/alerts.ts` — `shouldSendAlert()` logic
- Supabase Edge Function cron (daily)
- `GET /api/notifications` — returns unread only
- `PUT /api/notifications/[id]` — marks as read
- Notification bell in nav with unread count
- Notifications page with contract name and days remaining
- Tests: AC-07-x

### M2.4 — Sprint 2 QA (Apr 12) — Both
- Happy path: Login → Contracts List → Dashboard → Notifications (zero errors)
- All Sprint 2 tests passing in CI

---

## Sprint 3 Milestones (Vineela)

### M3.0 — Email Renewal Alerts (Apr 13)
- Resend configured, env vars set
- Edge Function sends email at 60/30/7 day thresholds
- No duplicate emails (unique index enforces idempotency)
- Tests: AC-08-x

### M3.1 — Spend Tracking (Apr 14)
- `GET /api/spend` — totals by supplier and category
- Spend page: supplier + category breakdown tables
- Bar chart (Recharts) — top 10 suppliers
- Year filter
- Tests: AC-09-x

### M3.2 — Compliance & Certification Tracking (Apr 15)
- Certification CRUD on supplier profile
- Certification status computed (valid/expiring/expired)
- Compliance page — all suppliers with cert summary
- Certification document upload
- Tests: AC-10-x

### M3.3 — Member Invitation (Apr 16)
- Team settings page (Admin only)
- `POST /api/team/invite` — Supabase Auth invite
- Invited user profile with `role = 'member'`
- Admin promote/demote
- Tests: AC-11-x

### M3.4 — Final QA, Security Audit & Deploy (Apr 17)
- Full happy path smoke test
- OWASP checklist review
- Lighthouse CI perf gate set to blocking (LCP ≤ 2.5s)
- All Sprint 3 tests passing
- Sentry + Better Uptime confirmed active
- Smoke test: Chrome, Firefox, Safari

---

## Cut Priority (if behind schedule)

| Order | Cut | Impact |
|-------|-----|--------|
| 1 | PDF upload → text fields only | Low |
| 2 | Pagination → cap at 100 | Low |
| 3 | Email alerts → in-app only | Medium |
| 4 | Spend chart → table only | Low |
| 5 | Cert document upload → metadata only | Low |
| 6 | Member invitation UI → manual Supabase invite | Medium |

---

## Sprint 2 Handoff Condition

Raj merges `feature/[n]-risk-lib` to `main` with:
- `lib/risk.ts` implemented and all tests passing
- `getContractStatus()` and `getRiskColour()` exported with type signatures
- `today` injected as optional param for deterministic testing

Vineela's Sprint 2 work begins only after this merge.
