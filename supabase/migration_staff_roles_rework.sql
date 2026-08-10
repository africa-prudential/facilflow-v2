-- ============================================================
-- Staff roles rework: staff/line_manager base roles,
-- resource_team becomes a separate Facility Ops capability flag,
-- restricted to users in the Facilities department.
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_facility_ops boolean NOT NULL DEFAULT false;

-- If an earlier run of this migration already created the old column
-- name, migrate its values across and drop it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_resource_team') THEN
    UPDATE users SET is_facility_ops = true WHERE is_resource_team = true;
    ALTER TABLE users DROP COLUMN is_resource_team;
  END IF;
END $$;

-- Migrate existing resource_team base-role holders: keep their fulfillment
-- capability via the new flag (only meaningful for Facilities dept staff),
-- move their base role to 'staff'.
UPDATE users SET is_facility_ops = (dept = 'Facilities'), role = 'staff' WHERE role = 'resource_team';

-- Rename the remaining two base roles.
UPDATE users SET role = 'staff' WHERE role = 'employee';
UPDATE users SET role = 'line_manager' WHERE role = 'manager';
