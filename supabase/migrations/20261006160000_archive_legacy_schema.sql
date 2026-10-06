-- Archive the previous (pre-migration) data model into a private `legacy`
-- schema. Nothing is dropped: tables, data, triggers and helper functions are
-- moved as-is so they can be inspected or restored later. The schema is not
-- exposed through the Data API (anon/authenticated have no USAGE on it).
--
-- Safe to run on a fresh project: every step is guarded.

create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;

-- 1. Move every existing public table into legacy.
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I set schema legacy', r.relname);
  end loop;
end $$;

-- 2. Detach the old signup triggers on auth.users (they wrote into the old
--    public.users table). The new schema installs its own trigger.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_confirmed on auth.users;

-- 3. Move the old helper/trigger functions too, so their names are free for
--    the new schema. `rls_auto_enable` (event trigger that turns RLS on for
--    every new table) is generic and stays in public.
do $$
declare r record;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname <> 'rls_auto_enable'
      and p.prokind = 'f'
  loop
    execute format('alter function public.%I(%s) set schema legacy', r.proname, r.args);
  end loop;
end $$;
