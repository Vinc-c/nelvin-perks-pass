-- At most 4 active devices per account. Each browser/app install has a random
-- device id; the 5th new device is refused until the member removes one.
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null check (char_length(device_id) between 8 and 80),
  label text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, device_id)
);
create index if not exists user_devices_user_idx on public.user_devices (user_id) where revoked_at is null;
alter table public.user_devices enable row level security;
create policy "user_devices: own read" on public.user_devices for select to authenticated using (user_id = (select auth.uid()));
-- no insert/update/delete policies: writes only through the functions below

create or replace function public.register_device(p_device_id text, p_label text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_row public.user_devices%rowtype;
  v_active int;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_device_id is null or char_length(p_device_id) < 8 then raise exception 'Invalid device' using errcode = '22023'; end if;

  select * into v_row from public.user_devices where user_id = v_uid and device_id = p_device_id;
  if found then
    if v_row.revoked_at is not null then return jsonb_build_object('ok', false, 'reason', 'REVOKED'); end if;
    update public.user_devices set last_seen = now(), label = coalesce(left(p_label, 80), label) where id = v_row.id;
    return jsonb_build_object('ok', true);
  end if;

  select count(*) into v_active from public.user_devices where user_id = v_uid and revoked_at is null;
  if v_active >= 4 then
    return jsonb_build_object('ok', false, 'reason', 'LIMIT', 'limit', 4,
      'devices', (select coalesce(jsonb_agg(jsonb_build_object('device_id', device_id, 'label', label, 'last_seen', last_seen) order by last_seen desc), '[]'::jsonb)
                    from public.user_devices where user_id = v_uid and revoked_at is null));
  end if;
  insert into public.user_devices (user_id, device_id, label) values (v_uid, p_device_id, left(p_label, 80));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.list_my_devices()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('device_id', device_id, 'label', label, 'first_seen', first_seen, 'last_seen', last_seen) order by last_seen desc), '[]'::jsonb)
    from public.user_devices where user_id = auth.uid() and revoked_at is null
$$;

create or replace function public.remove_my_device(p_device_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.user_devices set revoked_at = now() where user_id = auth.uid() and device_id = p_device_id and revoked_at is null;
end $$;

revoke execute on function public.register_device(text, text), public.list_my_devices(), public.remove_my_device(text) from public, anon;
grant execute on function public.register_device(text, text), public.list_my_devices(), public.remove_my_device(text) to authenticated;
