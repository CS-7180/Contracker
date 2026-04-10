# Contracker — Completion Plan (Phases 5 & 6)

## Context

All Sprint 1–3 features are fully implemented and merged to `main`. PRs #63 (email alerts) and #64 (team settings/invitation) merged on 2026-04-10 with all 8 CI stages green. 211+ Vitest tests passing, 7 Playwright E2E specs covering every feature area, full pipeline with lint/typecheck/test/build/E2E/security/AI-review/Lighthouse.

Two issues remain open: **#26** (Sprint 2 QA sign-off) and **#33** (Final QA + OWASP + deploy). The Documentation phase (Phase 5) and Final QA phase (Phase 6) are the only remaining work.

**Due:** 2026-04-22 (12 days remaining)

---

## What Is Already Done

- Sprint 1: Auth, Supplier CRUD, Contract CRUD + PDF upload
- Sprint 2: Contract list/search/filter, dashboard (traffic-light), in-app notifications
- Sprint 3: Email alerts (Resend), spend tracking (Recharts), compliance/certifications, team settings + member invitation
- Phase 1: 8-stage CI pipeline, security-reviewer + test-writer agents, PR template, hooks
- 23 session logs in `session_logs/`
- All Claude Code Mastery rubric items satisfied per `docs/remaining-work.md`

---

## Phase 4 Close-Out (immediate)

**Goal:** Bring repo state up to date with what's already merged.

### Step 1 — Update `docs/remaining-work.md`
- Mark Phase 4 as ✅ DONE (PRs #63 and #64 merged 2026-04-10)
- Update issue #27 and #32 status to ✅ Closed
- Update "Phase 4 PRs open" text to "Phase 4 complete"

### Step 2 — Add session log
- Create `session_logs/2026-04-10-phase4-complete.md` documenting the PR merges, test count (211), and status

### Step 3 — Commit `docs/phase2-plan.md`
- File is currently untracked; commit it as a historical planning artifact

### Step 4 — PR to close issues #27 and #32
- Branch: `chore/docs-phase4-complete`
- PR body: `Closes #27\nCloses #32`

---

## Phase 5 — README: Mermaid diagram + badges

**File:** `README.md`

1. **CI/deploy badges** — GitHub Actions shields for the `ci.yml` and `deploy.yml` workflows
2. **Mermaid architecture diagram** — `graph TD` covering Browser → Next.js → Supabase (Auth/DB/Storage) → Resend → Sentry, plus the cron route
3. **Production URL** link at the top

**Branch:** `chore/readme-diagram`

---

## Phase 6 — Final QA + Issue #33

**Branch:** `chore/33-final-qa`

### Step 1 — Issue #26 sign-off
- Run `npm test` — verify all tests pass
- Close #26 in the PR body

### Step 2 — Test coverage
- Run: `npm test -- --coverage`
- If ≥ 70% lines, add thresholds to `vitest.config.ts`:
  ```typescript
  thresholds: { lines: 70, functions: 70, branches: 60 }
  ```

### Step 3 — OWASP security audit
- Run `security-reviewer` agent on all modified API routes
- Document findings in `docs/security-audit-final.md`
- Fix any new findings before merging

### Step 4 — Lighthouse CI decision
- Current: all metrics are `warn` (intentional — CI runners are 2–3× slower than real browsers)
- Recommended: keep as warning-only; add clarifying comment to `ci.yml`
- Document decision in the PR

### Step 5 — Production smoke test
- Full happy path: Login → Contracts → Dashboard → Notifications → Spend → Compliance → Team Settings
- Confirm Sentry active, Better Uptime green

### Step 6 — Close issues
- PR body: `Closes #26\nCloses #33`

---

## Phase 7 — External Deliverables (Vineela — manual)

Blog post, video demo (5–10 min), individual reflection (500 words), peer evaluations, and showcase form submission are all handled outside the repo.

---

## Critical Files

| File | Change |
|------|--------|
| `docs/remaining-work.md` | Update Phase 4 to done, close #27/#32 |
| `docs/phase2-plan.md` | Commit as untracked historical artifact |
| `session_logs/2026-04-10-phase4-complete.md` | New session log |
| `README.md` | Add Mermaid diagram + CI badges |
| `vitest.config.ts` | Add coverage thresholds (after running coverage report) |
| `docs/security-audit-final.md` | New — OWASP findings from security-reviewer agent |
| `.github/workflows/ci.yml` | Clarifying comment on Lighthouse decision |

---

## PR Sequence

| Branch | Closes | Purpose |
|--------|--------|---------|
| `chore/docs-phase4-complete` | #27, #32 | Remaining-work update + session log + phase2-plan commit |
| `chore/readme-diagram` | — | Mermaid diagram + CI badges in README |
| `chore/26-sprint2-qa` | #26 | Sprint 2 QA sign-off |
| `chore/33-final-qa` | #33 | Coverage threshold + OWASP audit + smoke test |

---

## Verification

- `npm test` passes all 211+ tests
- `npm test -- --coverage` shows ≥ 70% line coverage
- `npm run type-check` and `npm run lint` both clean
- Manual browser smoke test: all 6 feature areas accessible, no console errors
- CI passes all 8 stages on each PR
- Production URL live, Sentry active, Better Uptime green
