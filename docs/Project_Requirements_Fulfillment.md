# Project Requirements Fulfillment  
**Course:** CS7180 — Production Application with Claude Code Mastery  
**Due:** Apr 22, 2026 by 2:59am  
**Team:** Vineela Goli + Raj Laskar  
**Production URL:** https://contracker-zeta.vercel.app  
**GitHub Repo:** https://github.com/CS-7180/Contracker  
**Blog Post:** https://medium.com/@vineela.vgoli/contracker-40789a7c71ff  


---

## 1. Functional Requirements

### Production-ready application solving a real problem
Contracker is a full-stack contract and supplier management platform that solves the procurement problem of missed contract renewals, spend blindness, and supplier compliance gaps. The app computes traffic-light risk indicators per contract, surfaces expiring contracts proactively via in-app and email alerts, and provides spend intelligence by supplier and category. Deployed and live at https://contracker-zeta.vercel.app.

### 2+ user roles or distinct feature areas
Two roles are enforced server-side on every API route handler: **Admin** (full CRUD on contracts, suppliers, certifications; team management; all delete operations) and **Member** (view, create, and edit — no delete, no team settings access). Role is stored in `profiles.role` and checked via `supabase.auth.getUser()` + profile lookup on every handler. See `docs/architecture.md` (RBAC section) and `app/api/contracts/[id]/route.ts` for the enforcement pattern.

### Real-world use case
Contracker was conceived as a new idea for CS7180, addressing the contract renewal blind spot faced by procurement teams managing 30+ contracts without a reliable early-warning system. Features include traffic-light risk scoring, automated renewal alerts at 60/30/7-day thresholds, spend intelligence by supplier and category, and supplier certification compliance tracking.

### Deployed and accessible via public URL
Production deployment on Vercel at https://contracker-zeta.vercel.app. CI badge, deploy badge, and production badge are present in `README.md` (lines 5–7). Auto-deploys from `main` via `.github/workflows/deploy.yml`. All 8 pages are live and smoke-tested: login, dashboard, contracts, suppliers, notifications, spend, compliance, and team settings.

---

## 2. Technical Architecture

### Next.js full-stack application (App Router)
Built on Next.js 14 with the App Router, React 18 Server Components, and Tailwind CSS + shadcn/ui. Framer Motion handles dashboard animations; Recharts powers spend visualizations. A Swagger UI API explorer is available at `/api-docs` (`lib/openapi.ts`, `app/api-docs/page.tsx`).

### Database (PostgreSQL via Supabase)
PostgreSQL hosted on Supabase with Row Level Security as a secondary safety net. Schema includes `profiles`, `suppliers`, `contracts`, `certifications`, and `notifications` tables with appropriate indexes. Full schema in `docs/database-schema.md` and `supabase/migrations/`.

### Authentication (Supabase Auth)
Email/password authentication via Supabase Auth. Sessions are validated server-side on every API call. Unauthenticated users are redirected to `/login` by Next.js middleware (`middleware.ts`). Invited members set their password via Supabase's invite email flow.

### Deployed on Vercel with preview deploys
Every PR receives a unique Vercel preview URL via `.github/workflows/deploy.yml`. Merges to `main` auto-deploy to production. One-click rollback is available via the Vercel dashboard.

---

## 3. Claude Code Mastery

### CLAUDE.md & Memory (W10)

**Comprehensive CLAUDE.md with @imports for modular organization**
`CLAUDE.md` (root) uses 10 `@import` directives referencing standalone docs: `docs/architecture.md`, `docs/security.md`, `docs/cicd.md`, `docs/ui-conventions.md`, `docs/PRD.md`, `docs/IMPLEMENTATION.md`, `docs/database-schema.md`, `docs/api-design.md`, `docs/acceptance-criteria.md`, `docs/sprint-plan.md`, and `docs/playwright-protocol.md`.

**Auto-memory usage for persistent project context**
Project auto-memory is stored at `.claude/projects/.../memory/` and indexed in `MEMORY.md`. Entries cover project phase state (`project_phase3.md`), user profile (`user_vineela.md`), and workflow feedback (`feedback_pr_closing_keywords.md`). Memory was used across all sprint sessions to maintain context between conversations without re-stating project state.

**CLAUDE.md evolution across the project (visible in git history)**
`CLAUDE.md` was established at project setup (M1.0, March 24) and updated multiple times — adding the TDD protocol section, the Sprint 2 handoff note, the Playwright protocol `@import`, and the API docs entry as each sprint phase completed. Evolution is visible in `git log -- CLAUDE.md`.

**Project conventions, architecture decisions, and testing strategy documented**
`CLAUDE.md` documents TypeScript conventions, API route patterns (auth → role → Zod → DB → `{data, error}`), naming conventions, the TDD commit protocol (red → green → refactor), key architectural gotchas (status computed not stored, no SQL status filters, DATE type handling), and the full TDD target table. All decisions are elaborated in the `@import`-ed `docs/` files.

---

### Custom Skills (W12)

**2 skills in `.claude/skills/`**
- `.claude/skills/tdd/SKILL.md` — automates the red-green-refactor TDD cycle for pure functions and API routes, enforcing separate commits per phase with Contracker-specific commit prefix rules.
- `.claude/skills/chart-guide/SKILL.md` — guides building Recharts visualizations (bar charts, responsive containers, data formatting) for the spend tracking page.

**Evidence of team usage**
The `/tdd` skill was invoked throughout Sprint 2 and Sprint 3 development of `lib/alerts.ts`, `GET /api/spend`, and certifications CRUD, as documented in `session_logs/2026-04-09-phase3-spend-certifications.md`. The `/chart-guide` skill was used during the Recharts spend chart implementation in the same session log.

**One skill iterated from v1 to v2**
The TDD skill was iterated: `SKILL-v1.md` (archived at `.claude/skills/tdd/SKILL-v1.md`, marked `version: 1, archived: true`) was superseded by `SKILL.md` (v2) after v1 proved too generic — v2 added Contracker-specific commit prefix rules, the `today: Date` injection requirement, and the mandatory browser pre-commit checklist for UI features.

---

### Hooks (W12)

**4 hooks configured in `.claude/settings.json`**
1. **`block-no-verify`** (PreToolUse / Bash) — blocks any `git commit --no-verify` invocation to prevent bypassing the pre-commit hook pipeline. See `.claude/hooks/block-no-verify.sh`.
2. **`config-protection`** (PreToolUse / Edit|Write) — prevents edits to protected config files (`.env*`, `next.config.*`, `supabase/migrations/`) without explicit confirmation. See `.claude/hooks/config-protection.sh`.
3. **`typecheck-on-edit`** (PostToolUse / Edit|Write) — runs `tsc --noEmit` after any file edit to surface TypeScript errors immediately. See `.claude/hooks/typecheck-on-edit.sh`.
4. **`console-log-warning`** (PostToolUse / Edit|Write) — scans edited files for `console.log` statements and warns before committing. See `.claude/hooks/console-log-warning.sh`.

The hooks include both PreToolUse and PostToolUse types, and `typecheck-on-edit` serves as the quality-enforcement hook running on every edit.

---

### MCP Servers (W12)

**3 MCP servers integrated via `.mcp.json`**
1. **Playwright MCP** (`@playwright/mcp@latest`) — used for browser-based UI testing and the mandatory pre-commit browser checklist defined in `docs/playwright-protocol.md`.
2. **Supabase MCP** (`https://mcp.supabase.com/mcp`) — provides direct database query, migration, and schema inspection capabilities during development.
3. **21st.dev Magic MCP** (`@21st-dev/magic@latest`) — used to scaffold complex UI components (data tables, form dialogs, notification panels) as referenced in `docs/ui-conventions.md`.

`.mcp.json` is checked into the repository root. Playwright MCP browser tools were used in every Sprint 3 UI feature session — evidence in `session_logs/2026-04-09-phase3-spend-certifications.md`, `session_logs/2026-04-10-phase4-complete.md`, and `session_logs/2026-04-11-sprint3-qa-signoff.md`.

---

### Agents (W12–W13)

**2 custom sub-agents in `.claude/agents/`**
1. **`security-reviewer`** (`.claude/agents/security-reviewer.md`) — audits all changed API route files in the current branch against an 8-point OWASP checklist (auth, role enforcement, Zod validation, response shape, no raw SQL, secret exposure, file upload safety, pagination clamping). Introduced in PR #55.
2. **`test-writer`** (`.claude/agents/test-writer.md`) — generates the TDD red-commit test file for a target function or API route, producing failing tests before any implementation is written.

The `security-reviewer` agent was invoked before every PR touching `app/api/` throughout Sprints 2 and 3. Agent output (findings table + fix recommendations) is visible in `session_logs/2026-04-09-phase3-spend-certifications.md` and `session_logs/2026-04-10-phase4-complete.md`.

---

### Parallel Development (W12)

Phase 2 development used Git worktrees to build two Sprint 2 features simultaneously: the dashboard traffic-light UI and in-app notifications were developed in parallel worktrees (`contracker-dashboard` and `contracker-notifications`) without blocking each other. The two branches were merged to `main` independently. Full session documented in `session_logs/2026-04-08-phase2-parallel-worktrees.md`.

---

### Writer/Reviewer Pattern + C.L.E.A.R. (W12)

**Writer/reviewer pattern on 8+ PRs**
The pattern (one Claude Code agent writes the implementation, the `security-reviewer` sub-agent independently reviews API changes) was applied on PRs #55, #57, #58, #62, #63, #65, #66, and #75.

**C.L.E.A.R. framework in PR reviews**
C.L.E.A.R. format (Context, Logic, Edge cases, Assertions, Risks) is encoded as required fields in `.github/PULL_REQUEST_TEMPLATE.md` and applied on all PRs from #57 onwards.

**AI disclosure metadata in PRs**
`.github/PULL_REQUEST_TEMPLATE.md` includes a mandatory **AI Disclosure** section with three fields: `Tool` (Claude Code + model version), `% AI-generated` (filled per PR), and `Human review` (what was manually verified). Present on all PRs from #57 onwards.

---

## 4. Test-Driven Development (W11)

### TDD workflow (red-green-refactor) for 3+ features
The `test:` commit prefix convention (enforced in `CLAUDE.md` and the `/tdd` skill) produced 39 `test:` commits that precede their corresponding `feat:` commits in the git history. Key TDD sequences visible in `git log`:
- **`lib/risk.ts`** — `test: add failing tests for getContractStatus/getRiskColour` → `feat: implement risk functions`
- **`GET /api/spend`** — `test: add failing tests for GET /api/spend (AC-09-1, AC-09-2, AC-09-3)` → `feat: implement GET /api/spend (TDD GREEN)`
- **Certifications CRUD** — `test: add failing tests for certifications CRUD (AC-10-1 through AC-10-5)` → `feat: implement certifications CRUD + getCertificationStatus (TDD GREEN)`
- **Email alerts** — `test: add failing cron email tests (AC-08-1, AC-08-2, AC-08-3)` → `feat: augment cron route to send Resend email`
- **Team invite** — `test: add failing team API tests (AC-11-1, AC-11-3)` → `feat: implement GET /api/team, POST /api/team/invite, PUT+DELETE /api/team/[id]`

### Unit + integration tests
252 unit and integration tests across 18 test files using Vitest, covering all acceptance criteria AC-01 through AC-11. Test files in `__tests__/lib/` (risk, alerts) and `__tests__/api/` (contracts, suppliers, certifications, spend, notifications, team, dashboard). All 252 pass with 0 failures. (245 original unit/integration tests + 7 property-based tests added in PR #84.)

### E2E tests (Playwright)
114 Playwright E2E tests across all major pages (dashboard, contracts, suppliers, notifications, spend, compliance, team settings), with 7 `fixme`-skipped stubs for seed-data-dependent scenarios. Tests run in CI with `workers=1` for stability. See `e2e/` directory and `playwright.config.ts`.

### 70%+ test coverage
Coverage gate enforced in CI (`npm run test:coverage`) at ≥70% threshold. Actual coverage: **86.32% statements / 84.67% branches / 100% functions**. Gate implemented in PR #78. `lib/openapi.ts` excluded from measurement via `vitest.config.ts` (PR #81).

---

## 5. CI/CD Pipeline (W14)

All 8 pipeline stages are configured in `.github/workflows/ci.yml` and passing:

| Stage | Implementation |
|-------|---------------|
| Lint (ESLint) | `npm run lint` — Stage 1 |
| Type checking (tsc --noEmit) | `npm run type-check` — Stage 1 |
| Unit & integration tests + coverage gate | `npm run test:coverage` — Stage 2 |
| E2E tests (Playwright) | `npx playwright test` — Stage 4 |
| Security scan — dependency audit | `npm audit --audit-level=critical` — Stage 5 |
| Security scan — secrets detection | Gitleaks CLI v8.21.2 — Stage 5 |
| AI PR review | `anthropics/claude-code-action@beta` — Stage 6 |
| Preview deploy | Vercel via `.github/workflows/deploy.yml` |
| Production deploy on merge to `main` | Vercel via `.github/workflows/deploy.yml` |

### Security gates (4+ implemented)
1. **Secrets detection** — Gitleaks CLI scans the full repository on every PR (`ci.yml:143–146`).
2. **Dependency scanning** — `npm audit --audit-level=critical` on every PR (`ci.yml:136–139`).
3. **Security-focused sub-agent** — `security-reviewer` agent audits all changed API routes against an 8-point OWASP checklist before any PR is opened.
4. **Security Definition of Done** — `.github/PULL_REQUEST_TEMPLATE.md` mandates a security checklist (Zod schema, auth check, admin role check, no secrets in client files) on every PR.
5. **OWASP Top 10 documented** — `docs/security.md` (imported by `CLAUDE.md`) contains an explicit OWASP A01–A09 table mapping each risk to its Contracker mitigation.
6. **Zod input validation** — enforced on all POST/PUT API routes as a code convention in `CLAUDE.md` and verified by the `security-reviewer` agent.

### Sentry error monitoring
Sentry is configured via `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`, capturing all unhandled exceptions in both client and API routes.

---

## 6. Team Process

### Sprint documentation
Three sprints were executed across the project:
- **Sprint 1** (Mar 24 – Apr 3): Raj — auth, supplier CRUD, contract CRUD + PDF upload, CI/CD pipeline setup.
- **Sprint 2** (Apr 4 – Apr 12): Raj and Vineela jointly — Raj owned contract list/search/filter, basic dashboard, and `lib/risk.ts`; Vineela owned the traffic-light dashboard UI and in-app notifications.
- **Sprint 3** (Apr 13 – Apr 17): Vineela — email alerts, spend tracking, compliance/certification tracking, member invitation.

Sprint planning is documented in `docs/sprint-plan.md` and `docs/IMPLEMENTATION.md` (Sections 10–11) with milestone tables, task breakdowns, and cut priorities.

**Sprint retrospectives:**
Full retrospectives for all three sprints are documented in `docs/sprint-retrospectives.md`, covering what went well and what to improve for each sprint phase. Sprint 2 retrospectives are split by owner — Raj's M2.0–M2.1 portion and Vineela's M2.2–M2.4 portion are documented separately with their own issue lists, PRs, and reflections.

### GitHub Issues with acceptance criteria
All Sprint 1–3 features were tracked as GitHub Issues (#1–#32, #52, #55, #57–#81) with acceptance criteria written as testable `AC-XX-N` specifications. ACs map directly to test file assertions in `__tests__/` as documented in `docs/acceptance-criteria.md`.

### Branch-per-issue workflow with PR reviews
Every feature was developed on a dedicated branch following the `feature/[issue-number]-short-description` convention (e.g., `feature/32-team-settings-invite`, `feature/77-coverage-report`). Each branch was merged via a PR with a C.L.E.A.R. review.

### Async standups
Async standup evidence from Vineela and Raj's teams conversation is shown in `docs/Peer Evaluation And Async Standups.docx`.

### Peer evaluations
Peer evaluation evidence from Vineela and Raj's teams conversation is shown in `docs/Peer Evaluation And Async Standups.docx`.

---

## 7. Documentation & Demo

### README
`README.md` contains a Mermaid system architecture diagram (line 15), three status badges (CI, Deploy, Production) at lines 5–7, the live production URL, local setup instructions, and tech stack summary.

### Technical blog post
Published on Medium: https://medium.com/@vineela.vgoli/contracker-40789a7c71ff

### Video demonstration
`[PLACEHOLDER — Insert video URL here: _________________]`
*(5–10 min screencast covering: problem statement, live walkthrough of all 8 pages, Claude Code workflow showing CLAUDE.md + a TDD commit sequence + a C.L.E.A.R. PR review, CI/CD all-green view, and closing.)*

### Showcase form submission
`[PLACEHOLDER — Submit the Google Form before Apr 22 by 2:59am: project name (Contracker), production URL, thumbnail, video URL, blog URL. Form: https://docs.google.com/forms/d/e/1FAIpQLScT67tnwjhIETSRwADt57TS_THJSeSGf-xrjTV2nm-XvfFELg/viewform?usp=dialog]`

---

## 8. Bonus Work

### Property-based testing with fast-check (+3 pts)
Implemented in PR #84 (`feature/82-fast-check-property-tests`). fast-check v4.7.0 installed as a dev dependency. Seven property-based tests (AC-PBT-1 through AC-PBT-7) added in a dedicated `describe` block at the bottom of `__tests__/lib/risk.test.ts`, verifying structural invariants for both `getContractStatus()` and `getRiskColour()` across thousands of randomly generated date/integer combinations.

**Invariants verified:**
- `endDate < today` → always `expired`, regardless of renewalDate or noticePeriodDays
- `endDate ≥ today` AND `daysToRenewal ≤ noticePeriodDays` → always `expiring`
- `endDate ≥ today` AND `daysToRenewal > noticePeriodDays` → always `active`
- `daysToRenewal ≤ noticePeriodDays` → always `red`
- `noticePeriodDays < daysToRenewal ≤ 60` → always `amber`
- `daysToRenewal > 60` AND `noticePeriodDays ≤ 60` → always `green`
- Any valid input → result is always one of `green | amber | red`, never throws

TDD protocol followed: `test:` commit (failing — fast-check not yet installed) → `feat:` commit (install + green) → `refactor:` commit (switch from `fc.date()` to `fc.integer().map()` to eliminate `new Date(NaN)` generation that occurs during fast-check's shrinking phase even with min/max bounds in v4). All 252 tests pass.

### Mutation testing with Stryker (+3 pts)
Implemented in PR #85 (`feature/83-stryker-mutation-testing`). `@stryker-mutator/core` and `@stryker-mutator/vitest-runner` installed. `stryker.config.mjs` scoped to `lib/risk.ts` only, with HTML reporter writing to `reports/mutation/` (gitignored). Stryker is intentionally **not** wired into CI (too slow for every PR — local-only quality check per AC-MUT-6).

**Mutation score: 95.65%** (44 killed, 2 survived, 0 timeouts, 0 errors out of 46 mutants).

**Surviving mutants (equivalent — documented per AC-MUT-4):** Both survivors are `StringLiteral` mutations in `getCertificationStatus()` at `lib/risk.ts:42–43`, replacing `'T00:00:00Z'` with `""`. In JavaScript, `new Date('2026-04-18')` and `new Date('2026-04-18T00:00:00Z')` are identical (both UTC midnight per the ECMAScript spec). These are equivalent mutants — no test can distinguish them because the behavior is identical. Not a coverage gap; the `T00:00:00Z` suffix is a code clarity choice.

---

## Evidence Index

| Item | Location |
|------|----------|
| CLAUDE.md with @imports | `CLAUDE.md` (root) |
| Architecture & security docs | `docs/architecture.md`, `docs/security.md` |
| Auto-memory files | `.claude/projects/.../memory/MEMORY.md` |
| TDD skill v1 (archived) | `.claude/skills/tdd/SKILL-v1.md` |
| TDD skill v2 (current) | `.claude/skills/tdd/SKILL.md` |
| Chart guide skill | `.claude/skills/chart-guide/SKILL.md` |
| Hooks configuration | `.claude/settings.json`, `.claude/hooks/*.sh` |
| MCP server config | `.mcp.json` |
| Security reviewer agent | `.claude/agents/security-reviewer.md` |
| Test writer agent | `.claude/agents/test-writer.md` |
| Parallel worktree session | `session_logs/2026-04-08-phase2-parallel-worktrees.md` |
| PR template (C.L.E.A.R. + AI disclosure) | `.github/PULL_REQUEST_TEMPLATE.md` |
| CI/CD pipeline | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` |
| TDD commit sequence | `git log --oneline` (39 `test:` commits preceding `feat:` commits) |
| Test files | `__tests__/lib/`, `__tests__/api/`, `e2e/` |
| Coverage configuration | `vitest.config.ts` |
| Acceptance criteria map | `docs/acceptance-criteria.md` |
| Sprint plan & milestones | `docs/sprint-plan.md`, `docs/IMPLEMENTATION.md` |
| API design reference | `docs/api-design.md` |
| Database schema | `docs/database-schema.md` |
| Swagger UI / OpenAPI spec | `app/api-docs/page.tsx`, `lib/openapi.ts` |
| Property-based tests (AC-PBT-1–7) | `__tests__/lib/risk.test.ts` (bottom `describe` block, PR #84) |
| Stryker mutation config | `stryker.config.mjs` (PR #85) |
| Mutation score: 95.65% | PR #85 description, 44/46 mutants killed |
| README (Mermaid + badges) | `README.md` |
| Sprint 1–2 session logs | `session_logs/2026-03-*/`, `session_logs/2026-03-31-*/` |
| Sprint 3 session logs | `session_logs/2026-04-09-phase3-spend-certifications.md`, `session_logs/2026-04-10-phase4-complete.md` |
| Sprint 3 QA sign-off | `session_logs/2026-04-11-sprint3-qa-signoff.md` |
