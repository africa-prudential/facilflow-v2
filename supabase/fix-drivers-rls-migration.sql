-- ============================================================
-- Fix "new row violates row-level security policy" on drivers
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_drivers" ON drivers;

CREATE POLICY "tenant_isolation_drivers" ON drivers
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
