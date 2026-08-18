-- ============================================================
-- Licences tracking (business permits, certifications, etc.)
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS licences (
  id text PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  issuing_authority text,
  licence_number text,
  expiry_date date,
  attachment_url text,
  notes text,
  last_reminder_milestone integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE licences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_licences" ON licences;

CREATE POLICY "tenant_isolation_licences" ON licences
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
