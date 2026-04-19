-- ─────────────────────────────────────────────────────────────────────────────
-- CONTRACKER — Production Data Cleanup Script
-- Run in: Supabase Studio → SQL Editor (on the production project)
--
-- Prerequisites (do these before running):
--   1. Take an on-demand backup via Studio → Database → Backups.
--   2. Create the new admin account via Studio → Authentication → Users → Add user.
--      Copy the UUID Supabase assigns — you need it for STEP 2 below.
--
-- What this does:
--   • Wipes all user-generated rows: suppliers, contracts, certifications, notifications.
--   • Deletes every auth user EXCEPT your new admin.
--   • Promotes that admin to role = 'admin' in profiles.
--   • Empties the contract-pdfs storage bucket.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — Replace this value with the UUID of the admin you just created.
--          Find it: Studio → Authentication → Users → copy the UUID column.
-- ─────────────────────────────────────────────────────────────────────────────

-- Do NOT run yet. Paste the UUID here first:
-- \set ADMIN_UUID 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Wipe user data and keep only the admin (one transaction).
--          Replace '<YOUR_ADMIN_UUID>' with the real UUID before running.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Truncate leaf tables first (avoids RESTRICT FK errors on suppliers/contracts).
TRUNCATE notifications, certifications, contracts, suppliers;

-- Delete every auth user except the new admin.
-- ON DELETE CASCADE on auth.users → profiles removes their profile rows automatically.
DELETE FROM auth.users
WHERE id <> 'fb8595e6-1bf4-4bbe-8087-165a88fc898e';

-- The trigger assigned 'member' to the new admin because other profiles
-- existed at the time they signed up. Promote them now.
UPDATE profiles
SET role = 'admin'
WHERE id = 'fb8595e6-1bf4-4bbe-8087-165a88fc898e';

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Wipe contract PDFs from storage.
--          Run this as a separate statement after the transaction above commits.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM storage.objects
WHERE bucket_id = 'contract-pdfs';

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — Verify. All counts should be 0 except profiles and users (both 1).
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT count(*) FROM suppliers)                                   AS suppliers,       -- 0
  (SELECT count(*) FROM contracts)                                   AS contracts,       -- 0
  (SELECT count(*) FROM certifications)                              AS certifications,  -- 0
  (SELECT count(*) FROM notifications)                               AS notifications,   -- 0
  (SELECT count(*) FROM profiles)                                    AS profiles,        -- 1
  (SELECT count(*) FROM auth.users)                                  AS users,           -- 1
  (SELECT count(*) FROM storage.objects WHERE bucket_id='contract-pdfs') AS pdfs;       -- 0

-- Should return a single row: role = 'admin'
SELECT id, email, role FROM profiles;
