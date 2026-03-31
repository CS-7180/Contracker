# Session Log: Issue #17 — GET /api/dashboard endpoint

**Date:** 2026-03-30
**Branch:** `feature/17-dashboard-api`
**PR:** https://github.com/CS-7180/Contracker/pull/49

## What was done

Implemented `GET /api/dashboard` (M2.1) following TDD protocol.

### TDD RED
Created `__tests__/api/dashboard.test.ts` with 7 failing tests covering:
- 401 for unauthenticated requests
- Correct status counts (active/expiring/expired) from a known contract set
- `total_value` sums only non-expired contracts
- `expiring_soon` filters correctly (renewal_date within 30 days, not expired)
- `risk_colour` present on each expiring_soon item
- 500 on DB error
- `{ data, error: null }` shape on success

### TDD GREEN
Replaced the 501 stub in `app/api/dashboard/route.ts` with full implementation:
- Authenticates via `supabase.auth.getUser()` → 401 if missing
- Fetches all contracts (id, name, renewal_date, end_date, notice_period_days, value)
- Computes `getContractStatus()` per contract using `lib/risk.ts` with injected `today`
- Buckets counts, sums non-expired values, builds `expiring_soon` list
- Returns `{ data: { active_count, expiring_count, expired_count, total_value, expiring_soon }, error: null }`

### Results
- 7/7 dashboard tests passing
- 145/145 full suite passing (no regressions)

## Key decisions

- `expiring_soon` uses a hardcoded 30-day window per AC-05-2, not `notice_period_days`
- `total_value` treats null contract values as 0
- `today` is instantiated once per request and passed to all pure function calls for consistency
