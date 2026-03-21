# API Design Reference

All routes live under `app/api/`. All routes require a valid Supabase session. Role checks are enforced server-side.

## Response Format

```typescript
// Success
{ data: T, error: null }

// Error
{ data: null, error: { message: string, code: string } }
```

## Routes

### Contracts — `app/api/contracts/`

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/contracts` | List contracts with filters + pagination | Member |
| POST | `/api/contracts` | Create contract | Member |
| GET | `/api/contracts/[id]` | Get single contract | Member |
| PUT | `/api/contracts/[id]` | Update contract | Member |
| DELETE | `/api/contracts/[id]` | Delete contract | **Admin** |

**GET /api/contracts query params:**
- `search` — full-text on name + supplier name
- `status` — active | expiring | expired
- `supplier_id` — UUID
- `category` — string
- `type` — service | purchase | lease | other
- `sort` — renewal_date (default) | value | name
- `page` — default 1
- `limit` — default 20, max 100

**POST /api/contracts Zod schema:**
```typescript
{
  name: z.string().min(1),
  supplier_id: z.string().uuid(),
  type: z.enum(['service', 'purchase', 'lease', 'other']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  renewal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notice_period_days: z.number().int().positive(),
  value: z.number().positive().optional(),
  category: z.string().optional(),
}
```

---

### Suppliers — `app/api/suppliers/`

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/suppliers` | List suppliers | Member |
| POST | `/api/suppliers` | Create supplier | Member |
| GET | `/api/suppliers/[id]` | Get supplier + contracts + certs | Member |
| PUT | `/api/suppliers/[id]` | Update supplier | Member |
| DELETE | `/api/suppliers/[id]` | Soft-delete (status = 'inactive') | **Admin** |

---

### Certifications — `app/api/certifications/`

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/certifications?supplier_id=` | List certifications for supplier | Member |
| POST | `/api/certifications` | Create certification | Member |
| PUT | `/api/certifications/[id]` | Update certification | Member |
| DELETE | `/api/certifications/[id]` | Delete certification | **Admin** |

---

### Notifications — `app/api/notifications/`

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/notifications` | List unread notifications for current user | Member |
| PUT | `/api/notifications/[id]` | Mark as read | Member |

---

### Dashboard & Spend

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/dashboard` | Counts by status, expiring-soon list, total value | Member |
| GET | `/api/spend` | Totals by supplier and category | Member |

**GET /api/spend query params:**
- `period` — all (default) | year | custom
- `start` — ISO date (for custom range)
- `end` — ISO date (for custom range)

---

### Team — `app/api/team/` (Admin only)

| Method | Route | Description | Min Role |
|--------|-------|-------------|----------|
| GET | `/api/team` | List org members | **Admin** |
| POST | `/api/team/invite` | Send invite email via Supabase Auth | **Admin** |
| PUT | `/api/team/[id]` | Update member role | **Admin** |
| DELETE | `/api/team/[id]` | Remove member | **Admin** |

---

## Auth Pattern (every route)

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: { message: 'Unauthorized', code: '401' } }, { status: 401 })
  // ...
}
```

## Admin Role Check Pattern (destructive routes)

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'admin') {
  return NextResponse.json({ data: null, error: { message: 'Forbidden', code: '403' } }, { status: 403 })
}
```

## Status Filter Note

**Never filter by `status` in SQL.** `status` is computed. To filter by status:
1. Fetch contracts from DB
2. Compute `getContractStatus()` for each
3. Filter in application layer
