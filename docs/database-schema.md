# Database Schema Reference

## Tables

### profiles
Extends `auth.users`. Created automatically on signup via Supabase Auth trigger.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin', 'member', 'super_admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### suppliers
Soft-deleted only (status = 'inactive'). Cannot hard-delete if contracts exist.

```sql
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  category        TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### contracts
`status` and `risk_colour` are NOT stored — always computed in `lib/risk.ts`.

```sql
CREATE TABLE contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number     TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('service', 'purchase', 'lease', 'other')),
  supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  category            TEXT,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  renewal_date        DATE NOT NULL,
  notice_period_days  INTEGER NOT NULL DEFAULT 30,
  value               NUMERIC(15, 2),
  pdf_url             TEXT,
  created_by          UUID NOT NULL REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_date >= start_date),
  CONSTRAINT renewal_before_end CHECK (renewal_date <= end_date)
);
```

### certifications
Cascade-deleted when supplier is deleted. `status` computed from `expiry_date`.

```sql
CREATE TABLE certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  cert_type       TEXT NOT NULL CHECK (cert_type IN ('ISO', 'NDA', 'insurance', 'other')),
  issued_date     DATE,
  expiry_date     DATE NOT NULL,
  document_url    TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications
Unique index on `(contract_id, threshold_days)` is the sole deduplication mechanism.

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  threshold_days  INTEGER NOT NULL CHECK (threshold_days IN (60, 30, 7)),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_notifications_unique
  ON notifications(contract_id, threshold_days);
```

## Indexes

```sql
CREATE INDEX idx_contracts_supplier   ON contracts(supplier_id);
CREATE INDEX idx_contracts_renewal    ON contracts(renewal_date ASC);
CREATE INDEX idx_contracts_created_by ON contracts(created_by);
CREATE INDEX idx_certifications_supplier ON certifications(supplier_id);
CREATE INDEX idx_notifications_user   ON notifications(user_id, is_read);
```

## Entity Relationships

```
profiles (1) ──────── (N) contracts        [created_by]
profiles (1) ──────── (N) suppliers        [created_by]
profiles (1) ──────── (N) notifications    [user_id]
suppliers (1) ─────── (N) contracts        [supplier_id — ON DELETE RESTRICT]
suppliers (1) ─────── (N) certifications   [supplier_id — ON DELETE CASCADE]
contracts (1) ─────── (N) notifications    [contract_id]
```

## Computed Fields (never stored in DB)

| Entity | Field | Computed from | Location |
|--------|-------|---------------|----------|
| contracts | `status` | end_date, renewal_date, notice_period_days | `lib/risk.ts:getContractStatus()` |
| contracts | `risk_colour` | renewal_date, notice_period_days | `lib/risk.ts:getRiskColour()` |
| certifications | `status` | expiry_date | application layer (within 30 days = expiring) |

## Status Rules

### Contract Status
- `expired` — end_date < today
- `expiring` — daysToRenewal ≤ notice_period_days
- `active` — all other cases

### Contract Risk Colour
- `red` — daysToRenewal ≤ notice_period_days
- `amber` — daysToRenewal ≤ 60 (but outside notice period)
- `green` — daysToRenewal > 60

### Certification Status
- `expired` — expiry_date < today
- `expiring` — expiry_date within 30 days
- `valid` — expiry_date > 30 days away
