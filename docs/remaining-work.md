# Remaining Work — Analysis & Plan

**Date:** 2026-04-09 (updated Phase 4 complete)
**Due:** 2026-04-22 (13 days remaining)
**Owner:** Vineela Goli (Sprint 3)

---

## Current Branch State

`main` is the integration branch. All new work branches off `main` as `feature/[issue-number]-short-description`.

Phase 3 branches merged: `feature/28-29-spend` (PR #60) and `feature/30-31-certifications` (PR #61) both merged 2026-04-09.

Phase 4 PRs open: `feature/27-email-renewal-alerts` (PR #63) and `feature/32-team-settings-invite` (PR #64) — both awaiting CI + merge.

---

## What Is Done

### Sprint 1 — Complete ✅
- Auth (login, signup, middleware, `requireAdmin()`)
- Supplier CRUD (list, detail, create, edit, soft-delete)
- Contract CRUD + PDF upload (Supabase Storage, signed URLs)
- CI/CD scaffold

### Phase 1 — Infrastructure — Complete ✅ (PR #55, merged 2026-04-08)
- **CI/CD pipeline expanded to 8 stages:** `lint`, `type-check`, `test`, `build`, `e2e`, `security` (npm audit + Gitleaks), `ai-review` (claude-code-action), `perf-gate` (Lighthouse CI)
- **Custom agents** added to `.claude/agents/`: `security-reviewer.md`, `test-writer.md`
- **C.L.E.A.R. PR template** live at `.github/PULL_REQUEST_TEMPLATE.md` (includes C.L.E.A.R. sections + AI disclosure fields)

### Sprint 2 — Complete ✅ (Phase 2 wrapped up 2026-04-09)
| Milestone | Status |
|-----------|--------|
| M2.0 Contract list (search, filter, sort, pagination) | ✅ Merged (PR #48) |
| M2.1 Basic dashboard + `lib/risk.ts` + `lib/alerts.ts` | ✅ Merged (PRs #49, #50) |
| M2.2 Traffic-light dashboard UI (issues #19, #20, #21) | ✅ Merged (PR #57) |
| M2.3 Notifications — API, cron, UI, live bell (issues #22–#25) | ✅ Merged (PR #58) |
| M2.4 Sprint 2 integration QA (issue #26) | ⏳ Open — QA checklist in progress |

---

## Open GitHub Issues

### Sprint 2 (all closed ✅)
Issues #19–#25 closed on merge of PRs #57 and #58. Issue #26 open for QA sign-off.

### Sprint 3
| # | Title | Status |
|---|-------|--------|
| 27 | [M3.0] Configure Resend and implement email renewal alerts | ⏳ PR #63 open |
| 28 | [M3.1] Implement GET /api/spend endpoint | ✅ Closed (PR #60 merged) |
| 29 | [M3.1] Build spend tracking page with Recharts bar chart | ✅ Closed (PR #60 merged) |
| 30 | [M3.2] Implement certification CRUD with computed status | ✅ Closed (PR #61 merged) |
| 31 | [M3.2] Build compliance page with supplier certification traffic lights | ✅ Closed (PR #61 merged) |
| 32 | [M3.3] Build team settings page and member invitation flow | ⏳ PR #64 open |
| 33 | [M3.4] Final QA, OWASP security audit, Lighthouse CI gate, and production deploy | ❌ Open |

---

## Rubric Gap Analysis

### Application Quality — 40 pts

| Gap | Status |
|-----|--------|
| Dashboard: portfolio summary bar (green/amber/red counts) | ✅ PR #57 |
| Dashboard: contracts sorted red → amber → green | ✅ PR #57 |
| Dashboard: supplier risk roll-up indicator | ✅ PR #57 |
| Notifications: in-app bell with live unread count | ✅ PR #58 |
| Notifications: `/api/notifications` GET + PUT implemented | ✅ PR #58 |
| Notifications: cron inserts at 60/30/7 day thresholds | ✅ PR #58 (`/api/cron/notifications`) |
| Spend: `/api/spend` endpoint + page with Recharts bar chart | ✅ Merged (PR #60) |
| Compliance: certification CRUD API + compliance page with traffic lights | ✅ Merged (PR #61) |
| Team settings: member invitation flow (Admin only) | ⏳ PR #64 open |

**Remaining page stubs on `main`:** None — all resolved (stubs were replaced in PRs #60, #61, #64)

*(Team stubs resolved in PR #64 — pending CI + merge)*

---

### Claude Code Mastery — 55 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| CLAUDE.md with @imports | ✅ | @imports all docs/ reference files |
| Auto-memory (session_logs/) | ✅ | 20+ session log files including parallel worktree log |
| CLAUDE.md evolution in git history | ✅ | Multiple commits updating CLAUDE.md |
| 2+ custom skills | ✅ | `tdd` (v2) and `chart-guide` |
| Skill iterated v1→v2 | ✅ | `.claude/skills/tdd/SKILL-v1.md` archived |
| 2+ hooks configured | ✅ | 4 hooks: block-no-verify, config-protection, typecheck-on-edit, console-log-warning |
| PreToolUse hook | ✅ | block-no-verify + config-protection |
| PostToolUse quality-enforcement hook | ✅ | typecheck-on-edit runs `tsc --noEmit` on every edit |
| MCP server integrated via `.mcp.json` | ✅ | playwright, supabase, magic (21st.dev) |
| Custom agents in `.claude/agents/` | ✅ | `security-reviewer.md`, `test-writer.md` (merged PR #55) |
| Parallel worktree development | ✅ | Phase 2: `contracker-dashboard` + `contracker-notifications` — see `session_logs/2026-04-08-phase2-parallel-worktrees.md` |
| Writer/Reviewer + C.L.E.A.R. on PRs | ✅ | PR template live (`.github/PULL_REQUEST_TEMPLATE.md`); applies to all future PRs |
| AI disclosure metadata in PRs | ✅ | PR template includes "% AI-generated" + tool field |

**All Claude Code Mastery rubric items now satisfied.**

---

### Testing & TDD — 30 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| TDD red-green-refactor visible in git | ✅ | `test:` commits precede `feat:` commits throughout |
| Unit + integration tests (Vitest) | ✅ | `__tests__/lib/`, `__tests__/api/` |
| E2E tests (Playwright) | ✅ | contracts, suppliers, dashboard, notifications specs |
| 70%+ test coverage | ❓ | Coverage report not yet generated — verify before Phase 6 |
| TDD for Sprint 3 features | ✅ | All Sprint 3 TDD complete — #28–#31 merged, #27/#32 in PRs #63/#64 |

---

### CI/CD & Production — 35 pts

| Pipeline Stage | Status |
|---------------|--------|
| Lint (ESLint) | ✅ |
| Type check (tsc --noEmit) | ✅ |
| Unit & integration tests (Vitest) | ✅ |
| Build (next build) | ✅ |
| E2E tests (Playwright) | ✅ Added in PR #55 |
| Security scan (npm audit + Gitleaks) | ✅ Added in PR #55 |
| AI PR review (claude-code-action) | ✅ Added in PR #55 |
| Lighthouse CI perf gate | ✅ Added in PR #55 (blocking Sprint 3+) |
| Preview deploy (Vercel) | ✅ deploy.yml |
| Production deploy on merge to main | ✅ deploy.yml |

**All 8 required pipeline stages are in place.**

Security gates:
| Gate | Status |
|------|--------|
| Zod input validation on all API routes | ✅ |
| OWASP top 10 documented in security.md | ✅ |
| Role checks server-side on all admin routes | ✅ |
| Gitleaks secrets detection in CI | ✅ Added in PR #55 |
| npm audit in CI | ✅ Added in PR #55 |
| security-reviewer agent for per-PR OWASP audit | ✅ Added in PR #55 |

---

### Team Process — 25 pts

| Requirement | Status | Notes |
|-------------|--------|-------|
| 2 sprints documented (planning + retrospective) | ✅ | session_logs/ has Sprint 1 & 2 logs |
| GitHub Issues with ACs as testable specs | ✅ | All issues have AC lists |
| Branch-per-issue workflow with PR reviews | ✅ | All PRs on feature/* branches |
| 3+ async standups per sprint per partner | ❓ | Not clearly documented in repo — add to session logs |
| C.L.E.A.R. framework in PR reviews | ✅ | Template live; applies to all PRs from #57 onwards |
| AI disclosure in PRs (% AI-generated, tool used) | ✅ | Template live; applies to all PRs from #57 onwards |
| Peer evaluations | ❌ | Not yet completed |

---

### Documentation & Demo — 15 pts

| Deliverable | Status |
|------------|--------|
| README (basic, functional) | ✅ |
| Mermaid architecture diagram in README | ❌ |
| Blog post published (Medium/dev.to) | ❌ |
| Video demo (5–10 min) | ❌ |
| Individual reflections (500 words each) | ❌ |
| Showcase form submission | ❌ |

---

## Implementation Plan

---

### Phase 2 — Sprint 2 Completion ✅ DONE (Apr 9)

- PR #57 (dashboard risk UI) merged — all CI checks green
- PR #58 (notifications) merged — all CI checks green
- Issues #19–#25 closed
- Issue #26 (Sprint 2 QA) open — checklist pending manual smoke test
- Worktrees pruned from git tracking (disk dirs remain due to Windows permissions)

---

### Phase 3 — Sprint 3: Spend + Certifications ✅ DONE (Apr 9)

- PR #60 (`feature/28-29-spend`) merged — `GET /api/spend`, spend page, Recharts bar chart, E2E spec (issues #28, #29)
- PR #61 (`feature/30-31-certifications`) merged — certification CRUD API + compliance page with traffic lights, E2E spec (issues #30, #31)
- All 174 tests passing (`.env.test` created to fix pre-existing scaffolding failures)
- Security hardening applied: error leakage fixed, UUID param validation, cross-field validation for `period=custom`
- `security-reviewer` agent run on both route files before PRs opened
- Playwright E2E specs: `e2e/spend.spec.ts` and `e2e/compliance.spec.ts`

**Closed:** Issues #28, #29, #30, #31

---

### Phase 4 — Sprint 3: Email Alerts + Team Invitation ⏳ PRs OPEN

**`feature/27-email-renewal-alerts`** → PR #63
- Augmented cron route to send Resend email after each successful `idx_notifications_unique` insert
- Email deduplication via DB unique index (no code guards needed)
- `escapeHtml()` / `sanitizeEmailHeader()` security helpers added
- 8 new unit tests: AC-08-1, AC-08-2, AC-08-3

**`feature/32-team-settings-invite`** → PR #64
- Full team settings UI at `/settings/team` (Admin only — 403 for Member)
- `GET /api/team`, `POST /api/team/invite`, `PUT /api/team/[id]`, `DELETE /api/team/[id]`
- 18 unit tests (AC-11-1, AC-11-3), E2E spec, playwright `team-pages` project registered
- `params.id` UUID validation (security-reviewer A03 finding)
- 211 tests passing

**Closes:** Issues #27, #32 (on merge)

---

### Phase 5 — Documentation (Apr 17–19)

- **README:** Mermaid architecture diagram, deployment badge, test coverage badge
- **Blog post:** Publish on Medium or dev.to — TDD workflow + Claude Code insights
- **Individual reflection:** 500 words per partner on Claude Code workflow
- **Video demo:** 5–10 min screencast (W14 demo structure)

---

### Phase 6 — Final QA + Security Audit (Apr 20–22)

**Branch: `chore/final-qa`** — Issue #33

- Full happy-path smoke test: Login → Contracts → Dashboard → Notifications → Spend → Compliance → Team
- Role audit: Member blocked from all Admin endpoints (automated tests confirm)
- OWASP checklist via `security-reviewer` agent on full codebase
- Generate and verify test coverage report (`npm test -- --coverage`)
- Sentry + Better Uptime confirmed active on production
- Smoke test: Chrome, Firefox, Safari
- Showcase form submitted

---

## Open Decisions

1. **Email alerts vs. in-app only** — depends on `RESEND_API_KEY` being set in Vercel; fall back to in-app only (cut priority #3) if blocked
2. **Team invitation** — requires `SUPABASE_SERVICE_ROLE_KEY` for Supabase Auth admin API; already in Vercel env vars from Sprint 1
3. **Test coverage threshold** — run `npm test -- --coverage` before Phase 6 to verify ≥ 70% before committing to that target
4. **C.L.E.A.R. on past PRs** — PRs #1–#56 predate the template; adding retroactive comments to key PRs (#47, #48, #49) would strengthen Team Process evidence

---

## Milestone Summary

| Date | Phase | What | Issues | Status |
|------|-------|------|--------|--------|
| Apr 7–8 | Phase 1 | Infrastructure: CI/CD (8 stages) + agents + PR template | chore | ✅ Done (PR #55) |
| Apr 8–9 | Phase 2 | Sprint 2: dashboard risk UI + notifications (parallel worktrees) | #19–#26 | ✅ Done (PRs #57, #58 merged) |
| Apr 9 | Phase 3 | Sprint 3: spend + certifications | #28–#31 | ✅ Done (PRs #60, #61 merged) |
| Apr 9 | Phase 4 | Sprint 3: email alerts + team invitation | #27, #32 | ⏳ PRs #63, #64 open |
| Apr 17–19 | Phase 5 | Documentation (README, blog, reflection, video) | — | ❌ Not started |
| Apr 20–22 | Phase 6 | Final QA, security audit, showcase submission | #33 | ❌ Not started |
