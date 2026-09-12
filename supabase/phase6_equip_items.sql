-- ============================================================
-- Life RPG — Phase 6: Equip mechanic for owned shop items
-- Run this in the Supabase SQL Editor after phase5_seed_items.sql.
--
-- Closes the loop the shop was missing: owning an item used to be
-- a dead end (a checkmark in the grid that nothing else in the app
-- ever looked at). This adds two equip "slots" on the profile —
-- one title, one aura — and a server-side RPC to toggle them,
-- following the same pattern as purchase_item: gold-relevant state
-- lives in Postgres, and the client only ever previews it.
--
-- Only `title` and `aura` item types are equippable. Cosmetic,
-- frame, and banner items stay pure collectibles for now — a
-- deliberately small, shippable slice rather than building out
-- five equip slots at once.
-- ============================================================

alter table public.profiles
  add column if not exists equipped_title text,
  add column if not exists equipped_aura text;

-- ------------------------------------------------------------
-- equip_item(item_id)
--
-- Toggles the given item into (or out of) its slot on the calling
-- user's profile:
--   1. Verifies the item exists and is a `title` or `aura`.
--   2. Verifies the caller owns it (via user_items).
--   3. If it's already equipped, unequips it (sets the slot back
--      to null). Otherwise equips it, replacing whatever was
--      equipped in that slot before.
--
-- Runs SECURITY DEFINER for the same reason complete_task and
-- purchase_item do: profiles' RLS policy only allows the client to
-- SELECT its own row, so this function verifies ownership itself
-- and writes on the user's behalf. The profile row is locked with
-- `for update` so a double-click can't interleave two toggles.
-- ------------------------------------------------------------
create or replace function public.equip_item(item_id uuid)
returns table (
  equipped_title text,
  equipped_aura text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item record;
  v_owned boolean;
  v_profile record;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_item
  from public.items
  where id = item_id;

  if not found then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;

  if v_item.type not in ('title', 'aura') then
    raise exception 'Item type not equippable' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.user_items
    where user_id = v_uid and user_items.item_id = v_item.id
  ) into v_owned;

  if not v_owned then
    raise exception 'Item not owned' using errcode = 'P0001';
  end if;

  -- Lock the profile row before reading it so a concurrent toggle
  -- of the same slot can't race and leave it in an inconsistent
  -- state.
  select * into v_profile
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'Profile not found for current user' using errcode = 'P0002';
  end if;

  if v_item.type = 'title' then
    if v_profile.equipped_title = v_item.name then
      update public.profiles set equipped_title = null where id = v_uid;
    else
      update public.profiles set equipped_title = v_item.name where id = v_uid;
    end if;
  else
    if v_profile.equipped_aura = v_item.name then
      update public.profiles set equipped_aura = null where id = v_uid;
    else
      update public.profiles set equipped_aura = v_item.name where id = v_uid;
    end if;
  end if;

  return query
    select p.equipped_title, p.equipped_aura
    from public.profiles p
    where p.id = v_uid;
end;
$$;

revoke all on function public.equip_item(uuid) from public;
grant execute on function public.equip_item(uuid) to authenticated;
