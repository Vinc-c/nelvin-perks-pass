-- Transactional email outbox. Every in-app notification (notif_email <> false)
-- and the "onboarding finished" welcome are queued here and delivered by the
-- `send-email` Edge Function (branded HTML, Resend). Delivery never blocks or
-- fails the business transaction that produced the notification.

create extension if not exists pg_net with schema extensions;

create table if not exists public.email_outbox (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  to_email     text not null,
  template     text not null default 'notification',
  lang         text not null default 'fr',
  data         jsonb not null default '{}'::jsonb,
  status       text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts     int  not null default 0,
  last_error   text,
  created_date timestamptz not null default now(),
  sent_at      timestamptz
);
create index if not exists email_outbox_pending_idx on public.email_outbox (created_date) where status in ('pending','failed');
alter table public.email_outbox enable row level security;   -- no policy: service role only
revoke all on public.email_outbox from anon, authenticated;

-- Admins can monitor delivery from the back-office.
create policy email_outbox_admin_read on public.email_outbox for select using (public.is_admin());
grant select on public.email_outbox to authenticated;

create or replace function public.email_lang_for(p_country text) returns text
language sql immutable as $$
  select case upper(coalesce(p_country,''))
    when 'TZ' then 'sw'
    when 'NG' then 'en' when 'GH' then 'en' when 'KE' then 'en' when 'UG' then 'en'
    when 'ZA' then 'en' when 'RW' then 'en' when 'ZM' then 'en' when 'ZW' then 'en'
    when 'EG' then 'ar' when 'MA' then 'fr' when 'DZ' then 'fr' when 'TN' then 'fr'
    else 'fr' end;
$$;

create or replace function public.enqueue_email(p_user uuid, p_to text, p_template text, p_data jsonb, p_lang text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_country text;
begin
  if p_to is null or p_to = '' then return null; end if;
  if p_lang is null then select country into v_country from profiles where id = p_user; end if;
  -- soft rate limit: at most 20 emails / hour / user
  if p_user is not null and (select count(*) from email_outbox where user_id = p_user and created_date > now() - interval '1 hour') >= 20 then
    return null;
  end if;
  insert into email_outbox (user_id, to_email, template, lang, data)
  values (p_user, p_to, p_template, coalesce(p_lang, public.email_lang_for(v_country)), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.enqueue_email(uuid, text, text, jsonb, text) from public, anon, authenticated;

-- 1. In-app notification -> email
create or replace function public.trg_notification_email() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select email, notif_email, country into p from profiles where id = new.user_id;
  if p.email is not null and coalesce(p.notif_email, true) then
    perform public.enqueue_email(new.user_id, p.email, 'notification',
      jsonb_build_object('title', new.title, 'body', new.body, 'link', new.link, 'type', new.type));
  end if;
  return new;
exception when others then
  return new;   -- never break the business transaction
end $$;
drop trigger if exists notification_email on public.notifications;
create trigger notification_email after insert on public.notifications
  for each row execute function public.trg_notification_email();

-- 2. Welcome email when onboarding completes
create or replace function public.trg_welcome_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(old.onboarded,false) = false and new.onboarded = true and new.email is not null then
    perform public.enqueue_email(new.id, new.email, 'welcome', jsonb_build_object('name', new.full_name, 'role', new.role));
  end if;
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists welcome_email on public.profiles;
create trigger welcome_email after update of onboarded on public.profiles
  for each row execute function public.trg_welcome_email();

-- 3. Wake the Edge Function as soon as a row is queued (secret kept in Vault).
create or replace function public.trg_outbox_dispatch() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'email_hook_secret' limit 1;
  if v_secret is null then return new; end if;   -- not configured yet: stays pending
  perform net.http_post(
    url := 'https://wdxgflyhjhcevdruvfjb.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object('Content-Type','application/json','x-email-secret', v_secret),
    body := jsonb_build_object('id', new.id),
    timeout_milliseconds := 5000);
  return new;
exception when others then
  return new;
end $$;
drop trigger if exists outbox_dispatch on public.email_outbox;
create trigger outbox_dispatch after insert on public.email_outbox
  for each row execute function public.trg_outbox_dispatch();

-- Edge Function authentication: the hook secret lives only in Vault
-- (select vault.create_secret('<random>', 'email_hook_secret')).
create or replace function public.email_hook_ok(p_secret text) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'email_hook_secret' and decrypted_secret = p_secret and p_secret is not null and p_secret <> '');
$$;
revoke execute on function public.email_hook_ok(text) from public, anon, authenticated;
grant execute on function public.email_hook_ok(text) to service_role;
revoke execute on function public.trg_notification_email(), public.trg_welcome_email(), public.trg_outbox_dispatch() from public, anon, authenticated;
