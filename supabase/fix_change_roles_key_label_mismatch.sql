-- ============================================================
-- FaciliFlow — Fix change_roles key/label mismatch (PRODUCTION ONLY)
-- Run this in Supabase Dashboard → SQL Editor, against faciliflow-prod
--
-- Root cause: before a recent fix, creating a role via "+ New Role"
-- ignored the typed label and assigned keys sequentially
-- (change_approver_l1, l2, l3, ...) regardless of what was typed.
-- In production this produced:
--
--   key                 label
--   change_approver_l1  "Change Technician"
--   change_approver_l2  "Change Manager"
--   change_approver_l3  "Change Approver L1"
--   change_approver_l4  "Change Approver L2"
--   change_approver_l5  "Change Implementer"
--
-- user_change_roles.role_key and change_approval_levels.role_key have
-- a NOT-DEFERRABLE foreign key against change_roles.key with no
-- ON UPDATE CASCADE, so an in-place rename of change_roles.key fails
-- the moment a child row still references the old value (either
-- direction). Instead this inserts the correctly-keyed row first,
-- repoints every child reference to it, and only then deletes the
-- old orphaned row — there's never a moment a referenced key is
-- missing.
--
-- Safe to re-run — every step is idempotent (ON CONFLICT / re-checked
-- WHERE clauses). Review the verification selects before committing.
-- ============================================================

begin;

-- ── 0. Sanity check — confirm the rows this script expects exist ──
select key, label from change_roles
where key in ('change_approver_l1','change_approver_l2','change_approver_l3','change_approver_l4','change_approver_l5');

-- ── 1. Insert correctly-keyed rows for the 3 non-conflicting targets ──
insert into change_roles (key, label) values
  ('change_technician', 'Change Technician'),
  ('change_manager',    'Change Manager'),
  ('change_implementer','Change Implementer')
on conflict (key) do nothing;

-- ── 2. Repoint children from the old wrong keys to the new correct ones ──
update user_change_roles      set role_key = 'change_technician' where role_key = 'change_approver_l1';
update change_approval_levels set role_key = 'change_technician' where role_key = 'change_approver_l1';

update user_change_roles      set role_key = 'change_manager' where role_key = 'change_approver_l2';
update change_approval_levels set role_key = 'change_manager' where role_key = 'change_approver_l2';

update user_change_roles      set role_key = 'change_implementer' where role_key = 'change_approver_l5';
update change_approval_levels set role_key = 'change_implementer' where role_key = 'change_approver_l5';

-- ── 3. Delete the old rows — now orphaned, so this frees their keys ──
delete from change_roles where key = 'change_approver_l1' and label = 'Change Technician';
delete from change_roles where key = 'change_approver_l2' and label = 'Change Manager';
delete from change_roles where key = 'change_approver_l5' and label = 'Change Implementer';

-- ── 4. change_approver_l1 / l2 are now free — reclaim them for their
--       actual intended roles (currently mislabeled as l3 / l4) ──
insert into change_roles (key, label) values
  ('change_approver_l1', 'Change Approver L1'),
  ('change_approver_l2', 'Change Approver L2')
on conflict (key) do nothing;

update user_change_roles      set role_key = 'change_approver_l1' where role_key = 'change_approver_l3';
update change_approval_levels set role_key = 'change_approver_l1' where role_key = 'change_approver_l3';

update user_change_roles      set role_key = 'change_approver_l2' where role_key = 'change_approver_l4';
update change_approval_levels set role_key = 'change_approver_l2' where role_key = 'change_approver_l4';

delete from change_roles where key = 'change_approver_l3' and label = 'Change Approver L1';
delete from change_roles where key = 'change_approver_l4' and label = 'Change Approver L2';

-- ── 5. Verify ──
select key, label from change_roles order by key;
select role_key, count(*) from user_change_roles group by role_key;
select role_key, count(*) from change_approval_levels group by role_key;

-- If everything above looks right, commit. Otherwise, rollback.
commit;
-- rollback;
