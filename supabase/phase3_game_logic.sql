-- ============================================================
-- Life RPG — Phase 3: Server-side game logic
-- Run this in the Supabase SQL Editor (or via `supabase db push`)
--
-- This is the ONLY place XP, levels, gold, and streaks are ever
-- mutated. The client never writes these columns directly — RLS
-- policies on profiles/attributes only allow SELECT for the
-- client, and this function runs SECURITY DEFINER so it can
-- write on the user's behalf after verifying ownership itself.
-- ============================================================

-- ------------------------------------------------------------
-- xp_to_next_level(level)
-- XP required to advance FROM the given level TO the next one.
-- Mirrored client-side in lib/game/leveling.ts for display only —
-- this SQL copy is the only one that ever actually awards XP.
-- ------------------------------------------------------------
create or replace function public.xp_to_next_level(p_level integer)
returns integer
language sql
immutable
as $$
  select floor(100 * power(p_level::numeric, 1.5))::integer;
$$;

-- ------------------------------------------------------------
-- gold_reward_for_task(p_xp_reward)
-- Simple, tweakable gold formula: half the XP reward, minimum 1.
-- Kept as its own function so the reward curve can change later
-- without touching the transaction logic below.
-- ------------------------------------------------------------
create or replace function public.gold_reward_for_task(p_xp_reward integer)
returns integer
language sql
immutable
as $$
  select greatest(1, floor(p_xp_reward::numeric / 2))::integer;
$$;

-- ------------------------------------------------------------
-- complete_task(task_id)
--
-- Atomically, for the CALLING user's own task:
--   1. Locks and validates the task (must exist, belong to the
--      caller, and not already be completed).
--   2. Marks it completed with completed_at = now().
--   3. Awards XP to profiles.current_xp and recalculates level
--      via xp_to_next_level(), looping in case a big XP reward
--      crosses more than one level threshold at once.
--   4. Awards the same XP to the matching row in `attributes`
--      (matched on task.category -> attribute name; unmapped or
--      null categories fall back to Discipline), recalculating
--      that attribute's level the same way.
--   5. Updates the daily streak by comparing the task's
--      completion date to profiles.last_active_date:
--        - same calendar day as last_active_date -> no change
--        - exactly one calendar day later -> streak_count + 1
--        - any other gap (or first-ever completion) -> reset to 1
--   6. Awards gold via gold_reward_for_task().
--
-- Runs as a single implicit transaction (a PL/pgSQL function body
-- IS one transaction), and the `select ... for update` row lock
-- on both the task and the profile means two rapid double-clicks
-- (or two concurrent requests) serialize against each other —
-- the second call sees is_completed = true and raises, rather
-- than double-awarding XP/gold.
-- ------------------------------------------------------------
create or replace function public.complete_task(task_id uuid)
returns table (
  new_level integer,
  new_current_xp integer,
  new_gold integer,
  new_streak_count integer,
  attribute_name text,
  attribute_new_level integer,
  attribute_new_xp integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_task record;
  v_profile record;
  v_attribute record;
  v_completed_date date;
  v_xp_awarded integer;
  v_gold_awarded integer;
  v_level integer;
  v_xp integer;
  v_attr_name text;
  v_attr_level integer;
  v_attr_xp integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Lock the task row first. FOR UPDATE means a concurrent second
  -- call for the same task_id blocks here until this transaction
  -- commits or rolls back, then re-reads is_completed = true below
  -- and raises — this is what prevents the double-click race.
  select * into v_task
  from public.tasks
  where id = task_id
  for update;

  if not found then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  if v_task.user_id <> v_uid then
    -- Deliberately the same "not found" message as above so this
    -- function never confirms/denies the existence of another
    -- user's task id.
    raise exception 'Task not found' using errcode = 'P0002';
  end if;

  if v_task.is_completed then
    raise exception 'Task is already completed' using errcode = 'P0001';
  end if;

  v_xp_awarded := greatest(0, v_task.xp_reward);
  v_gold_awarded := public.gold_reward_for_task(v_xp_awarded);
  v_completed_date := (now() at time zone 'utc')::date;

  -- Mark the task complete.
  update public.tasks
  set is_completed = true,
      completed_at = now()
  where id = v_task.id;

  -- Lock the profile row for the same reason as the task above.
  select * into v_profile
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'Profile not found for current user' using errcode = 'P0002';
  end if;

  -- ---- XP + level (profile) ----
  v_level := v_profile.level;
  v_xp := v_profile.current_xp + v_xp_awarded;

  -- Loop rather than a single subtraction so a large XP reward
  -- (or a low starting level) can carry across multiple level-ups
  -- in one go, each against that level's own threshold.
  while v_xp >= public.xp_to_next_level(v_level) loop
    v_xp := v_xp - public.xp_to_next_level(v_level);
    v_level := v_level + 1;
  end loop;

  -- ---- Streak ----
  if v_profile.last_active_date is null then
    v_profile.streak_count := 1;
  elsif v_profile.last_active_date = v_completed_date then
    -- Same day: no change to streak_count.
    null;
  elsif v_profile.last_active_date = v_completed_date - 1 then
    v_profile.streak_count := v_profile.streak_count + 1;
  else
    v_profile.streak_count := 1;
  end if;

  update public.profiles
  set level = v_level,
      current_xp = v_xp,
      gold = gold + v_gold_awarded,
      streak_count = v_profile.streak_count,
      last_active_date = v_completed_date
  where id = v_uid
  returning level, current_xp, gold, streak_count
  into v_level, v_xp, v_gold_awarded, v_profile.streak_count;

  -- ---- XP + level (attribute) ----
  v_attr_name := case lower(coalesce(v_task.category, ''))
    when 'strength' then 'Strength'
    when 'fitness' then 'Strength'
    when 'exercise' then 'Strength'
    when 'workout' then 'Strength'
    when 'physical' then 'Strength'
    when 'intellect' then 'Intellect'
    when 'intelligence' then 'Intellect'
    when 'learning' then 'Intellect'
    when 'study' then 'Intellect'
    when 'reading' then 'Intellect'
    when 'work' then 'Intellect'
    when 'discipline' then 'Discipline'
    when 'habit' then 'Discipline'
    when 'chore' then 'Discipline'
    when 'chores' then 'Discipline'
    when 'finance' then 'Discipline'
    when 'charisma' then 'Charisma'
    when 'social' then 'Charisma'
    when 'relationships' then 'Charisma'
    when 'networking' then 'Charisma'
    when 'vitality' then 'Vitality'
    when 'health' then 'Vitality'
    when 'sleep' then 'Vitality'
    when 'nutrition' then 'Vitality'
    when 'wellness' then 'Vitality'
    else 'Discipline' -- unmapped/null category default
  end;

  -- Lock (or lazily create) the matching attribute row for this user.
  select * into v_attribute
  from public.attributes
  where user_id = v_uid and name = v_attr_name
  for update;

  if not found then
    insert into public.attributes (user_id, name, level, xp)
    values (v_uid, v_attr_name, 1, 0)
    returning * into v_attribute;
  end if;

  v_attr_level := v_attribute.level;
  v_attr_xp := v_attribute.xp + v_xp_awarded;

  while v_attr_xp >= public.xp_to_next_level(v_attr_level) loop
    v_attr_xp := v_attr_xp - public.xp_to_next_level(v_attr_level);
    v_attr_level := v_attr_level + 1;
  end loop;

  update public.attributes
  set level = v_attr_level,
      xp = v_attr_xp
  where id = v_attribute.id;

  return query select
    v_level,
    v_xp,
    v_gold_awarded,
    v_profile.streak_count,
    v_attr_name,
    v_attr_level,
    v_attr_xp;
end;
$$;

-- Only authenticated users may call this — and only ever on their
-- own tasks, enforced inside the function body above (not by RLS,
-- since SECURITY DEFINER bypasses it for this function's own writes).
revoke all on function public.complete_task(uuid) from public;
grant execute on function public.complete_task(uuid) to authenticated;

-- ------------------------------------------------------------
-- purchase_item(item_id)
--
-- Same atomicity story as complete_task: locks the profile row,
-- checks gold balance server-side, decrements gold, and records
-- the purchase — all in one transaction so double-clicking "buy"
-- can't spend gold the user doesn't have.
-- ------------------------------------------------------------
create or replace function public.purchase_item(item_id uuid)
returns table (
  new_gold integer,
  purchased_item_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_item record;
  v_profile record;
  v_already_owned boolean;
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

  select exists (
    select 1 from public.user_items
    where user_id = v_uid and user_items.item_id = v_item.id
  ) into v_already_owned;

  if v_already_owned then
    raise exception 'Item already owned' using errcode = 'P0001';
  end if;

  -- Lock the profile row so a concurrent purchase (or double-click)
  -- can't read the same stale gold balance and both succeed.
  select * into v_profile
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'Profile not found for current user' using errcode = 'P0002';
  end if;

  if v_profile.gold < v_item.cost then
    raise exception 'Not enough gold' using errcode = 'P0001';
  end if;

  update public.profiles
  set gold = gold - v_item.cost
  where id = v_uid
  returning gold into v_profile.gold;

  insert into public.user_items (user_id, item_id)
  values (v_uid, v_item.id);

  return query select v_profile.gold, v_item.id;
end;
$$;

revoke all on function public.purchase_item(uuid) from public;
grant execute on function public.purchase_item(uuid) to authenticated;
