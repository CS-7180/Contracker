-- Seed data for local development / demo
-- Run with: npx supabase db reset

-- Note: auth.users rows must be created via Supabase Auth API or Studio
-- This seed assumes two test users have been created:
--   admin@contracker.dev  (admin)
--   member@contracker.dev (member)
-- Replace UUIDs below with actual IDs from your local auth.users

-- Example seed (commented out until real UUIDs available):
/*
INSERT INTO suppliers (id, name, contact_email, category, created_by)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'Acme Corp', 'contact@acme.com', 'IT Services', '<ADMIN_USER_ID>'),
  ('11111111-0000-0000-0000-000000000002', 'BuildRight Ltd', 'info@buildright.com', 'Construction', '<ADMIN_USER_ID>'),
  ('11111111-0000-0000-0000-000000000003', 'SafeGuard Insurance', 'hello@safeguard.com', 'Insurance', '<ADMIN_USER_ID>');

INSERT INTO contracts (contract_number, name, type, supplier_id, start_date, end_date, renewal_date, notice_period_days, value, created_by)
VALUES
  ('CTR-001', 'Cloud Hosting Agreement', 'service', '11111111-0000-0000-0000-000000000001', '2025-01-01', '2026-12-31', '2026-10-01', 30, 48000.00, '<ADMIN_USER_ID>'),
  ('CTR-002', 'Office Renovation', 'purchase', '11111111-0000-0000-0000-000000000002', '2025-03-01', '2025-12-31', '2025-10-01', 60, 120000.00, '<ADMIN_USER_ID>'),
  ('CTR-003', 'Business Insurance Policy', 'other', '11111111-0000-0000-0000-000000000003', '2025-01-01', '2026-01-01', '2025-12-01', 30, 18000.00, '<ADMIN_USER_ID>');
*/
