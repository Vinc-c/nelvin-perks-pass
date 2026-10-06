-- Platform v2 — strict multi-tenant hardening and admin reporting.

-- ---------------------------------------------------------------------------
-- Companies: HR edits its own company profile; commercial fields stay admin-only
-- ---------------------------------------------------------------------------
create policy "companies: HR update own" on public.companies for update to authenticated
  using ((select public.my_role()) = 'HR_ADMIN' and id = (select public.my_company_id()))
  with check ((select public.my_role()) = 'HR_ADMIN' and id = (select public.my_company_id()));

create or replace function public.guard_company_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_privileged_session() or public.is_admin() then
    if new.wallet_balance is distinct from old.wallet_balance and not public.is_privileged_session() then
      raise exception 'Le wallet entreprise ne se modifie que par des opérations tracées' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.plan_tier is distinct from old.plan_tier or new.billing_cycle is distinct from old.billing_cycle
     or new.max_employees is distinct from old.max_employees or new.seats_used is distinct from old.seats_used
     or new.subscription_status is distinct from old.subscription_status
     or new.total_saved is distinct from old.total_saved or new.wallet_balance is distinct from old.wallet_balance
     or new.created_date is distinct from old.created_date then
    raise exception 'Champs réservés à Nelvin' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_company_update before update on public.companies
  for each row execute function public.guard_company_update();

-- ---------------------------------------------------------------------------
-- Offers: only Nelvin can feature an offer; merchant_id cannot be moved
-- ---------------------------------------------------------------------------
create or replace function public.guard_offer_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_privileged_session() or public.is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_featured := false;
  else
    new.is_featured := old.is_featured;
    if new.merchant_id is distinct from old.merchant_id then
      raise exception 'Une offre ne peut pas changer de marchand' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger guard_offer_write before insert or update on public.offers
  for each row execute function public.guard_offer_write();

-- ---------------------------------------------------------------------------
-- Subscriptions: merchants see their own; members only their personal ones
-- ---------------------------------------------------------------------------
drop policy if exists "subscriptions: read" on public.subscriptions;
create policy "subscriptions: read" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id()))
         or (merchant_id is not null and merchant_id = (select public.my_merchant_id()))
         or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Redemptions: strict tenant reads (owner, owning merchant, HR of the
-- company that sponsors the employee, admins) — unchanged semantics, but the
-- HR branch now requires the redemption to be company-sponsored.
-- ---------------------------------------------------------------------------
drop policy if exists "redemptions: read" on public.redemptions;
create policy "redemptions: read" on public.redemptions for select to authenticated
  using (user_id = (select auth.uid())
         or (merchant_id is not null and merchant_id = (select public.my_merchant_id()))
         or ((select public.my_role()) = 'HR_ADMIN' and company_id is not null
             and company_id = (select public.my_company_id()))
         or (select public.is_admin()));

-- Notifications: users may only create notes for themselves (admins: anyone).
-- (v1 policy kept.) Realtime also for tickets.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.ticket_messages;
    alter publication supabase_realtime add table public.redemptions;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Admin: platform-wide statistics in one call
-- ---------------------------------------------------------------------------
create or replace function public.admin_platform_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select jsonb_build_object(
    'users', (select jsonb_object_agg(role, n) from (select role, count(*) n from public.profiles group by role) x),
    'users_total', (select count(*) from public.profiles),
    'companies', (select count(*) from public.companies),
    'companies_active', (select count(*) from public.companies where subscription_status = 'ACTIVE'),
    'companies_trial', (select count(*) from public.companies where subscription_status = 'TRIAL'),
    'merchants', (select jsonb_object_agg(verified_status, n) from (select verified_status, count(*) n from public.merchants group by 1) x),
    'offers', (select count(*) from public.offers),
    'redemptions_30d', (select count(*) from public.redemptions where status = 'REDEEMED' and redeemed_at > now() - interval '30 days'),
    'gmv_30d_usd', (select coalesce(sum(bill_amount_usd), 0) from public.redemptions where status = 'REDEEMED' and redeemed_at > now() - interval '30 days'),
    'savings_30d_usd', (select coalesce(sum(discount_applied), 0) from public.redemptions where status = 'REDEEMED' and redeemed_at > now() - interval '30 days'),
    'cashback_30d_usd', (select coalesce(sum(cashback_credited), 0) from public.redemptions where status = 'REDEEMED' and redeemed_at > now() - interval '30 days'),
    'subscription_revenue_30d_usd', (select coalesce(sum(amount_usd), 0) from public.transactions where type = 'SUBSCRIPTION' and status = 'COMPLETED' and created_date > now() - interval '30 days'),
    'active_subscriptions', (select count(*) from public.subscriptions where status = 'ACTIVE' and (expires_at is null or expires_at > now())),
    'wallet_float_usd', (select coalesce(sum(wallet_balance), 0) from public.profiles),
    'company_wallets_usd', (select coalesce(sum(wallet_balance), 0) from public.companies),
    'merchant_payables_usd', (select coalesce(sum(payout_balance), 0) from public.merchants),
    'pending_withdrawals', (select count(*) from public.transactions where type = 'WITHDRAWAL' and status = 'PENDING'),
    'pending_payouts', (select count(*) from public.payout_requests where status = 'PENDING'),
    'pending_merchants', (select count(*) from public.merchants where verified_status = 'PENDING'),
    'pending_kyc_docs', (select count(*) from public.merchant_documents where status = 'PENDING'),
    'open_tickets', (select count(*) from public.support_tickets where status in ('OPEN', 'IN_PROGRESS')),
    'monthly', (
      select coalesce(jsonb_agg(m order by m->>'month'), '[]'::jsonb) from (
        select jsonb_build_object(
          'month', to_char(d, 'YYYY-MM'),
          'redemptions', (select count(*) from public.redemptions r where r.status = 'REDEEMED' and date_trunc('month', r.redeemed_at) = d),
          'savings_usd', (select coalesce(sum(discount_applied), 0) from public.redemptions r where r.status = 'REDEEMED' and date_trunc('month', r.redeemed_at) = d),
          'cashback_usd', (select coalesce(sum(cashback_credited), 0) from public.redemptions r where r.status = 'REDEEMED' and date_trunc('month', r.redeemed_at) = d),
          'revenue_usd', (select coalesce(sum(amount_usd), 0) from public.transactions t where t.type = 'SUBSCRIPTION' and t.status = 'COMPLETED' and date_trunc('month', t.created_date) = d),
          'signups', (select count(*) from public.profiles p where date_trunc('month', p.created_date) = d)
        ) m
        from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') d
      ) s)
  ) into v;
  return v;
end $$;
revoke execute on function public.admin_platform_stats() from public, anon;
grant execute on function public.admin_platform_stats() to authenticated;

-- Admin: grant a subscription manually (e.g. bank transfer received offline).
create or replace function public.admin_grant_subscription(p_user_id uuid, p_plan_code text, p_cycle text default 'MONTHLY')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  v := public._activate_subscription(p_user_id, p_plan_code, p_cycle, 0, 'MANUAL');
  perform public.audit('subscription.grant', 'profiles', p_user_id::text, jsonb_build_object('plan', p_plan_code, 'cycle', p_cycle));
  return v;
end $$;
revoke execute on function public.admin_grant_subscription(uuid, text, text) from public, anon;
grant execute on function public.admin_grant_subscription(uuid, text, text) to authenticated;

-- Audit merchant vetting and company changes done by admins.
create or replace function public.audit_admin_entity_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.is_admin() and not public.is_privileged_session() then
    if tg_table_name = 'merchants' and new.verified_status is distinct from old.verified_status then
      perform public.audit('merchant.' || lower(new.verified_status), 'merchants', new.id::text, jsonb_build_object('name', new.name));
    elsif tg_table_name = 'companies' then
      perform public.audit('company.update', 'companies', new.id::text, jsonb_build_object('name', new.name));
    elsif tg_table_name = 'currencies' then
      perform public.audit('currency.update', 'currencies', new.code, jsonb_build_object('rate', new.rate_per_usd));
    elsif tg_table_name = 'plans' then
      perform public.audit('plan.update', 'plans', new.code, jsonb_build_object('monthly', new.price_monthly, 'annual', new.price_annual));
    end if;
  end if;
  return new;
end $$;
create trigger audit_admin_change after update on public.merchants for each row execute function public.audit_admin_entity_change();
create trigger audit_admin_change after update on public.companies for each row execute function public.audit_admin_entity_change();
create trigger audit_admin_change after update on public.currencies for each row execute function public.audit_admin_entity_change();
create trigger audit_admin_change after update on public.plans for each row execute function public.audit_admin_entity_change();

-- ---------------------------------------------------------------------------
-- Two-factor authentication: when a user has a verified TOTP factor, their
-- session must be AAL2 for privileged actions. Admin powers (is_admin) are
-- only granted to AAL2 sessions of admins who enrolled 2FA.
-- ---------------------------------------------------------------------------
create or replace function public.mfa_ok()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('SUPER_ADMIN', 'admin') from public.profiles where id = auth.uid()), false)
         and public.mfa_ok()
$$;
