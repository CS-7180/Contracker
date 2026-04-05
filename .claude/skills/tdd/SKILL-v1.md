---
name: tdd
description: Automate the RED-GREEN-REFACTOR TDD cycle for Contracker pure functions and API routes. Enforces separate commits for tests vs implementation per CLAUDE.md protocol.
version: 1
user_invocable: false
archived: true
---

# /tdd — Test-Driven Development Workflow (v1)

> **Archived.** This is the v1 version, preserved for documentation and P3 deliverable evidence.
> Use `SKILL.md` (v2) for all active TDD work.

You are a TDD disciplinarian for the Contracker project. When the user runs `/tdd [target]`, execute the full RED → GREEN → REFACTOR cycle following the strict protocol in CLAUDE.md.

## Target Resolution

- **Function name** (e.g., `getContractStatus`) → find in `lib/`, test file in `__tests__/lib/`
- **File path** (e.g., `lib/risk.ts`) → use that file, find its matching test file
- **API route** (e.g., `POST /api/contracts`) → find in `app/api/`, test in `__tests__/api/`
- **Issue number** (e.g., `#16`) → read the issue via `gh issue view`, identify TDD targets from ACs

Always READ both the target implementation file AND the test file before starting.

## Phase 1: RED — Write Failing Tests

1. Read the existing test file — identify all `.todo()` stubs
2. Replace each `.todo()` stub with a real `it()` test that:
   - Has a clear description (GIVEN/WHEN/THEN format preferred)
   - Uses a **fixed** `today` date for determinism (e.g., `new Date('2025-06-15')`)
   - Makes specific assertions using `expect(...).toBe(...)` or `expect(...).toEqual(...)`
   - Does NOT import anything that doesn't exist yet
3. Add the necessary imports at the top (`import { describe, it, expect } from 'vitest'`)
4. Run: `npm test -- --reporter=verbose [test-file-path]`
5. **Confirm ALL new tests FAIL** — if any pass, the test is not testing the right thing
6. Stage and commit:
   ```bash
   git add [test-file]
   git commit -m "test: add failing tests for [target] (TDD RED)"
   ```

### Rules for Writing Tests
- All date-dependent tests MUST inject a fixed `today` parameter
- Never test implementation details — test observable behaviour only
- Each test must be independent (no shared mutable state)
- Test edge cases from acceptance criteria: boundary values, zero, null-equivalent dates

## Phase 2: GREEN — Implement Minimal Code

1. Read the test file to understand exactly what needs to pass
2. Read the implementation stub to understand the function signature
3. Implement the **minimal** code to make all tests pass:
   - For pure functions: use `diffInDays()` from `lib/risk.ts` for date math
   - For API routes: follow authenticate → role check → Zod validate → DB query → `{ data, error }`
   - DO NOT over-engineer — write only what the tests require
4. Run: `npm test -- --reporter=verbose [test-file-path]`
5. **Confirm ALL tests PASS**
6. Run: `npm run type-check` — fix any TypeScript errors
7. Stage and commit:
   ```bash
   git add [implementation-file]
   git commit -m "feat: implement [target] to pass tests (TDD GREEN)"
   ```

### Key Implementation Patterns
- Pure functions: `today: Date = new Date()` as last optional param
- Date math: use `diffInDays(dateA, dateB)` from `lib/risk.ts`
- API routes: always `await supabase.auth.getUser()` first
- Admin-only: check `profiles.role` server-side, never trust client
- Response shape: `{ data: T, error: null }` or `{ data: null, error: { message, code } }`
- Date inserts: `.toISOString().split('T')[0]`

## Phase 3: REFACTOR — Clean Up (Optional)

1. Review the implementation for:
   - Repeated logic that could be extracted
   - Variable names that could be clearer
   - Magic numbers that should be constants
2. If refactoring is warranted:
   - Make changes, re-run tests to confirm they still pass
   - Commit: `git commit -m "refactor: [description of cleanup]"`
3. If no refactoring is needed, **explicitly state why** (e.g., "Function is 3 lines — no cleanup needed")

## Constraints

- **NEVER** combine test writing + implementation in a single commit
- **NEVER** use `--no-verify` on git commands (hook will block it)
- **NEVER** modify config files (`vitest.config.ts`, `tsconfig.json`, etc.)
- **NEVER** import from a file that doesn't exist yet in the RED phase
- Only test the target file — don't change other files unless fixing a type error

## Output Format

After completing all phases, report:

```markdown
## TDD Cycle Complete — [target]

| Phase | Commit | Tests | Result |
|-------|--------|-------|--------|
| RED | `test: ...` | N failing | ✅ All fail |
| GREEN | `feat: ...` | N passing | ✅ All pass |
| REFACTOR | `refactor: ...` / skipped | N passing | ✅ Still pass |

### What Was Tested
- [list of test cases written]

### What Was Implemented
- [brief description of the implementation]
```
