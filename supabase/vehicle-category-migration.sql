-- ============================================================
-- Fleet Management: vehicle category (Status Car / Pool Car)
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category text DEFAULT 'Status Car';
