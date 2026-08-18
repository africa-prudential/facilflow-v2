-- ============================================================
-- Compliance alerts: dedup columns for milestone/cadence reminders
-- Run this in Supabase Dashboard → SQL Editor
--
-- Idempotent — safe to re-run, and safe even if these columns
-- already exist in the live tables.
-- ============================================================

ALTER TABLE vehicle_documents
  ADD COLUMN IF NOT EXISTS last_reminder_milestone integer;

ALTER TABLE it_subscriptions
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz;
