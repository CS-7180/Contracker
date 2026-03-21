-- ─────────────────────────────────────────
-- CONTRACKER — Initial Schema Migration
-- See docs/database-schema.md for full reference
-- ─────────────────────────────────────────

-- PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'member'
                CHECK (role IN ('admin', 'member', 'super_admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
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

-- CONTRACTS
-- status and risk_colour are NOT stored — computed in lib/risk.ts
CREATE TABLE IF NOT EXISTS contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number     TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL
                        CHECK (type IN ('service', 'purchase', 'lease', 'other')),
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

-- CERTIFICATIONS (per supplier)
-- status is computed from expiry_date in application layer
CREATE TABLE IF NOT EXISTS certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  cert_type       TEXT NOT NULL
                    CHECK (cert_type IN ('ISO', 'NDA', 'insurance', 'other')),
  issued_date     DATE,
  expiry_date     DATE NOT NULL,
  document_url    TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS (in-app renewal alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  threshold_days  INTEGER NOT NULL CHECK (threshold_days IN (60, 30, 7)),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Deduplication index — sole mechanism for preventing duplicate alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique
  ON notifications(contract_id, threshold_days);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_contracts_supplier   ON contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal    ON contracts(renewal_date ASC);
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_certifications_supplier ON certifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, is_read);

-- Auto-create profile on signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
