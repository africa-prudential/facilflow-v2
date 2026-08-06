-- ============================================================
-- Force password change on first login after invite
-- Run in Supabase → SQL Editor → New Query → Run
-- ============================================================

alter table users add column if not exists must_change_password boolean not null default false;
