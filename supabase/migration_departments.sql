-- ============================================================
-- Departments + Module Entitlements
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_departments" ON departments;
CREATE POLICY "tenant_isolation_departments" ON departments
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS department_modules (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  module_key    text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(department_id, module_key)
);
ALTER TABLE department_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_department_modules" ON department_modules;
CREATE POLICY "tenant_isolation_department_modules" ON department_modules
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Seed existing department names (per tenant) so nothing currently displayed breaks,
-- plus the department that prompted this change.
INSERT INTO departments (tenant_id, name)
SELECT t.id, d.name FROM tenants t
CROSS JOIN (VALUES ('Finance'),('HCM'),('IT'),('Operations'),('Legal'),('Facilities'),('Product & Engineering')) AS d(name)
ON CONFLICT (tenant_id, name) DO NOTHING;
