-- ============================================================
-- FaciliFlow CR SLA — Line Manager stage
-- Run this in Supabase Dashboard → SQL Editor
--
-- Adds SLA/reminder configuration for the pending_line_manager
-- stage, mirroring the existing manager_sla_hours /
-- manager_reminder_before_minutes columns on change_tenant_config.
--
-- Idempotent — safe to re-run.
-- ============================================================

alter table change_tenant_config
  add column if not exists line_manager_sla_hours numeric,
  add column if not exists line_manager_reminder_before_minutes numeric;

-- Nullable by design — a tenant that leaves this unset simply gets no
-- reminder/escalation while a CR waits at pending_line_manager, same as
-- how any other stage with no SLA configured is skipped by cr-sla-check.
