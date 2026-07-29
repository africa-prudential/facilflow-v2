-- ============================================================
-- FaciliFlow CR SLA — switch "reminder before" fields to minutes
-- Run this in Supabase Dashboard → SQL Editor
-- (Run after cr-sla-migration.sql)
--
-- SLA hours columns are unaffected — only the reminder-before
-- columns change unit, from hours to minutes.
-- ============================================================

alter table change_approval_levels
  rename column reminder_before_hours to reminder_before_minutes;

alter table change_tenant_config
  rename column manager_reminder_before_hours to manager_reminder_before_minutes;

alter table change_tenant_config
  rename column implementation_reminder_before_hours to implementation_reminder_before_minutes;
