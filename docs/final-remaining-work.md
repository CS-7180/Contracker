# Final Remaining Work — Post Sprint 3
**Date:** 2026-04-11 (updated)
**Due:** 2026-04-22 by 2:59am (11 days remaining)
**Owner:** Vineela Goli + Raj Laskar
**Source of truth:** rubric in `docs/Project 3_ Production Application with Claude Code Mastery.pdf`

---

## Score Projection (current state)

| Category | Max | Current Estimate | Gap |
|----------|-----|-----------------|-----|
| Application Quality | 40 | 40 | ✅ none |
| Claude Code Mastery | 55 | 55 | ✅ none |
| Testing & TDD | 30 | 30 | ✅ coverage confirmed 86%+ |
| CI/CD & Production | 35 | 35 | ✅ none |
| Team Process | 25 | 19 | ⚠️ standups + peer eval |
| Documentation & Demo | 15 | 0 | ❌ all 4 deliverables missing |
| **Total** | **200** | **179** | **21 pts at risk** |
| Bonus | +10 | 0 | optional |

---

## What Is Fully Done ✅

### Application Quality (40/40)
- Production app deployed at https://contracker-zeta.vercel.app
- 2 roles: Admin (full CRUD + team management) and Member (view + create/edit)
- Real problem: contract renewal tracking, spend intelligence, supplier compliance
- 8 pages live and smoke-tested in Chrome (login, dashboard, contracts, suppliers, notifications, spend, compliance, team settings)
- All 6 Sprint 3 features complete: email alerts, spend API + page, certification CRUD + compliance page, team invitation flow
- Bug fixes merged: notifications read-archive (PR #79), dashboard alerts unread-only (PR #80)

### Claude Code Mastery (55/55)
| Item | Evidence |
|------|----------|
| Comprehensive `CLAUDE.md` with `@imports` | 10 `@import` references to `docs/` files |
| `CLAUDE.md` evolution in git history | Multiple commits updating CLAUDE.md across sprints |
| Auto-memory | `C:\Users\VGoli\.claude\projects\...\memory\` — project, user, feedback, reference entries |
| 2+ custom skills | `.claude/skills/tdd/` (v1 → v2 iteration) + `.claude/skills/chart-guide/` |
| Skill iterated v1 → v2 | `SKILL-v1.md` archived in `.claude/skills/tdd/` |
| 2+ hooks | 4 hooks in `.claude/settings.json`: `block-no-verify` (PreToolUse), `config-protection` (PreToolUse), `typecheck-on-edit` (PostToolUse), `console-log-warning` (PostToolUse) |
| MCP server via `.mcp.json` | 3 servers: playwright, supabase, magic (21st.dev) — `.mcp.json` checked in |
| Custom agents in `.claude/agents/` | `security-reviewer.md`, `test-writer.md` (merged PR #55) |
| Parallel worktree development | Phase 2: `contracker-dashboard` + `contracker-notifications` in parallel — see `session_logs/2026-04-08-phase2-parallel-worktrees.md` |
| Writer/reviewer + C.L.E.A.R. on 2+ PRs | 8+ PRs with C.L.E.A.R. format: #55, #57, #58, #62, #63, #65, #66, #75 |
| AI disclosure metadata | PR template at `.github/PULL_REQUEST_TEMPLATE.md` — `% AI-generated` + tool field on all PRs from #57 onwards |

### Testing & TDD (30/30) ✅
| Item | Status |
|------|--------|
| TDD red-green-refactor for 3+ features visible in git | ✅ `test:` commits precede `feat:` commits throughout — `lib/risk.ts`, `lib/alerts.ts`, all API routes |
| Unit + integration tests (Vitest) | ✅ 245 tests, 18 files, 0 failures |
| E2E tests (Playwright) | ✅ 114 passing, 7 fixme-skipped, 0 failed (CI `workers=1`) |
| Tests verify behavior and edge cases | ✅ AC-01 through AC-11 fully covered |
| **70%+ test coverage** | ✅ **86.32% statements / 84.67% branches / 100% functions** — gate enforced in CI via `npm run test:coverage` (PR #78) |

### CI/CD & Production (35/35)
| Pipeline Stage | Status |
|---------------|--------|
| Lint (ESLint) | ✅ |
| Type check (tsc --noEmit) | ✅ |
| Unit & integration tests + coverage gate (≥70%) | ✅ |
| E2E tests (Playwright) | ✅ |
| Security scan (npm audit + Gitleaks) | ✅ |
| AI PR review (claude-code-action) | ✅ |
| Preview deploy (Vercel) | ✅ |
| Production deploy on merge to `main` | ✅ |
| Security gates (4+) | ✅ Gitleaks + npm audit + Zod validation + OWASP in CLAUDE.md + security-reviewer agent + role checks |
| Sentry configured | ✅ `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` |

### README
- ✅ Mermaid architecture diagram
- ✅ CI badge, Deploy badge, Production badge
- ✅ Live app URL correct (`contracker-zeta.vercel.app`)

### Sprint 3 QA sign-off (PR #76)
- ✅ All 8 CI checks green
- ✅ Sections 1–6 (Chrome) complete — pending: Firefox/Safari + Sentry/Better Uptime manual checks

---

## What Is Still Remaining ❌

### CRITICAL — affects grade directly

#### 1. Blog Post — Technical (Documentation & Demo — required for 11+ pts)
Not published. Rubric requires a technical blog post on Medium, dev.to, or similar covering AI-assisted workflow insights.

**Action:** Write and publish a 600–1000 word post covering:
- What Contracker does and why it was built
- TDD + Claude Code workflow in practice (red-green-refactor with AI)
- One specific insight about AI-assisted development (e.g., parallel worktrees, C.L.E.A.R. pattern)
- Link to the GitHub repo and live app

Submit the URL to the showcase form.

---

#### 2. Video Demo — 5–10 minutes (Documentation & Demo — required for 11+ pts)
Not recorded. Rubric specifies a polished screencast showcasing app + Claude Code workflow following the W14 demo structure.

**Suggested structure (8–10 min):**
1. Problem statement (30s)
2. Live walkthrough: login → dashboard → contracts → spend → compliance → notifications → team settings (4 min)
3. Claude Code workflow: show CLAUDE.md, a TDD commit sequence, a C.L.E.A.R. PR review (3 min)
4. CI/CD pipeline: show GitHub Actions all-green (1 min)
5. Closing (30s)

Submit the URL to the showcase form.

---

#### 3. Individual Reflections — 500 words each (Documentation & Demo — required for 11+ pts)
Not written. One reflection per partner (Vineela + Raj). Must contain specific Claude Code insights.

**Vineela's reflection should cover:**
- Sprint 3 experience: spend, compliance, certifications, email alerts, team invitation
- How Claude Code's TDD workflow (test-writer agent, tdd skill) shaped the implementation
- What worked well, what you'd do differently
- Specific observation about AI-assisted pair programming across a 3-sprint project

---

#### 4. Showcase Form Submission (required deliverable)
Not submitted. Form: https://docs.google.com/forms/d/e/1FAIpQLScT67tnwjhIETSRwADt57TS_THJSeSGf-xrjTV2nm-XvfFELg/viewform?usp=dialog

**Requires:** project name, production URL, thumbnail, video URL, blog URL.
**Must be submitted before Apr 22 2:59am.**

---

#### 5. Peer Evaluations (Team Process — required for 25/25 pts)
Not completed. The rubric explicitly requires peer evaluations and notes they adjust individual grades by ±10%. Complete via whatever channel the professor specified (Canvas, Google Form, or Slack).

---

### MODERATE — verify/strengthen evidence

#### 6. Async Standups Documentation (Team Process)
The rubric requires minimum 3 async standups **per sprint per partner**. Session logs in `session_logs/` document development work but are not formatted as standups. The rubric specifically calls for async standups as team communication artifacts.

**Action:** Add a `docs/standups.md` file (or equivalent) capturing at minimum:
- Sprint 1: 3+ standups per partner (even reconstructed from session log dates)
- Sprint 2: 3+ standups per partner
- Sprint 3: 3+ standups per partner

Format: date, who, what was done, what's next, any blockers.

---

#### 7. Sprint Retrospectives (Team Process)
Sprint planning is documented but retrospective artifacts (what went well / what to improve) are not explicitly present. The rubric says "sprint planning + retrospective each."

**Action:** Add retrospective notes to the existing sprint planning docs or create `docs/sprint-retrospectives.md`.

---

### OPTIONAL — bonus points (up to +10)

| Bonus | Points | Effort |
|-------|--------|--------|
| Property-based testing with `fast-check` | +3 | Medium — add to `lib/risk.test.ts` for `getContractStatus` / `getRiskColour` |
| Mutation testing with Stryker | +3 | Medium — install `@stryker-mutator/vitest-runner`, run on `lib/risk.ts` |
| Agent SDK feature applying W13 patterns | +4 | High — build a small Claude API feature into the app (e.g., AI contract summarizer on the contract detail page) |

---

## Priority Order (by due date)

| Priority | Task | Owner | Deadline |
|----------|------|-------|---------|
| 🔴 1 | Async standups doc (`docs/standups.md`) | Vineela + Raj | Apr 14 |
| 🔴 2 | Sprint retrospectives doc | Vineela + Raj | Apr 14 |
| 🔴 3 | Individual reflections (500 words each) | Vineela + Raj separately | Apr 17 |
| 🔴 4 | Blog post — write + publish | Vineela or Raj | Apr 18 |
| 🔴 5 | Video demo — record + upload | Vineela + Raj | Apr 20 |
| 🔴 6 | Peer evaluations | Both | Apr 21 |
| 🔴 7 | Showcase form submission | Both | Apr 21 (before midnight) |
| 🟡 8 | Bonus: fast-check property tests | Vineela | Apr 19 if time permits |
| 🟡 9 | Bonus: Stryker mutation testing | Raj | Apr 19 if time permits |

---

## Quick Wins (can be done today)

1. **Standups doc** — reconstruct from session log dates (30 min)
2. **Sprint retrospectives** — 3 entries, one per sprint (20 min)

---

## What Does NOT Need to Be Done

- No new features — all Sprint 3 issues (#27–#32) are closed
- No API changes — all routes are implemented and tested
- No additional E2E specs beyond current coverage
- No changes to CI pipeline — all 8 stages passing
- No coverage work — 86%+ confirmed, threshold gate live in CI (PR #78)
- No notification bug work — read-archive (PR #79) and dashboard alerts (PR #80) both merged
