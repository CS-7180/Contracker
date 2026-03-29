> Companion to `docs/PRD.md` — covers CI/CD, sprints, milestones, TDD strategy, and operational requirements.

---

## 9. CI/CD, Monitoring & Security

### 9.1 Branch Strategy & Naming Convention

```
main          → production (auto-deploys to Vercel production)
staging       → staging/preview environment
feature/*     → feature branches (PR into main)
fix/*         → bug fixes
chore/*       → non-functional changes (deps, config)
```

**Branch naming format:**
```
feature/[issue-number]-short-description
fix/[issue-number]-short-description

Examples:
  feature/42-contract-crud
  feature/17-traffic-light-dashboard
  fix/53-renewal-date-off-by-one
```

All branch names use lowercase kebab-case. Issue number required. No spaces.

### 9.2 CI/CD Pipeline (GitHub Actions + Vercel)

#### PR Workflow (`ci.yml`) — runs on every pull request

```yaml
jobs:
  lint:       # ESLint + TypeScript type check
  test:       # Vitest unit + integration tests
  e2e:        # Playwright end-to-end tests
  build:      # next build (catches build-time errors)
  perf-gate:  # Lighthouse CI — fails PR if LCP > 2.5s or CLS > 0.1
```

**Performance gate:** PRs that degrade Core Web Vitals (LCP > 2.5s) are blocked from merging. This is enforced via `@lhci/cli` in the CI pipeline.

#### Deploy Workflow (`deploy.yml`)

| Event | Target | Behaviour |
|---|---|---|
| PR opened/updated | Vercel Preview URL | Auto-deployed; unique URL per PR |
| Merge to `main` | Vercel Production | Auto-deploys; Vercel handles blue-green internally (zero downtime) |
| Rollback needed | Vercel Dashboard | One-click rollback to previous deployment |

**Blue-green / canary strategy:** Vercel's deployment model provides zero-downtime production deploys. Each deploy is immutable and instantly promotable/rollbackable. For canary testing, Vercel's deployment protection rules allow traffic splitting between the new deploy (preview) and current production before full promotion.

#### CI Status Checks Required to Merge

- `lint` — must pass
- `test` — must pass (100% of existing tests)
- `build` — must pass
- `perf-gate` — LCP ≤ 2.5s, CLS ≤ 0.1 (warning only until Sprint 2, blocking from Sprint 3)

### 9.3 Monitoring Stack

| Tool | Purpose | Config |
|---|---|---|
| **Sentry** | Error tracking — captures unhandled exceptions in both client and API routes. Alerts on new issues and error spikes. | Installed via `@sentry/nextjs`. DSN stored in Vercel env vars. Slack alert on new P1 issues. |
| **Vercel Analytics** | APM — tracks route performance, Core Web Vitals (LCP, FID, CLS), and page-level traffic. | Enabled in `next.config.ts`. No additional install needed. |
| **Better Uptime** | Uptime monitoring — HTTP check on production URL every 3 minutes. Alerts via email if downtime > 1 minute. | Monitor: `https://contracker.vercel.app`. Alert contacts: Raj + Vineela email. |

**Alerting thresholds:**
- Sentry: alert on any new issue with `level: error` or `level: fatal`
- Better Uptime: alert if uptime check fails for 2 consecutive intervals (6 minutes)
- Vercel Analytics: review weekly; no automated alerting (observational only for MVP)

### 9.4 Security

#### Secrets Management
- All secrets stored in **Vercel Environment Variables** (production) and **GitHub Secrets** (CI/CD)
- No secrets in source code, `.env` files not committed (`.env.local` in `.gitignore`)
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never exposed to client
- `RESEND_API_KEY` — server-side only
- `SENTRY_DSN` — safe to expose to client (public by design)

#### OWASP Top 10 — Addressed Items

| OWASP Risk | Mitigation in Contracker |
|---|---|
| A01 Broken Access Control | Role checks enforced in every API route handler server-side. Supabase RLS as secondary net. Member cannot reach Admin endpoints regardless of client manipulation. |
| A02 Cryptographic Failures | HTTPS enforced by Vercel. Supabase Storage uses private buckets + signed URLs (15-min expiry). No sensitive data in localStorage. |
| A03 Injection | Supabase JS client uses parameterised queries — no raw SQL string interpolation. All user inputs validated with Zod before DB operations. |
| A04 Insecure Design | Auth state never trusted client-side alone. Session validated server-side on every API call via `supabase.auth.getUser()`. |
| A05 Security Misconfiguration | Vercel preview URLs protected by Vercel deployment protection. No debug endpoints in production. Error messages in API responses never expose stack traces. |
| A07 Identification & Auth Failures | Supabase Auth handles session expiry, token refresh, and brute-force protection. No custom auth logic. |
| A09 Security Logging & Monitoring | Sentry captures all server-side errors including auth failures. Supabase provides auth audit logs. |

#### Input Validation
- All API route inputs validated with **Zod** schemas before any DB operation
- File uploads: type check (PDF only) and size check (10MB max) before Supabase Storage call
- Pagination params: clamped server-side (page ≥ 1, limit ≤ 100)

---

## 10. Sprint Plan

### Sprint 1 — Foundation (Raj)
**Duration:** March 24 — April 3
**Owner:** Raj
**Goal:** Auth, supplier CRUD, contract CRUD with PDF upload, CI/CD pipeline live, monitoring configured.

#### Screens in Sprint 1

| Screen | Route |
|---|---|
| Login | `/login` |
| Sign Up | `/signup` |
| Supplier List | `/suppliers` |
| Supplier Detail | `/suppliers/[id]` |
| Supplier New | `/suppliers/new` |
| Contract New | `/contracts/new` |
| Contract Detail | `/contracts/[id]` |
| Contract Edit | `/contracts/[id]/edit` |

#### Sprint 1 At-Risk Items
1. PDF upload → defer to Sprint 2, ship text-only contract
2. Google OAuth → email/password only is sufficient for MVP

---

### Sprint 2 — Contract Visibility (Raj → Vineela handoff)
**Duration:** April 4 — April 12
**Raj owns:** Contract list/search/filter, basic dashboard, `lib/risk.ts` with tests
**Vineela owns:** Traffic-light dashboard UI, in-app notifications

**Handoff condition:** Raj merges `feature/[n]-risk-lib` with all `lib/risk.ts` tests passing. Vineela picks up the UI layer. No API work needed from Vineela in Sprint 2 — all endpoints already exist.

#### Screens added in Sprint 2

| Screen | Route | Owner |
|---|---|---|
| Contract List | `/contracts` | Raj |
| Dashboard (basic) | `/dashboard` | Raj |
| Dashboard (traffic-light) | `/dashboard` | Vineela |
| Notifications | `/notifications` | Vineela |

#### Sprint 2 At-Risk Items
1. Pagination → cap list at 100
2. Supplier filter dropdown → ship status filter only

---

### Sprint 3 — Alerts, Spend & Compliance (Vineela)
**Duration:** April 13 — April 17
**Owner:** Vineela
**Goal:** Email alerts, spend tracking, compliance tracking, member invitation, final QA and deploy.

#### Screens added in Sprint 3

| Screen | Route |
|---|---|
| Spend | `/spend` |
| Compliance | `/compliance` |
| Certification Add | `/suppliers/[id]/certifications/new` |
| Team Settings | `/settings/team` |

#### Sprint 3 At-Risk Items
1. Email alerts → in-app only if Resend setup delays
2. Spend chart → table only (no Recharts) to save time
3. Member invitation UI → manual Supabase invite as fallback

---

## 11. Sprint Milestones

### Sprint 1 Milestones (Raj)

#### M1.0 — Scaffolding, CI/CD & Monitoring
**Due: March 24 (Day 1)**

| Task | Done When |
|---|---|
| Next.js 14 + Tailwind + shadcn/ui + Framer Motion installed | `npm run dev` starts cleanly |
| Supabase project created, env vars in Vercel | Client connects from app |
| Full DB schema migrated | All tables exist |
| GitHub repo created with branch protection on `main` | PRs required to merge |
| `.github/workflows/ci.yml` — lint + test + build on PR | CI runs and passes on empty test suite |
| `.github/workflows/deploy.yml` — Vercel preview on PR, production on merge | Preview URL generated on first PR |
| Sentry installed (`@sentry/nextjs`) | Test error captured in Sentry dashboard |
| Better Uptime monitor created for production URL | Monitor showing "pending" until first deploy |
| `CLAUDE.md` written with `@import ./docs/PRD.md` | Claude Code reads project context |

---

#### M1.1 — Authentication & Role Gate
**Due: March 26**

| Task | Done When |
|---|---|
| Login page (email/password) | User can sign in; session persists on refresh |
| Signup page | New user created; profiles row with role='admin' |
| Next.js middleware auth gate | Unauthenticated users redirected to /login |
| `lib/auth.ts` — `requireAdmin()` server-side helper | Returns 403 for member session |
| Tests written first (red commit) | `__tests__/api/auth.test.ts` fails before implementation |
| Tests passing (green commit) | All AC-01-x pass |

---

#### M1.2 — Supplier CRUD
**Due: March 28**

| Task | Done When |
|---|---|
| Supplier list, create, detail, edit pages | All supplier operations functional |
| Admin-only soft delete | 403 for Member; status set to 'inactive' for Admin |
| Tests: red commit first | `__tests__/api/suppliers.test.ts` fails before implementation |
| Tests: green + refactor commits | All AC-02-x pass |

---

#### M1.3 — Contract CRUD + PDF Upload
**Due: April 1**

| Task | Done When |
|---|---|
| Contract create form (all required fields) | Contract saved with auto-generated contract_number |
| PDF upload to Supabase Storage (private bucket, signed URL) | pdf_url stored; file accessible via signed URL |
| Contract detail and edit pages | All fields visible and editable |
| Admin-only delete | 403 for Member; Admin deletes successfully |
| Status computation in API response (uses `lib/risk.ts`) | active/expiring/expired returned correctly |
| Zod validation on create/update inputs | Invalid inputs rejected with structured error |
| Tests: red → green → refactor | All AC-03-x pass |

---

#### M1.4 — Sprint 1 Integration, QA & Deploy
**Due: April 3**

| Task | Done When |
|---|---|
| Happy path: Signup → Create Supplier → Create Contract → View Contract | Zero errors |
| Role check confirmed: Member blocked from all delete endpoints | Confirmed by automated tests |
| CI passing on all PRs | No failing checks on main |
| Production deploy live | URL accessible; Sentry active; Better Uptime green |

**Sprint 1 exit check:**
- [ ] Auth works, sessions persist on refresh
- [ ] Supplier CRUD works for both roles (delete blocked for Member)
- [ ] Contract CRUD + PDF upload works
- [ ] Status computed correctly (active/expiring/expired)
- [ ] CI pipeline runs on every PR
- [ ] Production URL live with Sentry + Better Uptime active

---

### Sprint 2 Milestones

#### M2.0 — Contract List, Search & Filter
**Due: April 5**
**Owner: Raj**

| Task | Done When |
|---|---|
| Contract list page with all columns | All contracts rendered |
| Search by name and supplier | Matching contracts only |
| Filter by status, supplier, category | Filter reduces results correctly |
| Sort by renewal date (default) | Soonest renewals first |
| Pagination (20 per page) | Controls visible when > 20 contracts |
| Tests: AC-04-x | All pass |

---

#### M2.1 — Basic Dashboard + Risk Logic
**Due: April 7**
**Owner: Raj**

| Task | Done When |
|---|---|
| `GET /api/dashboard` — counts by status, expiring-soon list, total value | Correct values confirmed by test |
| Basic dashboard page renders counts | Active / expiring / expired + total value visible |
| `lib/risk.ts` — `getContractStatus()` and `getRiskColour()` pure functions | Tests written first; all AC-03-2, AC-03-3, AC-06-1 through AC-06-3 pass |
| **Handoff commit merged** | `feature/[n]-risk-lib` merged to main; Vineela can now build on it |

---

#### M2.2 — Traffic-Light Dashboard UI
**Due: April 9**
**Owner: Vineela**

| Task | Done When |
|---|---|
| Dashboard extended with risk colour per contract | Risk field consumed from API |
| Traffic-light badges rendered (green/amber/red) | Visual indicators visible per contract |
| Portfolio summary bar (count per colour) | Correct counts displayed |
| Contracts sorted red → amber → green | Sort confirmed in test |
| Supplier risk roll-up | Suppliers flagged if any contract is amber/red |
| Tests: AC-06-4, AC-06-5 | Pass |

---

#### M2.3 — In-App Notifications
**Due: April 11**
**Owner: Vineela**

| Task | Done When |
|---|---|
| `lib/alerts.ts` — `shouldSendAlert()` logic | Tests written first; all AC-07-1, AC-07-2 pass |
| Supabase Edge Function cron (daily) | Inserts notification rows at correct thresholds |
| Unique index prevents duplicates | Second cron run creates no new rows |
| `GET /api/notifications` — returns unread only | Confirmed by test |
| `PUT /api/notifications/[id]` — marks as read | is_read flipped; unread count decrements |
| Notification bell in nav with unread count | Badge visible |
| Notifications page | List with contract name and days remaining |
| Tests: AC-07-3, AC-07-4 | Pass |

---

#### M2.4 — Sprint 2 Integration & QA
**Due: April 12**
**Owner: Raj + Vineela**

| Task | Done When |
|---|---|
| Happy path: Login → Contracts List → Dashboard → Notifications | Zero errors |
| Traffic-light colours verified end-to-end | Manual + automated check |
| All Sprint 2 tests passing in CI | No failing checks |

---

### Sprint 3 Milestones (Vineela)

#### M3.0 — Email Renewal Alerts
**Due: April 13**

| Task | Done When |
|---|---|
| Resend configured, env vars set | Test email delivers |
| Edge Function sends email at each threshold | Email received for 60/30/7 day thresholds |
| No duplicate emails (unique index enforces idempotency) | Second cron run sends no second email |
| Tests: AC-08-x | Pass |

---

#### M3.1 — Spend Tracking
**Due: April 14**

| Task | Done When |
|---|---|
| `GET /api/spend` — totals by supplier and category | Correct sums confirmed by test |
| Spend page: supplier breakdown table | All suppliers with totals |
| Category breakdown table | All categories with totals |
| Bar chart (Recharts) — top 10 suppliers | Chart renders with correct data |
| Year filter | Totals correctly scoped |
| Tests: AC-09-x | Pass |

---

#### M3.2 — Compliance & Certification Tracking
**Due: April 15**

| Task | Done When |
|---|---|
| Certification CRUD on supplier profile | Create/edit/delete works |
| Certification status computed (valid/expiring/expired) | Tests pass for all AC-10-x |
| Compliance page — all suppliers with cert summary | Red-flagged suppliers visible |
| Certification document upload | document_url stored |
| Tests: AC-10-x | Pass |

---

#### M3.3 — Member Invitation
**Due: April 16**

| Task | Done When |
|---|---|
| Team settings page (Admin only — 403 for Member) | Member list visible to Admin only |
| `POST /api/team/invite` — Supabase Auth invite | Invite email delivered |
| Invited user completes signup with role='member' | Profile created correctly |
| Admin promote/demote | Role updated in profiles table |
| Tests: AC-11-x | Pass |

---

#### M3.4 — Final QA, Security Audit & Deploy
**Due: April 17**

| Task | Done When |
|---|---|
| Full happy path: Login → Contracts → Dashboard → Notifications → Spend → Compliance | Zero errors |
| Role audit: Member blocked from all Admin endpoints via automated tests | Confirmed |
| OWASP checklist reviewed against codebase | All A01–A09 items verified |
| Lighthouse CI perf gate set to blocking (LCP ≤ 2.5s) | CI blocks failing PRs |
| All Sprint 3 tests passing | No failing tests |
| Sentry and Better Uptime confirmed active on production | Dashboards show green |
| Final production deploy | Production URL live |
| Smoke test: Chrome, Firefox, Safari | No console errors on any screen |

**Sprint 3 exit check (all must pass):**
- [ ] Email alerts delivered at 60/30/7 day thresholds
- [ ] No duplicate in-app or email notifications
- [ ] Spend page shows correct totals and chart
- [ ] Compliance page flags expired/expiring certifications with traffic lights
- [ ] Member invitation flow works end-to-end
- [ ] All role guards confirmed via automated tests
- [ ] CI pipeline: lint + test + build + perf gate all passing
- [ ] Sentry active and capturing errors
- [ ] Better Uptime monitor green
- [ ] Production URL live and smoke-tested across browsers

---

### Milestone Summary Table

| Milestone | Description | Owner | Due Date | Sprint |
|---|---|---|---|---|
| M1.0 | Scaffolding, CI/CD, monitoring | Raj | Mar 24 | 1 |
| M1.1 | Auth + role gate | Raj | Mar 26 | 1 |
| M1.2 | Supplier CRUD | Raj | Mar 28 | 1 |
| M1.3 | Contract CRUD + PDF upload | Raj | Apr 1 | 1 |
| M1.4 | Sprint 1 QA + deploy | Raj | Apr 3 | 1 |
| M2.0 | Contract list, search, filter | Raj | Apr 5 | 2 |
| M2.1 | Basic dashboard + risk lib | Raj | Apr 7 | 2 |
| M2.2 | Traffic-light dashboard UI | Vineela | Apr 9 | 2 |
| M2.3 | In-app notifications | Vineela | Apr 11 | 2 |
| M2.4 | Sprint 2 QA | Both | Apr 12 | 2 |
| M3.0 | Email renewal alerts | Vineela | Apr 13 | 3 |
| M3.1 | Spend tracking | Vineela | Apr 14 | 3 |
| M3.2 | Compliance + certifications | Vineela | Apr 15 | 3 |
| M3.3 | Member invitation | Vineela | Apr 16 | 3 |
| M3.4 | Final QA + security audit + deploy | Both | Apr 17 | 3 |

---

### Cut Priority (if behind schedule)

| Cut Order | What to Cut | Impact | When to Cut |
|---|---|---|---|
| 1 | PDF upload → text fields only | Low | If M1.3 runs > 4 hrs over |
| 2 | Pagination → cap list at 100 | Low | If M2.0 runs over |
| 3 | Email alerts → in-app only | Medium | If M3.0 runs > 4 hrs over |
| 4 | Spend chart → table only | Low | If M3.1 runs over |
| 5 | Cert document upload → metadata only | Low | If M3.2 runs over |
| 6 | Member invitation UI → manual Supabase invite | Medium | If Sprint 3 Day 3 has backlog |

---

## 12. GitHub Issues & TDD Strategy

### GitHub Project Setup

- **Repo:** `contracker`
- **GitHub Projects board:** Three sprints, columns: `Backlog → In Progress → PR Open → Done`
- **Labels:** `sprint-1`, `sprint-2`, `sprint-3`, `tdd`, `enhancement`, `bug`, `admin-only`, `security`
- **Milestones:** Sprint 1 (Apr 3), Sprint 2 (Apr 12), Sprint 3 (Apr 17)

### Issue Structure

Each Functional Requirement maps to one GitHub Issue. Acceptance criteria in each issue are written as **failing test descriptions** before any implementation begins.

**Example Issue: #14 — Risk Colour Computation**

```
Title: [TDD] Implement getRiskColour() in lib/risk.ts

Labels: sprint-2, tdd
Milestone: Sprint 2
Branch: feature/14-risk-colour-logic

Description:
Pure function that returns green/amber/red based on renewal_date
and notice_period_days. No DB dependency.

Acceptance Criteria (write tests FIRST — commit as red):
  AC-06-1: renewal_date > 60 days → 'green'
  AC-06-2: renewal_date within 60 days, outside notice_period → 'amber'
  AC-06-3: renewal_date within notice_period_days → 'red'
  Edge case: renewal_date = exactly today → 'red'
  Edge case: today injected as param → deterministic in tests

TDD Commits Required:
  test: add failing tests for getRiskColour (red)
  feat: implement getRiskColour to pass tests (green)
  refactor: extract diffInDays helper, clean up edge cases
```

### TDD Git Commit Pattern

```
test: add failing tests for [feature]      ← RED — tests fail, no implementation
feat: implement [feature] to pass tests    ← GREEN — all tests pass
refactor: [description of cleanup]         ← REFACTOR — tests still pass, code cleaner
```

Claude Code is instructed in `CLAUDE.md` to never combine test + implementation into a single commit.

### Primary TDD Targets

| File | Function | Why |
|---|---|---|
| `lib/risk.ts` | `getContractStatus()` | Wrong = broken dashboard |
| `lib/risk.ts` | `getRiskColour()` | Wrong = wrong traffic lights |
| `lib/alerts.ts` | `shouldSendAlert()` | Idempotency critical — duplicates are P0 bugs |
| `api/contracts/route.ts` | `POST` handler | Role check + Zod validation |
| `api/contracts/[id]/route.ts` | `DELETE` handler | Admin-only enforcement |

---

## 13. Non-Functional Requirements

### Performance
- LCP: < 2.5 seconds on standard broadband (enforced via Lighthouse CI perf gate)
- Contract list query: < 500ms for up to 500 contracts
- Dashboard query: < 1 second

### Security
- API routes validate session server-side on every request
- Role checks enforced before any DB operation
- Supabase RLS enabled as secondary safety net
- `SUPABASE_SERVICE_ROLE_KEY` never in client bundle
- PDF Storage bucket private; signed URLs with 15-min expiry
- HTTPS enforced by Vercel
- OWASP Top 10 addressed (see Section 9.4)
- Zod input validation on all API routes

### Accessibility
- shadcn/ui components WCAG 2.1 AA compliant (Radix UI)
- Traffic-light indicators include text labels (not colour-only)
- All interactive elements keyboard-navigable

### Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 14. Open Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Handoff within Sprint 2 blocked if M2.1 slips | Medium | High | M2.1 has a hard deadline of Apr 7. If Raj is behind by Apr 6, cut dashboard to counts-only and defer risk lib to start of Vineela's work. |
| Resend email delivery setup delays Sprint 3 | Low | Medium | Fall back to in-app alerts only. Cut order #3 applies. |
| Alert cron fires duplicate notifications due to cron overlap | Medium | Low | Unique index on `(contract_id, threshold_days)` makes duplicates impossible at DB level. |
| Lighthouse perf gate blocks PRs unexpectedly | Low | Low | Gate is warning-only in Sprints 1–2. Becomes blocking in Sprint 3 only. |
| Supabase free tier storage quota hit during demo | Low | Medium | 1GB free tier. Enforce 10MB per PDF limit. Unlikely to hit with seed data. |
| Framer Motion animations degrading performance on dashboard | Medium | Low | Gate via `prefers-reduced-motion`. Strip animations before presentation if needed. |
| Vineela blocked on unfamiliar codebase at start of Sprint 2 | Medium | Medium | Raj writes clear README + CLAUDE.md before handoff. All code follows conventions in CLAUDE.md. |

---

*PRD prepared for Contracker by Raj Laskar and Vineela Goli.*
*All functional requirements traceable to the project proposal.*
*Acceptance criteria double as test specifications — written before implementation per TDD workflow.*
*All CI/CD, monitoring, and security requirements are first-class deliverables, not afterthoughts.*
