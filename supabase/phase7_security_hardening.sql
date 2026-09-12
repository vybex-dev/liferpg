-- ============================================================
-- Life RPG — Phase 7: Security hardening (RLS + privileges)
-- Run this in the Supabase SQL Editor after phase6_equip_items.sql.
--
-- WHAT THIS FIXES
-- ----------------------------------------------------------------
-- schema.sql (Phase 1) gave `profiles`, `attributes`, and
-- `user_items` RLS policies that let the ROW-owning user UPDATE or
-- INSERT their own row with NO column restriction. Combined with
-- Supabase's default table grants (ALL PRIVILEGES to `authenticated`
-- on every public table), that means any signed-in user could skip
-- the app entirely and call the PostgREST API directly — e.g.
--
--   PATCH /rest/v1/profiles?id=eq.<their-own-uid>
--   { "level": 99, "current_xp": 999999, "gold": 999999 }
--
-- — and RLS would allow it, because `auth.uid() = id` is true and
-- nothing else was checked. Same story for `attributes` (grind
-- stats to any level) and `user_items` (INSERT any item_id as
-- "owned" without paying gold). On `tasks`, the owner-update policy
-- also allowed flipping `is_completed` back to `false` directly,
-- which would let `complete_task()` be called again on the same
-- task for a second reward.
--
-- The complete_task / purchase_item / equip_item RPCs already do
-- the right thing (SECURITY DEFINER, auth.uid()-scoped, row-locked).
-- This migration closes the *other* door: direct table access that
-- bypassed those RPCs entirely.
--
-- APPROACH
-- ----------------------------------------------------------------
-- 1. profiles / attributes / user_items: the client has no
--    legitimate reason to ever INSERT/UPDATE/DELETE these tables
--    directly (confirmed by auditing the frontend — every mutation
--    to these tables goes through complete_task/purchase_item/
--    equip_item, which run SECURITY DEFINER and therefore bypass
--    RLS and table grants as the function owner). So we REVOKE
--    those privileges from `authenticated` entirely and DROP the
--    policies that used to allow them. SELECT-only remains.
-- 2. tasks: the client legitimately creates/edits/deletes its own
--    tasks (title/category/xp_reward), so we keep RLS row-ownership
--    checks, but use column-level GRANTs to make it impossible for
--    a direct API call to set/insert is_completed, completed_at, or
--    user_id — those columns are only ever written by complete_task
--    (is_completed/completed_at) or by the ownership check itself
--    at insert time (user_id, enforced via the INSERT policy's
--    WITH CHECK, and never client-settable to someone else's uid
--    because the column-level grant plus the WITH CHECK together
--    mean the value must equal auth.uid()).
--
-- SAFE TO RUN: idempotent (DROP POLICY IF EXISTS + CREATE POLICY,
-- REVOKE/GRANT are naturally idempotent). Safe to run once on an
-- existing/production project, and safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- profiles: SELECT-only for authenticated clients.
-- Row is created by the handle_new_user() trigger and mutated only
-- by complete_task()/purchase_item()/equip_item() (all SECURITY
-- DEFINER, all bypass this revoke as the function owner).
-- ------------------------------------------------------------
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;

revoke insert, update, delete on public.profiles from authenticated;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

-- ------------------------------------------------------------
-- attributes: SELECT-only for authenticated clients.
-- Rows are created/updated only inside complete_task().
-- ------------------------------------------------------------
drop policy if exists "Attributes are insertable by owner" on public.attributes;
drop policy if exists "Attributes are updatable by owner" on public.attributes;
drop policy if exists "Attributes are deletable by owner" on public.attributes;

revoke insert, update, delete on public.attributes from authenticated;
revoke all on public.attributes from anon;
grant select on public.attributes to authenticated;

-- ------------------------------------------------------------
-- user_items: SELECT-only for authenticated clients.
-- Rows are created only inside purchase_item(); nothing ever
-- updates or deletes a user_items row today.
-- ------------------------------------------------------------
drop policy if exists "User items are insertable by owner" on public.user_items;

revoke insert, update, delete on public.user_items from authenticated;
revoke all on public.user_items from anon;
grant select on public.user_items to authenticated;

-- ------------------------------------------------------------
-- items: shared read-only catalog. No client writes today; make
-- that explicit instead of relying on "no policy happens to allow
-- it".
-- ------------------------------------------------------------
revoke insert, update, delete on public.items from authenticated;
revoke all on public.items from anon;
grant select on public.items to authenticated;

-- ------------------------------------------------------------
-- tasks: keep normal CRUD for the task's OWN descriptive fields,
-- but make is_completed / completed_at / user_id impossible to
-- set via a direct table write, at the privilege level (not just
-- RLS), regardless of what row-level policy exists.
--
-- Row-ownership policies (auth.uid() = user_id) are left in place
-- for select/insert/update/delete — this section only narrows
-- *which columns* an authenticated client is allowed to write.
-- ------------------------------------------------------------
revoke insert, update on public.tasks from authenticated;

-- INSERT: client may only ever populate these columns. Leaving
-- is_completed/completed_at out of this list means a direct
-- INSERT that tries to set them is rejected outright (column
-- privilege error) rather than silently accepted — a real task
-- always starts not-completed, via the column defaults.
grant insert (user_id, title, category, xp_reward) on public.tasks to authenticated;

-- UPDATE: client may edit its own task's descriptive fields, but
-- can never flip is_completed, set completed_at, or reassign
-- user_id. Those are exclusively written by complete_task(),
-- which runs SECURITY DEFINER and is unaffected by this grant.
grant update (title, category, xp_reward) on public.tasks to authenticated;

-- delete privilege / policy are untouched — deleting your own task
-- is still allowed via the existing "Tasks are deletable by owner"
-- policy from schema.sql.
