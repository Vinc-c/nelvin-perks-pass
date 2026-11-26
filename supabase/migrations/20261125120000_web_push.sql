-- Web Push: browser subscriptions, VAPID public key, and a trigger that wakes the
-- send-push Edge Function for every in-app notification.
-- The VAPID PRIVATE key is NOT in this file: it lives only in Vault
-- (vault.create_secret('<private>', 'vapid_private_key')).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and length(endpoint) < 1200),
  p256dh text not null check (length(p256dh) between 20 and 200),
  auth text not null check (length(auth) between 8 and 100),
  user_agent text check (length(user_agent) < 300),
  created_date timestamptz not null default now(),
  last_ok_date timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select on public.push_subscriptions to authenticated;
drop policy if exists push_subs_own_read on public.push_subscriptions;
create policy push_subs_own_read on public.push_subscriptions for select to authenticated using (user_id = auth.uid());

create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_ua text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if (select count(*) from public.push_subscriptions where user_id = auth.uid()) >= 10
     and not exists (select 1 from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()) then
    raise exception 'Too many devices registered';
  end if;
  -- An endpoint is one browser profile: it follows whoever is signed in now.
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_ua, 299))
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent;
end $$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = '' as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;
revoke all on function public.save_push_subscription(text, text, text, text), public.delete_push_subscription(text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text), public.delete_push_subscription(text) to authenticated;

-- VAPID public key is public by design.
insert into public.platform_settings (key, value, description)
values ('vapid_public_key', '"BGTP4mtj1vueqUvQAssDA3wZgWBtRJWuFpnRHUgrf8UFyf-IxErXNdUD6zlL_hKemvhnSrn3yX4DBa0MjvnA40Q"'::jsonb, 'Web Push (VAPID) public key')
on conflict (key) do update set value = excluded.value;

-- Service-role only: the private key for the Edge Function.
create or replace function public.push_private_key() returns text
language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private_key' limit 1;
$$;
revoke all on function public.push_private_key() from public, anon, authenticated;
grant execute on function public.push_private_key() to service_role;

-- Every in-app notification also goes out as a push (the Edge Function checks the user's preferences).
create or replace function public.trg_notification_push() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text;
begin
  if not exists (select 1 from public.push_subscriptions where user_id = new.user_id) then return new; end if;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'email_hook_secret' limit 1;
  if v_secret is null then return new; end if;
  perform net.http_post(
    url := 'https://wdxgflyhjhcevdruvfjb.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','x-email-secret', v_secret),
    body := jsonb_build_object('notification_id', new.id),
    timeout_milliseconds := 5000);
  return new;
exception when others then
  return new;   -- never break the business transaction
end $$;
revoke all on function public.trg_notification_push() from public, anon, authenticated;
drop trigger if exists notification_push on public.notifications;
create trigger notification_push after insert on public.notifications
  for each row execute function public.trg_notification_push();
