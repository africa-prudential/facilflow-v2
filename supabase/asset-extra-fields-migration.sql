-- ============================================================
-- Asset Registry: brand/model/purchase_cost/warranty_expiry
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run, and safe even if these columns
-- already exist in the live table.
-- ============================================================

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS purchase_cost numeric,
  ADD COLUMN IF NOT EXISTS warranty_expiry date;
```