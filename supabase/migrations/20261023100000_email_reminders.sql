-- Scheduled reminder emails (daily, 08:00 UTC): Pass expiring (7 days / 1 day),
-- inactive members, unfinished onboarding. Each reminder is sent once thanks to dedupe_key.

create extension if not exists pg_cron;

alter table public.email_outbox add column if not exists dedupe_key text;
create unique index if not exists email_outbox_dedupe_idx on public.email_outbox (dedupe_key) where dedupe_key is not null;

create or replace function public.enqueue_reminders() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; c int;
begin
  -- 1. Pass expiring in 7 days / 1 day
  insert into email_outbox (user_id, to_email, template, lang, data, dedupe_key)
  select p.id, p.email, 'reminder_expiring', public.email_lang_for(p.country),
         jsonb_build_object('name', p.full_name, 'days', d.days, 'plan', s.plan_type, 'date', to_char(s.expires_at, 'DD/MM/YYYY')),
         'exp' || d.days || ':' || s.id
  from subscriptions s
  join profiles p on p.id = s.user_id
  cross join lateral (select case when s.expires_at <= now() + interval '1 day' then 1 else 7 end as days) d
  where s.status = 'ACTIVE' and s.user_id is not null and s.company_id is null and s.merchant_id is null
    and s.expires_at > now() and s.expires_at <= now() + interval '7 days'
    and p.email is not null and coalesce(p.notif_email, true)
    and (s.expires_at <= now() + interval '1 day' or s.expires_at > now() + interval '6 days')
  on conflict do nothing;
  get diagnostics c = row_count; n := n + c;

  -- 2. Active members who have not used a perk for 30 days (max once a month)
  insert into email_outbox (user_id, to_email, template, lang, data, dedupe_key)
  select p.id, p.email, 'reminder_inactive', public.email_lang_for(p.country),
         jsonb_build_object('name', p.full_name),
         'inactive:' || p.id || ':' || to_char(now(), 'YYYY-MM')
  from profiles p
  where p.email is not null and coalesce(p.notif_email, true)
    and exists (select 1 from subscriptions s where s.user_id = p.id and s.status = 'ACTIVE' and s.expires_at > now() and coalesce(s.started_at, s.created_date) < now() - interval '14 days')
    and not exists (select 1 from redemptions r where r.user_id = p.id and r.status = 'REDEEMED' and r.redeemed_at > now() - interval '30 days')
  on conflict do nothing;
  get diagnostics c = row_count; n := n + c;

  -- 3. Account created but onboarding unfinished after 2 days (once)
  insert into email_outbox (user_id, to_email, template, lang, data, dedupe_key)
  select p.id, p.email, 'reminder_onboarding', public.email_lang_for(p.country),
         jsonb_build_object('name', p.full_name), 'onboard:' || p.id
  from profiles p
  where coalesce(p.onboarded, false) = false and p.email is not null and coalesce(p.notif_email, true)
    and p.created_date < now() - interval '2 days' and p.created_date > now() - interval '14 days'
  on conflict do nothing;
  get diagnostics c = row_count; n := n + c;
  return n;
end $$;
revoke execute on function public.enqueue_reminders() from public, anon, authenticated;

select cron.schedule('nelvin-email-reminders', '0 8 * * *', $$select public.enqueue_reminders()$$);
-- Retry sweep: ping the sender every 10 minutes so failed/queued rows get another chance.
select cron.schedule('nelvin-email-retry', '*/10 * * * *', $$
  select net.http_post(
    url := 'https://wdxgflyhjhcevdruvfjb.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object('Content-Type','application/json','x-email-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'email_hook_secret' limit 1)),
    body := '{}'::jsonb)
  where exists (select 1 from public.email_outbox where status in ('pending','failed') and attempts < 5)
$$);
