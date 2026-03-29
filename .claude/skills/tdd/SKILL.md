---
name: tdd
description: Automate the RED-GREEN-REFACTOR TDD cycle for Contracker pure functions and API routes. Enforces separate commits for tests vs implementation per CLAUDE.md protocol.
version: 2
user_invocable: true
---

# /tdd — Test-Driven Development Workflow (v2)

You are a TDD disciplinarian for the Contracker project. When the user runs `/tdd [target]`, execute the full RED → GREEN → REFACTOR cycle following the strict protocol in CLAUDE.md.

## Target Resolution

- **Function name** (e.g., `getContractStatus`) → find in `lib/`, test file in `__tests__/lib/`
- **File path** (e.g., `lib/risk.ts`) → use that file, find its matching test file
- **API route** (e.g., `POST /api/contracts`) → find in `app/api/`, test in `__tests__/api/`
- **Issue number** (e.g., `#16`) → read the issue via `gh issue view`, identify TDD targets from ACs

Always READ both the target implementation file AND the test file before starting.

## Pre-flight Checks (NEW in v2)

Before writing any tests, verify these CLAUDE.md gotchas apply to your target:

| Check | Applies If | Rule |
|-------|-----------|------|
| Status computed, not stored | Target reads/writes `status` or `risk_colour` | Never filter by status in SQL; compute in app layer |
| Date injection required | Function computes from current date | Must accept `today: Date = new Date()` as last param |
| Use `diffInDays()` helper | Any date arithmetic | Import from `lib/risk.ts`, never raw millisecond math |
| Response shape | API route handler | Always `{ data: T, error: null }` or `{ data: null, error: {...} }` |
| Zod validation | API POST/PUT handler | Validate ALL inputs before touching the database |
| Auth check first | Any API route | `supabase.auth.getUser()` before any logic |
| Role check server-side | Admin-only operation | Query `profiles` table, never trust client role |
| Soft delete only | Supplier delete operation | Set `status = 'inactive'`, never hard-delete |
| DATE type (not timestamp) | Date inserts | Use `.toISOString().split('T')[0]` |

## Phase 1: RED — Write Failing Tests

1. Read the existing test file — identify all `.todo()` stubs
2. Replace each `.todo()` stub with a real `it()` test:
   - GIVEN/WHEN/THEN format for clarity
   - **Fixed** `today` date: `const TODAY = new Date('2025-06-15')` for determinism
   - Specific assertions (`expect(...).toBe(...)`)
   - No imports from files that don't exist yet
3. **Add extra edge cases** beyond the stubs (NEW in v2):

   **For date functions:** boundary dates (today, yesterday, tomorrow), exact threshold values
   **For API routes:** unauthenticated request (401), wrong role (403), malformed UUID, missing required fields
   **For pure functions:** zero notice period, same-day start/end/renewal, negative diffInDays result

4. Add imports at top: `import { describe, it, expect } from 'vitest'`
5. Run: `npm test -- --reporter=verbose [test-file-path]`
6. **Confirm ALL tests FAIL** — if any pass, the test is wrong
7. Stage and commit:
   ```bash
   git add [test-file]
   git commit -m "test: add failing tests for [target] (TDD RED)"
   ```

## Phase 2: GREEN — Implement Minimal Code

1. Read the test file — understand exactly what needs to pass
2. Read the implementation stub — check the function signature
3. **Check imports needed** (NEW in v2): If the implementation uses helpers from other `lib/` files, add the import. Common imports:
   - `import { diffInDays } from '@/lib/risk'` — for date math in `alerts.ts`
   - `import { createServerClient } from '@/lib/supabase/server'` — for API routes
4. Implement **minimal** code to make all tests pass:
   - Pure functions: use `diffInDays()` for date math
   - API routes: authenticate → role check → Zod validate → DB query → `{ data, error }`
   - DO NOT over-engineer — write only what the tests require
5. Run: `npm test -- --reporter=verbose [test-file-path]` — confirm ALL pass
6. Run: `npm test` — confirm **full suite** still passes (NEW in v2)
7. Run: `npm run type-check` — fix any TypeScript errors
8. Stage and commit:
   ```bash
   git add [implementation-file]
   git commit -m "feat: implement [target] to pass tests (TDD GREEN)"
   ```

### Key Implementation Patterns
- Pure functions: `today: Date = new Date()` as last optional param
- Date math: `diffInDays(dateA, dateB)` from `lib/risk.ts`
- API routes: always `await supabase.auth.getUser()` first
- Admin-only: query `profiles.role` server-side, never trust client
- Response shape: `{ data: T, error: null }` or `{ data: null, error: { message, code } }`
- Date inserts: `.toISOString().split('T')[0]`
- Zod schemas: define at module top-level, not inline in handler

## Phase 3: REFACTOR — Clean Up (Optional)

1. Review implementation for: repeated logic, unclear names, magic numbers
2. If refactoring is warranted: make changes, re-run full suite, commit with `refactor:` prefix
3. If no refactoring needed, **explicitly state why** (e.g., "Function is 3 lines — no cleanup needed")

## Constraints

- **NEVER** combine test writing + implementation in a single commit
- **NEVER** use `--no-verify` on git commands (hook will block it)
- **NEVER** modify config files (`vitest.config.ts`, `tsconfig.json`, etc.)
- **NEVER** import from a file that doesn't exist yet in the RED phase
- Only test the target file — don't change other unrelated files

## Output Format (v2 — includes commit SHAs and lessons)

```markdown
## TDD Cycle Complete — [target]

| Phase | Commit SHA | Tests | Result |
|-------|-----------|-------|--------|
| RED | `abc1234` — `test: ...` | N failing | ✅ All fail |
| GREEN | `def5678` — `feat: ...` | N passing | ✅ All pass |
| REFACTOR | skipped / `ghi9012` | N passing | ✅ Still pass |

### Full Suite After GREEN
Test Files: N passed | N skipped
Tests: N passed | N todo

### What Was Tested
- [list of test cases written, including extra edge cases added in v2]

### What Was Implemented
- [brief description: function logic, imports added, patterns used]

### Lessons Learned (NEW in v2)
- [anything unexpected discovered during the TDD cycle]
- [any CLAUDE.md gotcha that became relevant]
```

---

## v1 → v2 Changelog

| Change | Why |
|--------|-----|
| Added **Pre-flight Checks** table | v1 skipped CLAUDE.md gotchas; discovered `diffInDays` import was missing from `alerts.ts` only after running tests |
| Added **extra edge cases** guidance in RED | v1 only replaced `.todo()` stubs — real bugs hide in boundary conditions not covered by stubs |
| Added **full suite run** in GREEN verification | v1 only ran the target file — regressions in other files would have been missed |
| Added **import guidance** in GREEN | v1 gave no guidance on cross-`lib/` imports; `alerts.ts` needed `diffInDays` from `risk.ts` |
| Added **commit SHA** to output table | v1 output had no SHAs — needed for session log evidence and grading |
| Added **Lessons Learned** section to output | v1 output was mechanical; v2 captures what the TDD cycle revealed for future reference |
