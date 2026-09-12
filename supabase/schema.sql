-- ============================================================
-- Life RPG — Phase 1 Schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`)
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- One row per authenticated user. Created via trigger on signup.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  level integer not null default 1,
  current_xp integer not null default 0,
  gold integer not null default 0,
  streak_count integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- attributes
-- Per-user stat tracks (Strength, Intellect, Discipline, etc.)
-- ------------------------------------------------------------
create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  level integer not null default 1,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ------------------------------------------------------------
-- tasks
-- Real-life tasks that award XP when completed.
-- ------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  xp_reward integer not null default 10,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- items
-- Global catalog of purchasable cosmetic items (not user-owned rows).
-- No user_id — this table is readable by everyone, writable by no one
-- via the client (managed by admins / seed scripts / service role).
-- ------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost integer not null,
  type text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- user_items
-- Join table: which items a user has purchased.
-- ------------------------------------------------------------
create table if not exists public.user_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.attributes enable row level security;
alter table public.tasks enable row level security;
alter table public.items enable row level security;
alter table public.user_items enable row level security;

-- ---------------- profiles ----------------
-- id IS the user's own auth uid on this table, so policies key off id.
-- SELECT-only for clients: level/current_xp/gold/streak_count/
-- last_active_date/equipped_title/equipped_aura are game state and
-- are only ever written by the handle_new_user() trigger (below) or
-- by the complete_task()/purchase_item()/equip_item() SECURITY
-- DEFINER functions in phase3_game_logic.sql / phase6_equip_items.sql
-- — never directly by an authenticated client. See the privilege
-- hardening section at the end of this file for the enforcement.
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

-- ---------------- attributes ----------------
-- SELECT-only for clients — rows/levels/xp are only ever written
-- from inside complete_task(). See privilege hardening below.
create policy "Attributes are viewable by owner"
  on public.attributes for select
  using (auth.uid() = user_id);

-- ---------------- tasks ----------------
-- Row-ownership is enforced here; WHICH COLUMNS a client can write
-- is additionally narrowed by column-level GRANTs at the bottom of
-- this file, so a direct API call can never set is_completed,
-- completed_at, or user_id — only complete_task() can.
create policy "Tasks are viewable by owner"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Tasks are insertable by owner"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Tasks are updatable by owner"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Tasks are deletable by owner"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- ---------------- items ----------------
-- Shared catalog: any authenticated user can read; no client-side writes.
create policy "Items are viewable by all authenticated users"
  on public.items for select
  using (auth.role() = 'authenticated');

-- ---------------- user_items ----------------
-- SELECT-only for clients — rows are only ever inserted from inside
-- purchase_item(). See privilege hardening below.
create policy "User items are viewable by owner"
  on public.user_items for select
  using (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create a profile row when a new auth user signs up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Privilege hardening
-- ------------------------------------------------------------
-- Supabase grants ALL PRIVILEGES on public tables to `authenticated`
-- by default — RLS policies above are what actually restrict
-- access. Row-ownership policies alone aren't enough for game-state
-- tables, since e.g. `auth.uid() = id with check (auth.uid() = id)`
-- would let a user PATCH any column on their own row, including
-- level/gold/xp. So in addition to only defining SELECT policies
-- for profiles/attributes/user_items above, we explicitly revoke
-- the write privileges those default grants would otherwise leave
-- in place. (SECURITY DEFINER functions in phase3_game_logic.sql /
-- phase6_equip_items.sql are owned by the table owner and are
-- unaffected by revoking privileges from `authenticated`.)
-- ============================================================

revoke insert, update, delete on public.profiles from authenticated;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

revoke insert, update, delete on public.attributes from authenticated;
revoke all on public.attributes from anon;
grant select on public.attributes to authenticated;

revoke insert, update, delete on public.user_items from authenticated;
revoke all on public.user_items from anon;
grant select on public.user_items to authenticated;

revoke insert, update, delete on public.items from authenticated;
revoke all on public.items from anon;
grant select on public.items to authenticated;

-- tasks: full row-level CRUD stays available to the owner (policies
-- above), but column-level grants stop a direct API write from ever
-- touching is_completed / completed_at / user_id. A real task can
-- only ever be marked complete via the complete_task() RPC.
revoke insert, update on public.tasks from authenticated;
grant insert (user_id, title, category, xp_reward) on public.tasks to authenticated;
grant update (title, category, xp_reward) on public.tasks to authenticated;

-- ============================================================
-- Helpful indexes
-- ============================================================

create index if not exists idx_attributes_user_id on public.attributes (user_id);
create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_completed on public.tasks (user_id, is_completed);
create index if not exists idx_user_items_user_id on public.user_items (user_id);
