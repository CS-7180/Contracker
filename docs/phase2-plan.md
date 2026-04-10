# Phase 2 Implementation Plan — Sprint 2 Completion

## Context

Phase 1 (PR #55, branch `chore/infrastructure`) added the full CI pipeline, agents, and PR template. Phase 2 closes the remaining Sprint 2 open issues: dashboard traffic-light UI (#19, #20, #21) and notifications (#22, #23, #24, #25), followed by Sprint 2 QA (#26).

The plan uses parallel worktrees (rubric evidence for worktree development) per the strategy in `docs/remaining-work.md`.

---

## Prerequisite: Merge PR #55

Feature branches must be cut from `main`. Confirm PR #55 is merged before creating worktrees:

```bash
git checkout main && git pull origin main
```

---

## Step 1: Create Parallel Worktrees

```bash
git worktree add ../contracker-dashboard feature/19-20-21-dashboard-risk-ui
git worktree add ../contracker-notifications feature/22-25-notifications
```

Each track develops independently in its own directory, opened as PRs separately.

---

## Track A — Dashboard Risk UI (Issues #19, #20, #21)
**Branch:** `feature/19-20-21-dashboard-risk-ui`  
**Worktree:** `../contracker-dashboard`

### TDD Cycle 1: Dashboard API Risk Counts

**RED commit** — `test: add failing tests for dashboard risk count fields (AC-06-1–3, AC-06-5)`

File: `__tests__/api/dashboard.test.ts` (new)  
Tests to add:
- Response includes `green_count`, `amber_count`, `red_count` fields
- `expiring_soon` items each have `risk_colour` field
- Reference `docs/acceptance-criteria.md` AC-06-1 through AC-06-3

**GREEN commit** — `feat: add green/amber/red counts to dashboard API response`

File: `app/api/dashboard/route.ts`  
Change: Add a `green_count`, `amber_count`, `red_count` counter alongside the existing `active_count` loop (lines 27–59). Call `getRiskColour()` for every non-expired contract and increment the appropriate counter.

Response shape becomes:
```typescript
{
  active_count, expiring_count, expired_count,
  green_count, amber_count, red_count,   // NEW
  total_value, expiring_soon
}
```

### UI: Dashboard Portfolio Summary Bar + Sort

**Commit** — `feat: dashboard portfolio summary bar with risk counts and sorted contracts`

Files to change:
- `app/(app)/dashboard/page.tsx`

Changes:
1. Replace the existing percentage-based `RiskDistributionBar` section (lines ~160–203) with a three-box portfolio summary bar showing `green_count` / `amber_count` / `red_count` with traffic-light colors from `docs/ui-conventions.md` (`#16a34a` / `#d97706` / `#dc2626`).
2. Sort the `expiring_soon` list client-side before rendering:
   ```typescript
   const riskOrder = { red: 0, amber: 1, green: 2 }
   expiring_soon.sort((a, b) => riskOrder[a.risk_colour] - riskOrder[b.risk_colour])
   ```
   Use existing `RiskIndicator` component from `components/ui/RiskIndicator.tsx` for badges.

### TDD Cycle 2: Supplier Risk Roll-Up

**RED commit** — `test: add failing tests for supplier max_contract_risk roll-up (AC-06-4)`

File: `__tests__/api/suppliers.test.ts` (add tests to existing file)  
Tests to add:
- Each supplier in GET response includes `max_contract_risk: 'green' | 'amber' | 'red' | null`
- Supplier with at least one red contract returns `max_contract_risk: 'red'`
- Supplier with no contracts returns `max_contract_risk: null`

**GREEN commit** — `feat: add max_contract_risk to suppliers API response`

File: `app/api/suppliers/route.ts`  
Change: Augment the SELECT to join with contracts:
```typescript
const { data: suppliers } = await supabase
  .from('suppliers')
  .select('*, contracts(renewal_date, notice_period_days, end_date)')
  .eq('status', 'active')
  .order('name')
```
Then compute `max_contract_risk` for each supplier using `getRiskColour()` from `lib/risk.ts`. Strip `contracts` from the response shape, returning only the computed field.

### UI: Supplier Risk Badge

**Commit** — `feat: add supplier risk roll-up badge to suppliers list`

File: `app/(app)/suppliers/page.tsx`  
Change: Add a "Risk" column to the suppliers table using the existing `RiskIndicator` component (`components/ui/RiskIndicator.tsx`). Show nothing (or a dash) if `max_contract_risk` is null or `'green'`; show amber/red badge with text label for amber/red (per accessibility rule in `docs/ui-conventions.md`).

### E2E Tests

**Commit** — `test: add E2E tests for supplier risk badge and dashboard sort order (AC-06-4, AC-06-5)`

Files: `e2e/suppliers.spec.ts` (add), `e2e/dashboard.spec.ts` (add)  
Tests:
- AC-06-4: supplier with known red contract shows red indicator in supplier list
- AC-06-5: dashboard expiring-soon list first item has `data-testid="risk-red"` (add testid to badge)
- Follow `docs/playwright-protocol.md` structure

### Before Opening PR
Run `security-reviewer` agent on the PR (touches `app/api/suppliers/route.ts` and `app/api/dashboard/route.ts`).

---

## Track B — Notifications (Issues #22, #23, #24, #25)
**Branch:** `feature/22-25-notifications`  
**Worktree:** `../contracker-notifications`

### Prerequisite Check
`lib/alerts.ts` `shouldSendAlert()` is already implemented and all 5 tests pass in `__tests__/lib/alerts.test.ts`. No changes needed there.

### TDD Cycle 1: Notifications API

**RED commit** — `test: add failing tests for GET and PUT /api/notifications (AC-07-3, AC-07-4)`

File: `__tests__/api/notifications.test.ts` (new)  
Tests to add:
- GET returns only `is_read = false` notifications for the authenticated user
- GET returns 401 if not authenticated
- PUT `/api/notifications/[id]` sets `is_read = true` and returns 200
- PUT returns 404 if notification doesn't belong to current user
- PUT returns 401 if not authenticated

**GREEN commit** — `feat: implement GET /api/notifications returning unread for current user`

File: `app/api/notifications/route.ts`  
Replace stub with:
```typescript
// Auth → query notifications WHERE user_id = user.id AND is_read = false
// ORDER BY created_at DESC
// Return { data: notifications, error: null }
```

**GREEN commit** — `feat: implement PUT /api/notifications/[id] to mark notification as read`

File: `app/api/notifications/[id]/route.ts`  
Replace 501 stub with:
```typescript
// Auth → fetch notification to verify user_id === user.id → 404 if not found/wrong user
// UPDATE notifications SET is_read = true WHERE id = params.id
// Return { data: null, error: null }
```

### Issue #23: Notification Insertion Route (Cron)

**Commit** — `feat: implement /api/cron/notifications for daily threshold inserts`

File: `app/api/cron/notifications/route.ts` (new)  
Implements the cron logic from `docs/architecture.md`:
- Secured by `Authorization: Bearer <CRON_SECRET>` header check
- Fetches all contracts with future renewal dates
- Calls `shouldSendAlert()` from `lib/alerts.ts` for each of thresholds [60, 30, 7]
- For each match, inserts a notification row — `idx_notifications_unique` handles deduplication silently
- Returns a summary of inserted rows
- Can be triggered by Vercel Cron or manually during dev

**Note:** This replaces the Supabase Edge Function from Issue #23 — a Next.js route is simpler to test and deploy. No Deno/Edge runtime needed.

### UI: Notifications Page (Real Data)

**Commit** — `feat: connect notifications page to real API data`

File: `app/(app)/notifications/page.tsx`  
Changes:
1. Remove `MOCK_NOTIFICATIONS` array
2. Add `useEffect` fetching `GET /api/notifications` on mount
3. Replace local `markAsRead` state mutation with `PUT /api/notifications/[id]` call + refetch
4. Add loading skeleton + error state (brief, per existing UI patterns in codebase)

The `Notification` interface in the page must align with the DB type from `types/database.ts`. Map DB fields (`is_read`, `contract_id`, `threshold_days`, `message`) to the page's display shape.

### UI: Live Bell Unread Count

**Commit** — `feat: live unread count in notification bell from API`

File: `app/(app)/layout.tsx`  
Change: The bell badge (lines ~272–283) currently has a hardcoded indicator. Replace with a lightweight client component that:
- Fetches `GET /api/notifications` on mount
- Displays `data.length` as the unread count (hide badge if 0)
- Refreshes when navigating to/from `/notifications`

### E2E Tests

**Commit** — `test: add E2E tests for notification bell and notifications page (AC-07-3, AC-07-4)`

File: `e2e/notifications.spec.ts` (new)  
Tests (follow `docs/playwright-protocol.md`):
- Unauthenticated redirect: `/notifications` → `/login`
- Authenticated: heading renders, sidebar nav visible, dark theme
- Bell badge visible when unread notifications exist
- Mark-as-read decrements the bell count

### Before Opening PR
Run `security-reviewer` agent (touches `/api/notifications` routes and new `/api/cron/notifications`).

---

## Issue #26: Sprint 2 Integration QA

After both PRs merge to `main`:

1. Run `npm test` — all tests pass
2. Manual happy path: Login → Dashboard (risk counts visible, sorted red→amber→green) → Suppliers (risk badges visible) → Notifications (real data, mark as read works)
3. Open PR `chore/sprint-2-qa` closing issue #26 with C.L.E.A.R. template

---

## Cleanup

```bash
git worktree remove ../contracker-dashboard
git worktree remove ../contracker-notifications
```

---

## Files Modified Summary

### Track A
| File | Change |
|------|--------|
| `app/api/dashboard/route.ts` | Add `green_count`, `amber_count`, `red_count` to response |
| `app/(app)/dashboard/page.tsx` | Portfolio summary bar + red→amber→green sort |
| `app/api/suppliers/route.ts` | Join contracts, compute `max_contract_risk` |
| `app/(app)/suppliers/page.tsx` | Risk roll-up badge column |
| `__tests__/api/dashboard.test.ts` | New — risk count field tests |
| `__tests__/api/suppliers.test.ts` | Add max_contract_risk tests |
| `e2e/dashboard.spec.ts` | Add AC-06-5 sort order test |
| `e2e/suppliers.spec.ts` | Add AC-06-4 risk badge test |

### Track B
| File | Change |
|------|--------|
| `app/api/notifications/route.ts` | Implement GET (replace stub) |
| `app/api/notifications/[id]/route.ts` | Implement PUT (replace stub) |
| `app/api/cron/notifications/route.ts` | New — cron insertion route |
| `app/(app)/notifications/page.tsx` | Replace mock data with real API |
| `app/(app)/layout.tsx` | Live bell unread count |
| `__tests__/api/notifications.test.ts` | New — API route tests |
| `e2e/notifications.spec.ts` | New — E2E tests |

---

## Verification

- `npm test` — all unit/integration tests pass
- `npm run type-check` — no TypeScript errors
- `npm run lint` — no lint errors
- Manual browser test per `docs/playwright-protocol.md`: happy path for dashboard risk sort, supplier badges, notification mark-as-read
- CI passes all 7 stages on each PR
- `security-reviewer` agent run on both PRs before opening
