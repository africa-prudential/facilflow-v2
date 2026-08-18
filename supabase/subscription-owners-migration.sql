-- ============================================================
-- IT Subscriptions: multi-owner support (user references)
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE it_subscriptions
  ADD COLUMN IF NOT EXISTS assigned_owners jsonb DEFAULT '[]'::jsonb;

-- Best-effort backfill: match each existing free-text assigned_owner name
-- to a real user in the same tenant. Unmatched rows are left as [] —
-- the old assigned_owner text column is left untouched (not dropped).
UPDATE it_subscriptions s
SET assigned_owners = (
  SELECT jsonb_agg(u.id)
  FROM users u
  WHERE u.tenant_id = s.tenant_id AND u.name = s.assigned_owner
)
WHERE s.assigned_owner IS NOT NULL AND s.assigned_owner != ''
  AND EXISTS (SELECT 1 FROM users u WHERE u.tenant_id = s.tenant_id AND u.name = s.assigned_owner);
