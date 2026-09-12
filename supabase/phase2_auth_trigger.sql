-- ============================================================
-- Life RPG — Phase 2: Auth trigger (update)
-- Run this in the Supabase SQL Editor.
--
-- This REPLACES the handle_new_user() function from Phase 1's
-- schema.sql. It's functionally the same (profiles.level,
-- current_xp, and gold already defaulted to 1/0/0), but now
-- sets them explicitly so the "new character" state is spelled
-- out here rather than relying on column defaults elsewhere.
--
-- Safe to run even if you already ran Phase 1's schema.sql —
-- create_or_replace + drop-if-exists make this idempotent.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, level, current_xp, gold)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    1,
    0,
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
