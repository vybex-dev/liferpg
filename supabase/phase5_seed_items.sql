-- ============================================================
-- Life RPG — Phase 5: Shop seed data
-- Run this in the Supabase SQL Editor after phase3_game_logic.sql.
--
-- The `items` table (see supabase/schema.sql) has no user_id and
-- is managed out-of-band from the client — RLS only grants SELECT
-- to authenticated users ("Items are viewable by all authenticated
-- users" in schema.sql), so seeding the catalog here rather than
-- from client code is intentional: the shop page built in Phase 5
-- has nothing to sell without this.
--
-- Safe to re-run: `on conflict (name) do nothing` skips rows that
-- already exist instead of duplicating the catalog.
-- ============================================================

create unique index if not exists items_name_key on public.items (name);

insert into public.items (name, cost, type) values
  ('Violet Aura', 40, 'aura'),
  ('Cyan Aura', 40, 'aura'),
  ('Ember Cloak', 75, 'cosmetic'),
  ('Starlit Frame', 90, 'frame'),
  ('Nebula Banner', 120, 'banner'),
  ('Void Walker Title', 150, 'title'),
  ('Aurora Wings', 220, 'cosmetic'),
  ('Celestial Crown', 350, 'cosmetic')
on conflict (name) do nothing;
