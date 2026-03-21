# Architecture Reference

## Status Computation

Contract status (`active`, `expiring`, `expired`) is **computed, not stored**. Calculated server-side in `lib/risk.ts`:

```typescript
export function getContractStatus(
  endDate: Date,
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): 'active' | 'expiring' | 'expired' {
  if (endDate < today) return 'expired';
  const daysToRenewal = diffInDays(renewalDate, today);
  if (daysToRenewal <= noticePeriodDays) return 'expiring';
  return 'active';
}
```

**Why computed, not stored:** Status changes daily. Computing server-side ensures dashboard and API always show current state without stale data or background jobs.

## Traffic-Light Risk Logic

```typescript
export function getRiskColour(
  renewalDate: Date,
  noticePeriodDays: number,
  today: Date = new Date()
): 'green' | 'amber' | 'red' {
  const daysToRenewal = diffInDays(renewalDate, today);
  if (daysToRenewal <= noticePeriodDays) return 'red';
  if (daysToRenewal <= 60) return 'amber';
  return 'green';
}
```

Rules:
- 🔴 Red: renewal_date ≤ notice_period_days away OR contract expired
- 🟡 Amber: renewal_date within 60 days but outside notice period
- 🟢 Green: renewal_date > 60 days away

## Role-Based Access Control

Two roles: **Admin** (full access) and **Member** (view + create/edit only).

**Server-side enforcement pattern:**

```typescript
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Proceed with deletion...
}
```

**CRITICAL: All destructive operations (DELETE) are Admin-only. Always check role server-side.**

## Alert Deduplication

Alerts fire at thresholds: 60, 30, and 7 days before renewal.

```sql
CREATE UNIQUE INDEX idx_notifications_unique
  ON notifications(contract_id, threshold_days);
```

Supabase Edge Function runs daily, inserts notification rows. Unique index silently prevents duplicates — no code-level guards needed.

## Project Structure

```
app/
├── (auth)/login/page.tsx
│   └── signup/page.tsx
├── (app)/
│   ├── dashboard/page.tsx
│   ├── contracts/page.tsx, new/, [id]/page.tsx, [id]/edit/page.tsx
│   ├── suppliers/page.tsx, new/, [id]/page.tsx
│   ├── compliance/page.tsx
│   ├── spend/page.tsx
│   ├── notifications/page.tsx
│   └── settings/team/page.tsx          # Admin only
├── api/
│   ├── contracts/route.ts              # GET (list), POST (create)
│   ├── contracts/[id]/route.ts         # GET, PUT, DELETE (Admin only)
│   ├── suppliers/route.ts, [id]/route.ts
│   ├── certifications/route.ts
│   ├── notifications/route.ts, [id]/route.ts
│   ├── dashboard/route.ts
│   ├── spend/route.ts
│   └── team/route.ts                   # Admin only
├── layout.tsx
└── middleware.ts                       # Auth gate for all routes

components/
├── ui/                                 # shadcn/ui primitives
├── contracts/, suppliers/, dashboard/, compliance/, shared/

lib/
├── supabase/client.ts, server.ts, middleware.ts
├── risk.ts                             # Pure functions — PRIMARY TDD TARGET
├── alerts.ts                           # Alert threshold logic — PRIMARY TDD TARGET
└── utils.ts

types/database.ts
__tests__/lib/risk.test.ts, alerts.test.ts
__tests__/api/contracts.test.ts, suppliers.test.ts
e2e/contracts.spec.ts
```
