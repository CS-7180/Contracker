# Sprint Retrospectives

**Project:** Contracker — Contract & Supplier Management Platform
**Team:** Raj Laskar + Vineela Goli

---

## Sprint 1 — Foundation
**Dates:** March 24 – April 3, 2026
**Owner:** Raj Laskar
**Milestones:** M1.0 (scaffolding + CI/CD) → M1.1 (auth) → M1.2 (supplier CRUD) → M1.3 (contract CRUD + PDF) → M1.4 (Sprint 1 QA)
**Closed issues:** #1–#14
**Test count at handoff:** 145 / 145 passing (11 test files)

### What went well

- **One-day scaffolding.** M1.0 was completed on March 24 as planned — Next.js, Tailwind, shadcn/ui, Supabase, Sentry, Better Uptime, and the full GitHub Actions CI/CD pipeline were all live and green on day 1. This gave every subsequent milestone a stable foundation to build on.
- **TDD protocol established from the start.** The `test:` → `feat:` → `refactor:` commit convention was enforced from the first feature (auth). `CLAUDE.md` codified the pattern before any implementation began, so no backsliding occurred later in the project.
- **Full CRUD shipped with role enforcement.** Supplier CRUD (M1.2) and Contract CRUD + PDF upload (M1.3) both shipped with Admin-only delete enforced server-side and Zod validation on all inputs — no placeholder role guards that needed to be replaced later.
- **Handoff in clean state.** The Sprint 1 / Sprint 2 QA session (issue #14) confirmed 0 lint errors, 0 type errors, 145/145 tests, and a passing CI run before any Sprint 2 work began. The production URL was live and accessible.
- **Sprint 2 risk library delivered early.** `lib/risk.ts` (`getContractStatus()` and `getRiskColour()`) and `GET /api/dashboard` were completed in the March 30–31 session alongside Sprint 1 QA (issues #15–#18), meaning Vineela's Sprint 2 handoff had all the API infrastructure she needed ahead of schedule.

### What to improve

- **Sprint 1 and Sprint 2 Raj work collapsed into the same session.** Issues #15–#18 (the contract list, risk library, dashboard API, and basic dashboard — planned for Apr 4–7) were completed on March 30–31, the same days as Sprint 1 QA. This worked well and delivered early, but future sprints could benefit from a clearer boundary between sprint phases to preserve the retrospective structure.
- **UI polish is worth budgeting explicitly.** The initial UI shipped functional and correct; a full UI/UX overhaul of the dashboard (issue #52) followed on March 31. Allocating dedicated polish time within M1.4 rather than as a follow-on would keep the sprint exit criteria tighter.
- **Production URL verification as a checklist item.** `CLAUDE.md` initially referenced `contracker.vercel.app` instead of `contracker-zeta.vercel.app`. Adding a one-line URL smoke test to the sprint exit checklist would catch this class of misconfiguration immediately at deploy time rather than later in QA.

---

## Sprint 2 — Contract Visibility
**Dates:** April 4 – April 12, 2026
**Owner (M2.0–M2.1):** Raj Laskar — contract list/search/filter, basic dashboard, `lib/risk.ts`
**Owner (M2.2–M2.4):** Vineela Goli — traffic-light dashboard UI, in-app notifications, Sprint 2 QA

---

### Sprint 2 — Raj's Portion (M2.0–M2.1)
**Closed issues:** #15, #16, #17, #18
**Handoff commit:** `feature/[n]-risk-lib` merged to `main`

#### What went well

- **Risk library is a clean, well-tested primitive.** `getContractStatus()` and `getRiskColour()` were implemented as pure functions with an injected `today: Date` parameter, making them fully deterministic in tests and reusable anywhere in the app. All AC-03-2, AC-03-3, AC-06-1, AC-06-2, AC-06-3 edge cases were covered before implementation.
- **Dashboard API delivered everything Vineela needed.** `GET /api/dashboard` returned `green_count`, `amber_count`, `red_count`, `expiring_soon` items with `risk_colour`, and `portfolio_value` — Vineela could build the entire traffic-light UI without touching the API layer.
- **Handoff commit was clean.** The risk library branch merged to `main` with CI green and all tests passing, giving Vineela a stable base to branch from with full confidence in the underlying logic.

#### What to improve

- **Sprint 2 Raj work was completed ahead of schedule in the Sprint 1 session.** All four of Raj's Sprint 2 milestones (issues #15–#18) were completed on March 30–31. Delivering early is a positive outcome; going forward, capturing that early delivery in a brief written note at the milestone boundary would make it easier to track velocity and scope changes across the sprint.
- **Handoff documentation benefits from being written at the milestone boundary.** The Sprint 2 → Sprint 3 handoff section in `CLAUDE.md` captured everything Vineela needed to hit the ground running. Writing it at the exact moment Raj merged the risk library — rather than shortly after — would make future handoffs even more seamless by capturing the freshest context at transition time.

---

### Sprint 2 — Vineela's Portion (M2.2–M2.4)
**Closed issues:** #19, #20, #21, #22, #23, #24, #25, #52
**PRs:** #57 (traffic-light dashboard), #58 (notifications), #67 (Sprint 2 QA sign-off)
**Session:** April 8–10, 2026

#### What went well

- **Parallel worktrees enabled simultaneous feature delivery.** Both Sprint 2 tracks (dashboard risk UI and in-app notifications) were developed in separate git worktrees (`contracker-dashboard`, `contracker-notifications`) during the April 8 session. Each track had independent CI runs, no merge conflicts, and both PRs were open and green the same day.
- **Security-reviewer agent caught real issues before merge.** The agent was invoked on both PRs before opening them. Track B findings confirmed the IDOR ownership check in `PUT /api/notifications/[id]` was correct and flagged minor error-message leakage for documentation.
- **Cron deduplication worked exactly as designed.** The `idx_notifications_unique(contract_id, threshold_days)` unique index handled all alert deduplication at the database level with no application-layer guards. The cron route treated Postgres error `23505` as a silent no-op. This design proved correct when live-tested in Sprint 3.
- **Dashboard UI/UX ("Command Center") polished ahead of time.** The issue #52 UI/UX overhaul (aurora background, glass sidebar, AlertsFeedPanel, Framer Motion) was shipped on March 31, giving the Sprint 2 dashboard UI work a high-quality base to extend rather than a blank page.
- **Sprint 2 QA signed off cleanly.** The April 10 QA session (issue #26 / PR #67) confirmed all AC-04 through AC-07 passing with 0 Playwright failures.

#### What to improve

- **Placeholder data in UI components benefits from a removal checklist.** The issue #52 dashboard overhaul added a `MOCK_NOTIFICATIONS` array as a temporary scaffold with a `// Mock notifications (until real API sends them)` comment. When the real notifications API shipped in PR #58, the mock was still in place — a pre-merge step to grep for `MOCK_` or placeholder comments in changed files would make this a non-issue on future PRs.
- **Loading skeletons as standard practice from the start.** The contracts and suppliers list pages were the only pages without RSC `loading.tsx` skeletons, resulting in a brief data-load flash that was addressed in Sprint 3. Establishing shimmer skeletons as a default for every list page at creation time would eliminate this class of follow-up work entirely.

---

## Sprint 3 — Alerts, Spend & Compliance
**Dates:** April 9 – April 11, 2026 (core features), April 11 (QA + bug fixes)
**Owner:** Vineela Goli
**Milestones:** M3.0 (email alerts) → M3.1 (spend tracking) → M3.2 (certifications/compliance) → M3.3 (team invitation) → M3.4 (final QA + security audit)
**Closed issues:** #27, #28, #29, #30, #31, #32, #33, #68, #69
**PRs merged:** #60, #61, #63, #64, #70, #71, #72, #73, #74, #75, #76, #78
**Test count at sign-off:** 252 / 252 passing (219 unit/integration + 7 property-based, later added)

### What went well

- **All four Sprint 3 milestones delivered.** Email alerts (M3.0), spend tracking (M3.1), certifications/compliance (M3.2), and member invitation (M3.3) all shipped with TDD red-green commits, Playwright E2E specs, and CI green before the deadline.
- **TDD coverage was comprehensive.** Every Sprint 3 feature followed the strict `test:` → `feat:` commit sequence. The certifications feature alone produced 19 unit tests covering all AC-10-x variants. The team API produced 29 tests covering AC-11-x plus all 4 Admin-only role checks.
- **Security hardening was applied proactively.** The `security-reviewer` agent was run on all Sprint 3 PRs before opening. Concrete hardening applied across PRs: `escapeHtml()` in email bodies (XSS prevention), `sanitizeEmailHeader()` for injection prevention, UUID param validation in all `[id]` routes, `error.message` replaced with `'Internal server error'` in all 500 responses, cross-field validation for the `period=custom` spend filter.
- **Playwright browser pre-commit checklist followed on every UI feature.** Each Sprint 3 UI page was verified in a live browser using Playwright MCP before the first commit — spend page with live data, compliance page with real certification status badges, team settings with invite form, all 8 pages in the final smoke test on production.
- **DB-level cron deduplication proved idempotent in production.** After fixing the cron scheduling issues, two back-to-back manual triggers confirmed exactly 1 notification row inserted on the first run and 0 on the second — the `idx_notifications_unique` index worked as specified.
- **Sprint 3 QA sign-off was thorough.** Issue #33 walk-through covered: unit test run, Playwright CI (114 passed, 7 fixme-skipped), role audit (all 7 admin-only endpoints), OWASP A01–A09 checklist, Lighthouse CI gate, and Chrome smoke test across all 8 production pages.

### What to improve

- **End-to-end cron integration testing earlier in the cycle.** The renewal alert cron route was fully implemented in PR #63, but three infrastructure issues were discovered during live testing: no `vercel.json` crons entry, a midnight UTC normalization gap in `diffInDays()`, and the anon Supabase client being silently blocked by RLS. Each fix was straightforward once identified. Adding a manual end-to-end cron trigger as a standard step in the M3.0 exit checklist — alongside a note to verify the `vercel.json` entry and confirm the service role key is in scope — would surface all three in one pass rather than across three separate PRs.
- **Placeholder data removal benefits from a consistent pre-merge step.** As noted in Sprint 2, the `MOCK_NOTIFICATIONS` array carried into production from the Sprint 2 dashboard overhaul. Establishing a shared team habit — a grep for `MOCK_`, `TODO`, or hardcoded placeholder values in changed files before opening a PR — would make this a one-time process improvement rather than a recurring catch.
- **Even earlier delivery creates room for more buffer.** Sprint 3 core features (PRs #60, #61, #63, #64) were all merged by April 9–10, ahead of the April 13–17 plan. The extra time was well-used for bug fixes and QA hardening. Formalizing this pattern — plan for a two-day buffer at the end of every sprint specifically for integration testing and follow-up fixes — would make it a repeatable practice rather than a fortunate outcome.
