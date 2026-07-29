-- ============================================================
-- FaciliFlow CR SLA / Reminder / Escalation Migration
-- Run this in Supabase Dashboard → SQL Editor
--
-- Prerequisites (already present in your DB, not in schema.sql):
--   • change_requests, change_approval_levels, change_tenant_config,
--     change_roles, user_change_roles tables
--
-- This migration is idempotent — safe to re-run.
-- ============================================================

-- ── 1. Per-CR stage timing + reminder/escalation markers ──────
alter table change_requests
  add column if not exists stage_entered_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists escalated_at timestamptz;

-- ── 2. Per-approval-level SLA configuration ────────────────────
alter table change_approval_levels
  add column if not exists sla_hours numeric,
  add column if not exists reminder_before_hours numeric;

-- ── 3. Tenant-wide escalation authority + Manager/Implementation SLAs ──
alter table change_tenant_config
  add column if not exists escalation_authority_id uuid references users(id),
  add column if not exists escalation_cc_email text,
  add column if not exists manager_sla_hours numeric,
  add column if not exists manager_reminder_before_hours numeric,
  add column if not exists implementation_sla_hours numeric,
  add column if not exists implementation_reminder_before_hours numeric;

-- SLA/reminder columns are nullable by design — a stage with no SLA
-- configured is simply skipped by the cr-sla-check scheduled function.
