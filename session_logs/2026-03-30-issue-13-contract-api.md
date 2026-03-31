# Session Log — Issue #13: Complete Contract API

**Date:** 2026-03-30
**Branch:** `feature/13-contract-api`
**PR:** https://github.com/CS-7180/Contracker/pull/47

## What was done

All contract API routes (GET, POST, GET[id], PUT[id], DELETE[id]) were already implemented in
prior sessions. Issue #13 had two outstanding gaps:

1. **DELETE tests** — 3 `it.todo()` stubs in `__tests__/api/contracts.test.ts`
2. **GET /api/contracts** — returned raw DB rows without computed `status` or `risk_colour`

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| `d4487b7` | test (RED→GREEN) | Delete tests for AC-01-3, AC-01-4, 401 — TDD catch-up |
| `ba77102` | test (RED) | Failing test: status/risk_colour missing from GET list response |
| `4ddc682` | feat (GREEN) | Enrich GET /api/contracts with computed status + risk_colour |

## Key decisions

- `requireAdmin` mocked via `vi.fn().mockImplementation((table) => ...)` branching on
  `'profiles'` vs `'contracts'` — necessary because DELETE calls two different tables.
- `(contracts as any[]).map(...)` cast required — Supabase strict generics resolve to `never`
  without an explicit `as any` on the select result (same pattern as existing POST handler).
- Status/risk computation placed in the API layer (not the page) so the Sprint 2 list page
  (issue #15) can consume it directly without re-implementing the logic client-side.

## Test results

25 tests passing, 0 failing. Type-check and lint clean.
