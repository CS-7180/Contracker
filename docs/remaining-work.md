# Remaining Work — Analysis & Plan

**Date:** 2026-04-07
**Due:** 2026-04-22 (15 days remaining)
**Owner:** Vineela Goli (Sprint 3)

---

## Current Branch State

All work is on `main`. Every new feature must branch off `main` as `feature/[issue-number]-short-description`.

---

## What Is Done

### Sprint 1 — Complete ✅
- Auth (login, signup, middleware, `requireAdmin()`)
- Supplier CRUD (list, detail, create, edit, soft-delete)
- Contract CRUD + PDF upload (Supabase Storage, signed URLs)
- CI/CD scaffold (`ci.yml`: lint, test, build; `deploy.yml`: Vercel)
- Sentry error tracking
- DB schema migrated (profiles, suppliers, contracts, certifications, notifications)

### Sprint 2 — Partially Done
| Milestone | Status |
|-----------|--------|
| M2.0 Contract list (search, filter, sort, pagination) | ✅ Done (PR #48) |
| M2.1 Basic dashboard + `lib/risk.ts` + `lib/alerts.ts` | ✅ Done (PRs #49, #50) |
| M2.2 Traffic-light dashboard UI (issues #19, #20, #21) | ❌ Open |
| M2.3 Notifications — alerts.ts, edge fn, API, UI (issues #22–#25) | ❌ Open |
| M2.4 Sprint 2 integration QA (issue #26) | ❌ Open |

### Sprint 3 — Not Started
All issues #27–#33 are open.

---

## Open GitHub Issues

### Sprint 2 Remaining
| # | Title | Labels |
|---|-------|--------|
| 19 | [M2.2] Extend dashboard with traffic-light risk badges per contract | sprint-2, ui |
| 20 | [M2.2] Portfolio summary bar and red→amber→green sort order | sprint-2, ui |
| 21 | [M2.2] Implement supplier risk roll-up | sprint-2, tdd, ui |
| 22 | [M2.3] Implement lib/alerts.ts — shouldSendAlert() logic | sprint-2, tdd |
| 23 | [M2.3] Build Supabase Edge Function cron for daily notification inserts | sprint-2, database |
| 24 | [M2.3] Implement GET /api/notifications and PUT /api/notifications/[id] | sprint-2, tdd, api |
| 25 | [M2.3] Build notification bell nav component and notifications page | sprint-2, ui |
| 26 | [M2.4] Sprint 2 integration QA | sprint-2 |

### Sprint 3
| # | Title | Labels |
|---|-------|--------|
| 27 | [M3.0] Configure Resend and implement email renewal alerts | sprint-3, tdd |
| 28 | [M3.1] Implement GET /api/spend endpoint | sprint-3, tdd, api |
| 29 | [M3.1] Build spend tracking page with Recharts bar chart | sprint-3, ui |
| 30 | [M3.2] Implement certification CRUD with computed status | sprint-3, tdd, api |
| 31 | [M3.2] Build compliance page with supplier certification traffic lights | sprint-3, ui |
| 32 | [M3.3] Build team settings page and member invitation flow | sprint-3, tdd, admin-only, api |
| 33 | [M3.4] Final QA, OWASP security audit, Lighthouse CI gate, and production deploy | sprint-3, security |

---

## Rubric Gap Analysis

### Application Quality — 40 pts

| Gap | Status |
|-----|--------|
| Dashboard: portfolio summary bar (green/amber/red counts) | ❌ |
| Dashboard: contracts sorted red → amber → green | ❌ |
| Dashboard: supplier risk roll-up indicator | ❌ |
| Notifications: in-app bell with unread count | ❌ |
| Notifications: `/api/notifications` GET + PUT (currently stubs returning 501) | ❌ |
| Notifications: Supabase Edge Function cron inserting at 60/30/7 day thresholds | ❌ |
| Spend: `/api/spend` endpoint + page with Recharts bar chart | ❌ |
| Compliance: certification CRUD API + compliance page with traffic lights | ❌ |
| Team settings: member invitation flow (Admin only) | ❌ |

**What the page stubs currently return:**
- `app/(app)/spend/page.tsx` → `ComingSoonPage`
- `app/(app)/compliance/page.tsx` → `ComingSoonPage`
- `app/(app)/settings/team/page.tsx` → `ComingSoonPage`
- `app/(app)/notifications/page.tsx` → mock/hardcoded data
- `app/api/certifications/route.ts` → 501 Not Implemented
- `app/api/notifications/route.ts` → empty array
- `app/api/notifications/[id]/route.ts` → 501
- `app/api/spend/route.ts` → 501
- `app/api/team/route.ts` → 501

---

### Claude Code Mastery — 55 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| CLAUDE.md with @imports | ✅ | @imports all docs/ reference files |
| Auto-memory (session_logs/) | ✅ | 10+ session log files present |
| CLAUDE.md evolution in git history | ✅ | Multiple commits updating CLAUDE.md |
| 2+ custom skills | ✅ | `tdd` (v2) and `chart-guide` |
| Skill iterated v1→v2 | ✅ | `.claude/skills/tdd/SKILL-v1.md` archived |
| 2+ hooks configured | ✅ | 4 hooks: block-no-verify, config-protection, typecheck-on-edit, console-log-warning |
| PreToolUse hook | ✅ | block-no-verify + config-protection |
| PostToolUse quality-enforcement hook | ✅ | typecheck-on-edit runs `tsc --noEmit` on every edit |
| MCP server integrated via `.mcp.json` | ✅ | playwright, supabase, magic (21st.dev) |
| **Custom agents in `.claude/agents/`** | ❌ | Directory does not exist |
| **Parallel worktree development** | ❌ | All development sequential — no `git worktree` in history |
| **Writer/Reviewer + C.L.E.A.R. on PRs** | ❌ | PR bodies do not contain C.L.E.A.R. sections |
| **AI disclosure metadata in PRs** | ❌ | No "% AI-generated" field in PR descriptions |

---

### Testing & TDD — 30 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| TDD red-green-refactor visible in git | ✅ | `test:` commits precede `feat:` commits for risk, alerts, contracts, suppliers, dashboard |
| Unit + integration tests (Vitest) | ✅ | `__tests__/lib/`, `__tests__/api/` |
| E2E tests (Playwright) | ✅ | `e2e/contracts.spec.ts`, `e2e/suppliers.spec.ts`, `e2e/dashboard.spec.ts`, smoke tests |
| 70%+ test coverage | ❓ | No coverage report generated — needs verification |
| TDD for Sprint 3 features | ❌ | Not yet done |

---

### CI/CD & Production — 35 pts

Current `ci.yml` has **3 stages**: `lint`, `test`, `build`. Rubric requires 8.

| Pipeline Stage | Status |
|---------------|--------|
| Lint (ESLint) | ✅ |
| Type check (tsc --noEmit) | ✅ |
| Unit & integration tests (Vitest) | ✅ |
| Build (next build) | ✅ |
| **E2E tests (Playwright)** | ❌ Missing job in ci.yml |
| **Security scan (npm audit)** | ❌ Missing |
| **AI PR review (claude-code-action)** | ❌ Missing |
| **Lighthouse CI perf gate** | ❌ Missing |
| Preview deploy (Vercel) | ✅ (deploy.yml) |
| Production deploy on merge to main | ✅ (deploy.yml) |

**Security gates needed (min 4):**
| Gate | Status |
|------|--------|
| Zod input validation on all API routes | ✅ (in code) |
| OWASP top 10 documented in security.md | ✅ |
| Role checks server-side on all admin routes | ✅ (in code) |
| **Pre-commit secrets detection (Gitleaks)** | ❌ |
| **npm audit in CI** | ❌ |
| **SAST tool or security-focused sub-agent** | ❌ |

---

### Team Process — 25 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| 2 sprints documented (planning + retrospective) | ✅ | session_logs/ has Sprint 1 & 2 logs |
| GitHub Issues with ACs as testable specs | ✅ | All issues have AC lists |
| Branch-per-issue workflow with PR reviews | ✅ | All PRs on feature/* branches |
| 3+ async standups per sprint per partner | ❓ | Not clearly documented in repo |
| C.L.E.A.R. framework in PR reviews | ❌ | PR bodies lack C.L.E.A.R. structure |
| AI disclosure in PRs (% AI-generated, tool used) | ❌ | PR bodies do not include this |
| Peer evaluations | ❌ | Not yet completed |

---

### Documentation & Demo — 15 pts

| Deliverable | Status |
|------------|--------|
| README (basic, functional) | ✅ |
| **Mermaid architecture diagram in README** | ❌ |
| **Blog post published (Medium/dev.to)** | ❌ |
| **Video demo (5–10 min)** | ❌ |
| **Individual reflections (500 words each)** | ❌ |
| Showcase form submission | ❌ |

---

## Implementation Plan

> **Strategy revision (2026-04-07):** Phases 4, 5, and 6 (infrastructure) are moved to the front.
> Rationale: every subsequent feature PR will automatically get the full CI pipeline, the
> C.L.E.A.R. PR template, and access to the agents. Building infrastructure last means the
> first 10+ PRs produce no rubric evidence for those categories.

---

### Phase 1 — Infrastructure: CI/CD + Agents + C.L.E.A.R. (Days 1–2, Apr 7–8)

**Branch: `chore/infrastructure`** — single PR, three areas.

#### 1a. CI/CD Pipeline (`ci.yml` additions)

Add four new jobs to bring the pipeline from 3 stages to 8:

| New Job | What it does | Key config |
|---------|-------------|------------|
| `e2e` | Runs Playwright tests headless after build | depends on `build`; installs browsers via `npx playwright install --with-deps chromium` |
| `security` | `npm audit --audit-level=moderate` + Gitleaks secrets scan | fails PR if high/critical vuln or secret detected |
| `ai-review` | `claude-code-action` — Claude reviews the diff on every PR | triggers on `pull_request`; needs `ANTHROPIC_API_KEY` secret |
| `perf-gate` | Lighthouse CI — LCP ≤ 2500ms, CLS ≤ 0.1 | uses `@lhci/cli`; requires `lighthouserc.js` config file; blocking from Sprint 3 |

Gitleaks runs as a step inside the `security` job using `gitleaks/gitleaks-action@v2`.

**Files changed:**
- `.github/workflows/ci.yml` — add 4 jobs
- `lighthouserc.js` — Lighthouse thresholds config (new file at repo root)

#### 1b. Claude Code Agents (`.claude/agents/`)

Create two agent definition files:

**`security-reviewer.md`**
- Purpose: When invoked, reads all changed API route files in the current PR/branch and checks each against the OWASP top 10 checklist in `docs/security.md`
- Specifically checks: Zod validation present, `supabase.auth.getUser()` called, role check for admin-only routes, no raw SQL string interpolation, no secrets in response bodies
- Output: a bullet-list of pass/fail findings per file

**`test-writer.md`**
- Purpose: Given a target (function name, file path, or issue number), generates the red-commit test file for the TDD cycle
- Reads the relevant ACs from `docs/acceptance-criteria.md` and the function signature from the source file
- Follows the exact test structure and naming conventions from existing `__tests__/` files
- Outputs a ready-to-commit test file — does NOT write the implementation

Both agents are invocable via `Agent` tool in future sessions, providing evidence of agent use in development workflow.

#### 1c. PR Template (`.github/PULL_REQUEST_TEMPLATE.md`)

Every PR opened after this merge auto-populates with:

```markdown
## What & Why
<!-- One sentence: what changed and the issue it closes -->
Closes #

## C.L.E.A.R. Review
- **Context:** <!-- what this PR does and why it matters -->
- **Logic:** <!-- key implementation decisions made -->
- **Edge cases:** <!-- what could go wrong or was explicitly handled -->
- **Assertions:** <!-- what the tests verify (link test file) -->
- **Risks:** <!-- anything that could break in production -->

## AI Disclosure
- **Tool:** Claude Code (claude-sonnet-4-6)
- **% AI-generated:** ~__%
- **Human review:** <!-- what you manually verified or changed -->

## Checklist
- [ ] Tests written before implementation (TDD red commit exists)
- [ ] `npm test` passes locally
- [ ] `npm run type-check` passes
- [ ] No `console.log` left in committed code
- [ ] Zod validation on any new API route inputs
- [ ] Role check on any admin-only route
```

**Closes:** No issues — infrastructure only.
**PR title:** `chore: CI/CD pipeline upgrades, Claude agents, and C.L.E.A.R. PR template`

---

### Phase 2 — Sprint 2 Completion (Days 3–5, Apr 9–11)

Now that infrastructure is in place, all PRs from here forward get full CI + C.L.E.A.R. template + agent access.

Use **parallel worktrees** for both tracks — this also produces the worktree evidence required by the rubric.

**Track A: `feature/19-20-21-dashboard-risk-ui`**
- Dashboard: portfolio summary bar (green/amber/red counts)
- Dashboard: sort contracts red → amber → green
- Supplier list: risk roll-up badge (amber/red if any contract is amber/red)
- Tests: AC-06-4, AC-06-5
- Playwright E2E assertions for sort order and supplier badge
- Use `security-reviewer` agent before opening PR

**Track B: `feature/22-25-notifications`**
- Confirm `shouldSendAlert()` tests pass (lib/alerts.ts exists — verify coverage)
- Implement `GET /api/notifications` (unread only for current user)
- Implement `PUT /api/notifications/[id]` (mark as read)
- Notification bell in sidebar with live unread count
- Notifications page: replace mock data with real API
- Supabase Edge Function OR Next.js API route for daily threshold inserts
- Tests: AC-07-x (TDD red → green using `test-writer` agent for red commit)

**Worktree commands:**
```bash
git worktree add ../contracker-dashboard feature/19-20-21-dashboard-risk-ui
git worktree add ../contracker-notifications feature/22-25-notifications
# develop in parallel, open separate PRs, merge independently
git worktree remove ../contracker-dashboard
git worktree remove ../contracker-notifications
```

**Closes:** Issues #19, #20, #21, #22, #23, #24, #25
**Then:** Issue #26 Sprint 2 QA PR

---

### Phase 3 — Sprint 3: Spend + Certifications (Days 6–8, Apr 12–14)

Use **parallel worktrees** again (second instance of parallel development for rubric evidence).

**Track A: `feature/28-29-spend`**
- TDD: `GET /api/spend` — totals by supplier and category, date filter
- Tests: AC-09-x (red → green; use `test-writer` agent for red commit)
- Spend page: supplier breakdown table + category table
- Recharts bar chart — top 10 suppliers (invoke `/chart-guide` skill)
- Year filter

**Track B: `feature/30-31-certifications`**
- TDD: `POST/GET/PUT/DELETE /api/certifications`
- Certification status computed in app layer (valid/expiring/expired — 30 day window)
- Tests: AC-10-x (red → green)
- Compliance page: all suppliers with cert summary and traffic lights
- Supplier profile: add certification CRUD section
- Use `security-reviewer` agent before opening PR

**Closes:** Issues #28, #29, #30, #31

---

### Phase 4 — Sprint 3: Email Alerts + Team Invitation (Days 9–10, Apr 15–16)

**`feature/27-email-alerts`**
- Resend integration (requires `RESEND_API_KEY` in env)
- Edge Function or API route sends email at 60/30/7 thresholds
- Deduplication via `idx_notifications_unique` (no code guards needed)
- Tests: AC-08-x

**`feature/32-team-invitation`**
- Team settings page (`/settings/team`) — Admin only (403 for Member)
- `GET /api/team` — list org members
- `POST /api/team/invite` — Supabase Auth invite email
- `PUT /api/team/[id]` — promote/demote role
- Tests: AC-11-x

**Closes:** Issues #27, #32

---

### Phase 5 — Documentation (Days 11–13, Apr 17–19)

- **README:** Add Mermaid architecture diagram, deployment badge, test coverage badge
- **Blog post:** Publish on Medium or dev.to — focus on TDD workflow + Claude Code mastery insights
- **Individual reflection:** 500 words on Claude Code workflow insights (per partner)
- **Video demo:** 5–10 min screencast following W14 demo structure

---

### Phase 6 — Final QA + Security Audit (Days 14–15, Apr 20–22)

**Issue #33 — Branch: `chore/final-qa`**
- Full happy-path smoke test: Login → Contracts → Dashboard → Notifications → Spend → Compliance → Team
- Role audit: Member blocked from all Admin endpoints (automated tests confirm)
- OWASP checklist reviewed against live codebase (use `security-reviewer` agent)
- Lighthouse CI perf gate confirmed blocking
- Sentry + Better Uptime confirmed active
- Smoke test: Chrome, Firefox, Safari
- Showcase form submitted

---

## Worktree Command Reference

```bash
# Phase 2 parallel tracks
git worktree add ../contracker-dashboard feature/19-20-21-dashboard-risk-ui
git worktree add ../contracker-notifications feature/22-25-notifications

# Phase 3 parallel tracks
git worktree add ../contracker-spend feature/28-29-spend
git worktree add ../contracker-certifications feature/30-31-certifications

# Clean up after each phase
git worktree remove ../contracker-dashboard
git worktree remove ../contracker-notifications
```

---

## Open Decisions

1. **Notifications Edge Function** — real Supabase Edge Function vs. Next.js API route callable by cron
2. **Email alerts** — depends on `RESEND_API_KEY` being set; fallback is in-app only
3. **Team invitation** — depends on `SUPABASE_SERVICE_ROLE_KEY` for Supabase Auth admin API
4. **C.L.E.A.R. on past PRs** — add comments to recent merged PRs retroactively?
5. **Test coverage threshold** — run `npm test -- --coverage` to verify current % before committing to 70% target

---

## Milestone Summary (Revised)

| Date | Phase | What | Issues |
|------|-------|------|--------|
| Apr 7–8 | **Phase 1** | Infrastructure: CI/CD (8 stages) + agents + PR template | chore |
| Apr 9–11 | Phase 2 | Sprint 2: dashboard risk UI + notifications (parallel worktrees) | #19–#26 |
| Apr 12–14 | Phase 3 | Sprint 3: spend + certifications (parallel worktrees) | #28–#31 |
| Apr 15–16 | Phase 4 | Sprint 3: email alerts + team invitation | #27, #32 |
| Apr 17–19 | Phase 5 | Documentation (README, blog, reflection, video) | — |
| Apr 20–22 | Phase 6 | Final QA, security audit, showcase submission | #33 |
