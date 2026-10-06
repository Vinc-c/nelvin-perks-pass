-- Platform v2 — money model, currencies, plans, subscriptions, wallets,
-- redemptions with real bill amounts, withdrawals and merchant payouts.
--
-- MONEY MODEL: every balance (member wallet, company wallet, merchant payout)
-- is stored in USD. Amounts entered in another currency are converted with
-- the admin-managed `currencies` table at the time of the operation.

-- ---------------------------------------------------------------------------
-- Currencies
-- ---------------------------------------------------------------------------
create table public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  name text not null,
  symbol text not null,
  rate_per_usd numeric not null check (rate_per_usd > 0),
  region text,
  active boolean not null default true,
  sort_order int not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  updated_date timestamptz not null default now(),
  constraint currencies_usd_is_base check (code <> 'USD' or (rate_per_usd = 1 and active))
);
create trigger set_updated_date before update on public.currencies
  for each row execute function public.set_updated_date();
alter table public.currencies enable row level security;
create policy "currencies: read" on public.currencies for select to anon, authenticated using (true);
create policy "currencies: admin write" on public.currencies for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.currencies (code, name, symbol, rate_per_usd, region, sort_order) values
  ('USD', 'US Dollar', '$', 1, 'Mondial', 0),
  ('EUR', 'Euro', '€', 0.92, 'Europe', 1),
  ('XOF', 'Franc CFA (BCEAO)', 'CFA', 605, 'Afrique de l''Ouest (UEMOA)', 2),
  ('XAF', 'Franc CFA (BEAC)', 'FCFA', 605, 'Afrique centrale (CEMAC)', 3),
  ('NGN', 'Naira nigérian', '₦', 1580, 'Afrique de l''Ouest', 4),
  ('KES', 'Shilling kényan', 'KSh', 128, 'Afrique de l''Est', 5),
  ('EGP', 'Livre égyptienne', 'E£', 48, 'MENA', 6),
  ('AED', 'Dirham des EAU', 'AED', 3.67, 'Golfe', 7);

create or replace function public.to_usd(p_amount numeric, p_currency text)
returns numeric language plpgsql stable security definer set search_path = '' as $$
declare v_rate numeric;
begin
  if p_amount is null then return null; end if;
  select rate_per_usd into v_rate from public.currencies
   where code = upper(coalesce(nullif(p_currency, ''), 'USD')) and active;
  if v_rate is null then
    raise exception 'Devise non supportée: %', p_currency using errcode = '22023';
  end if;
  return round(p_amount / v_rate, 4);
end $$;

create or replace function public.from_usd(p_amount numeric, p_currency text)
returns numeric language plpgsql stable security definer set search_path = '' as $$
declare v_rate numeric;
begin
  select rate_per_usd into v_rate from public.currencies
   where code = upper(coalesce(nullif(p_currency, ''), 'USD')) and active;
  if v_rate is null then
    raise exception 'Devise non supportée: %', p_currency using errcode = '22023';
  end if;
  return round(p_amount * v_rate, 2);
end $$;

-- ---------------------------------------------------------------------------
-- Plans (single source of truth for pricing across the app)
-- ---------------------------------------------------------------------------
create table public.plans (
  code text primary key check (code ~ '^[A-Z_]+$'),
  audience text not null check (audience in ('B2C', 'B2B', 'MERCHANT')),
  name text not null,
  tagline text,
  price_monthly numeric not null check (price_monthly >= 0),
  price_annual numeric not null check (price_annual >= 0),
  max_employees int,
  features text[] not null default '{}',
  popular boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create trigger set_updated_date before update on public.plans
  for each row execute function public.set_updated_date();
alter table public.plans enable row level security;
create policy "plans: read" on public.plans for select to anon, authenticated using (true);
create policy "plans: admin write" on public.plans for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.plans (code, audience, name, tagline, price_monthly, price_annual, max_employees, features, popular, sort_order) values
  ('PASS_BASIC', 'B2C', 'Pass Basic', 'Commencez à économiser au quotidien', 9, 91, null,
   array['Accès aux offres partenaires', 'Cashback sur chaque échange', 'Wallet multi-devises', 'Support par email'], false, 1),
  ('PASS_PREMIUM', 'B2C', 'Pass Premium', 'Le plus choisi par nos membres', 19, 193, null,
   array['Tout le Pass Basic', 'Offres 2-pour-1 premium', 'Retraits Mobile Money', 'Offres prioritaires', 'Support prioritaire'], true, 2),
  ('PASS_VIP', 'B2C', 'Pass VIP Gold', 'Avantages luxe et conciergerie', 39, 397, null,
   array['Tout le Pass Premium', 'Hôtels & expériences luxe', 'Conciergerie dédiée', 'Événements VIP'], false, 3),
  ('STARTER', 'B2B', 'Starter Team', 'Jusqu''à 15 employés', 79, 805, 15,
   array['15 sièges employés', 'Invitations par code', 'Wallet entreprise & allocations', 'Validation QR', 'Support email'], false, 10),
  ('GROWTH', 'B2B', 'Growth Business', 'Jusqu''à 59 employés', 129, 1315, 59,
   array['59 sièges employés', 'Politique d''avantages flexibles', 'Rapports & analytics RH', 'Mur de reconnaissance', 'Support prioritaire'], true, 11),
  ('ENTERPRISE', 'B2B', 'Enterprise Unlimited', 'Employés illimités', 189, 1927, null,
   array['Sièges illimités', 'Tout le plan Growth', 'Account manager dédié', 'SLA personnalisé'], false, 12),
  ('MERCHANT_BASIC', 'MERCHANT', 'Merchant Basic', 'Visibilité et validation des codes', 29, 295, null,
   array['Fiche marchand', 'Validation des codes', 'Campagnes standard', 'Paiements mensuels'], false, 20),
  ('MERCHANT_PRO', 'MERCHANT', 'Merchant Pro', 'Croissance et analytics avancés', 49, 497, null,
   array['Tout Merchant Basic', 'Campagnes avancées', 'Demandes de paiement illimitées', 'Analytics détaillés'], true, 21);

-- Subscriptions point to plans; companies carry their wallet.
alter table public.subscriptions drop constraint if exists subscriptions_plan_type_check;
alter table public.subscriptions drop constraint if exists subscriptions_psp_used_check;
alter table public.subscriptions add constraint subscriptions_psp_used_check check (psp_used in (
  'PADDLE', 'STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'PAYUNIT', 'KORAPAY', 'CAMPAY', 'WALLET', 'MANUAL'));
alter table public.subscriptions
  add constraint subscriptions_plan_type_fkey foreign key (plan_type) references public.plans(code),
  add column merchant_id uuid references public.merchants(id) on delete cascade,
  add column started_at timestamptz not null default now(),
  add column cancel_at_period_end boolean not null default false,
  add column amount_usd numeric;
create index subscriptions_merchant_id_idx on public.subscriptions(merchant_id);

alter table public.companies
  add column wallet_balance numeric not null default 0 check (wallet_balance >= 0);

alter table public.companies drop constraint if exists companies_plan_tier_check;
alter table public.companies
  add constraint companies_plan_tier_fkey foreign key (plan_tier) references public.plans(code);

-- ---------------------------------------------------------------------------
-- Transactions: richer ledger
-- ---------------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in (
  'REDEMPTION', 'RECHARGE', 'WITHDRAWAL', 'SUBSCRIPTION', 'PAYOUT',
  'ALLOCATION', 'COMPANY_TOPUP', 'REFERRAL_BONUS', 'REFUND'));
alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions add constraint transactions_status_check check (status in (
  'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'));
alter table public.transactions
  add column amount_usd numeric,
  add column savings_usd numeric not null default 0,
  add column plan_code text references public.plans(code),
  add column billing_cycle text check (billing_cycle in ('MONTHLY', 'ANNUAL')),
  add column category text,
  add column description text,
  add column destination text,
  add column admin_note text,
  add column processed_by uuid references auth.users(id) on delete set null,
  add column processed_at timestamptz;
create index transactions_type_status_idx on public.transactions(type, status);

-- HR sees company-related operations only — never employees' personal
-- recharges or withdrawals (strict tenant + privacy isolation).
drop policy if exists "transactions: read" on public.transactions;
create policy "transactions: read" on public.transactions for select to authenticated
  using (user_id = (select auth.uid())
         or ((select public.my_role()) = 'HR_ADMIN'
             and company_id = (select public.my_company_id())
             and type in ('REDEMPTION', 'ALLOCATION', 'COMPANY_TOPUP', 'SUBSCRIPTION'))
         or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Redemptions: bill amount, wallet payment
-- ---------------------------------------------------------------------------
alter table public.redemptions
  add column bill_amount numeric,
  add column bill_currency text,
  add column bill_amount_usd numeric,
  add column net_amount_usd numeric,
  add column wallet_payment_authorized boolean not null default false,
  add column paid_with_wallet boolean not null default false;

-- ---------------------------------------------------------------------------
-- Internal: activate / extend a subscription after payment
-- ---------------------------------------------------------------------------
create or replace function public._activate_subscription(
  p_user_id uuid, p_plan_code text, p_cycle text, p_amount_usd numeric, p_psp text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pl public.plans%rowtype;
  pr public.profiles%rowtype;
  v_company uuid;
  v_merchant uuid;
  v_current timestamptz;
  v_expires timestamptz;
  v_sub uuid;
  v_bonus numeric;
  v_interval interval := case when p_cycle = 'ANNUAL' then interval '12 months' else interval '1 month' end;
begin
  select * into pl from public.plans where code = p_plan_code;
  if not found then raise exception 'Plan inconnu: %', p_plan_code; end if;
  select * into pr from public.profiles where id = p_user_id;

  if pl.audience = 'B2B' then
    v_company := pr.company_id;
    if v_company is null then raise exception 'Aucune entreprise liée au compte'; end if;
    select max(expires_at) into v_current from public.subscriptions
     where company_id = v_company and status = 'ACTIVE';
  elsif pl.audience = 'MERCHANT' then
    v_merchant := pr.merchant_id;
    if v_merchant is null then raise exception 'Aucune marque liée au compte'; end if;
    select max(expires_at) into v_current from public.subscriptions
     where merchant_id = v_merchant and status = 'ACTIVE';
  else
    select max(expires_at) into v_current from public.subscriptions
     where user_id = p_user_id and company_id is null and merchant_id is null and status = 'ACTIVE';
  end if;

  v_expires := greatest(coalesce(v_current, now()), now()) + v_interval;

  -- Older active rows are superseded by the new period.
  update public.subscriptions set status = 'CANCELLED'
   where status = 'ACTIVE'
     and ((v_company is not null and company_id = v_company)
       or (v_merchant is not null and merchant_id = v_merchant)
       or (v_company is null and v_merchant is null and user_id = p_user_id and company_id is null and merchant_id is null));

  insert into public.subscriptions (user_id, company_id, merchant_id, plan_type, billing_cycle, psp_used, status,
                                    amount, currency, amount_usd, expires_at, created_by_id)
  values (case when v_company is null and v_merchant is null then p_user_id end, v_company, v_merchant,
          pl.code, p_cycle, upper(p_psp), 'ACTIVE', p_amount_usd, 'USD', p_amount_usd, v_expires, p_user_id)
  returning id into v_sub;

  if v_company is not null then
    update public.companies
       set plan_tier = pl.code, billing_cycle = p_cycle, subscription_status = 'ACTIVE',
           max_employees = coalesce(pl.max_employees, 100000)
     where id = v_company;
  end if;

  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (p_user_id, 'SYSTEM', 'Abonnement activé',
          pl.name || ' actif jusqu''au ' || to_char(v_expires, 'DD/MM/YYYY') || '.', '/billing-settings', p_user_id);

  -- Referral bonus on the first paid B2C subscription of a referred member.
  if pl.audience = 'B2C' and pr.referred_by is not null and not pr.referral_rewarded and p_amount_usd > 0 then
    v_bonus := public.setting_numeric('referral_bonus_usd', 5);
    if v_bonus > 0 then
      update public.profiles set referral_rewarded = true where id = p_user_id;
      update public.profiles set wallet_balance = wallet_balance + v_bonus where id = pr.referred_by;
      insert into public.transactions (user_id, amount, amount_usd, currency, type, status, description, created_by_id)
      values (pr.referred_by, v_bonus, v_bonus, 'USD', 'REFERRAL_BONUS', 'COMPLETED', 'Bonus de parrainage', pr.referred_by);
      insert into public.notifications (user_id, type, title, body, link, created_by_id)
      values (pr.referred_by, 'REWARD', 'Bonus de parrainage',
              'Votre filleul s''est abonné : ' || v_bonus || ' USD crédités sur votre wallet.', '/referral-program', pr.referred_by);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'subscription_id', v_sub, 'expires_at', v_expires, 'plan', pl.code);
end $$;

-- ---------------------------------------------------------------------------
-- Confirm a PSP payment exactly once (replaces complete_recharge)
-- ---------------------------------------------------------------------------
drop function if exists public.complete_recharge(text);

create or replace function public.complete_payment(p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.transactions%rowtype;
  v_usd numeric;
  v_balance numeric;
  v_extra jsonb := '{}'::jsonb;
begin
  select * into t from public.transactions where psp_reference = p_reference for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Transaction introuvable'); end if;
  if t.status = 'COMPLETED' then
    return jsonb_build_object('ok', true, 'status', 'already_completed', 'type', t.type, 'transactionId', t.id);
  end if;
  if t.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'error', 'Transaction non éligible (' || t.status || ')');
  end if;

  v_usd := coalesce(t.amount_usd, public.to_usd(t.amount, t.currency));
  update public.transactions set status = 'COMPLETED', amount_usd = v_usd where id = t.id;

  if t.type = 'RECHARGE' then
    update public.profiles set wallet_balance = wallet_balance + v_usd where id = t.user_id
    returning wallet_balance into v_balance;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Recharge confirmée',
            'Votre wallet a été rechargé de ' || t.amount || ' ' || t.currency || '.', '/wallet-activity', t.user_id);
  elsif t.type = 'COMPANY_TOPUP' then
    update public.companies set wallet_balance = wallet_balance + v_usd where id = t.company_id
    returning wallet_balance into v_balance;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Wallet entreprise crédité',
            t.amount || ' ' || t.currency || ' ajoutés au budget avantages.', '/hr?section=benefits', t.user_id);
  elsif t.type = 'SUBSCRIPTION' then
    v_extra := public._activate_subscription(t.user_id, t.plan_code, coalesce(t.billing_cycle, 'MONTHLY'), v_usd,
                                             split_part(t.psp_reference, '-', 2));
  else
    raise exception 'Type de paiement non pris en charge: %', t.type;
  end if;

  return jsonb_build_object('ok', true, 'status', 'completed', 'type', t.type, 'balance', v_balance,
                            'amount', t.amount, 'currency', t.currency, 'amount_usd', v_usd,
                            'transactionId', t.id) || v_extra;
end $$;

-- ---------------------------------------------------------------------------
-- Pay a subscription from a wallet (member wallet, or company wallet for HR)
-- ---------------------------------------------------------------------------
create or replace function public.subscribe_with_wallet(p_plan_code text, p_cycle text default 'MONTHLY')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  pl public.plans%rowtype;
  pr public.profiles%rowtype;
  v_price numeric;
  v_res jsonb;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found then raise exception 'Non connecté' using errcode = '42501'; end if;
  select * into pl from public.plans where code = p_plan_code and active;
  if not found then raise exception 'Plan indisponible'; end if;
  if p_cycle not in ('MONTHLY', 'ANNUAL') then raise exception 'Cycle invalide'; end if;
  v_price := case when p_cycle = 'ANNUAL' then pl.price_annual else pl.price_monthly end;

  if pl.audience = 'B2B' then
    if pr.role <> 'HR_ADMIN' or pr.company_id is null then
      raise exception 'Seul un administrateur RH peut abonner son entreprise' using errcode = '42501';
    end if;
    update public.companies set wallet_balance = wallet_balance - v_price
     where id = pr.company_id and wallet_balance >= v_price;
    if not found then return jsonb_build_object('ok', false, 'error', 'Solde du wallet entreprise insuffisant'); end if;
  elsif pl.audience = 'MERCHANT' then
    if pr.merchant_id is null then raise exception 'Aucune marque liée au compte' using errcode = '42501'; end if;
    update public.profiles set wallet_balance = wallet_balance - v_price
     where id = pr.id and wallet_balance >= v_price;
    if not found then return jsonb_build_object('ok', false, 'error', 'Solde wallet insuffisant'); end if;
  else
    update public.profiles set wallet_balance = wallet_balance - v_price
     where id = pr.id and wallet_balance >= v_price;
    if not found then return jsonb_build_object('ok', false, 'error', 'Solde wallet insuffisant'); end if;
  end if;

  insert into public.transactions (user_id, company_id, amount, amount_usd, currency, payment_method, type, status,
                                   plan_code, billing_cycle, description, created_by_id)
  values (pr.id, case when pl.audience = 'B2B' then pr.company_id end, v_price, v_price, 'USD', 'WALLET',
          'SUBSCRIPTION', 'COMPLETED', pl.code, p_cycle, 'Abonnement ' || pl.name, pr.id);

  v_res := public._activate_subscription(pr.id, pl.code, p_cycle, v_price, 'WALLET');
  return v_res;
end $$;

-- Stop renewal at the end of the current period (no automatic renewals are
-- charged; the flag documents the member's intent and hides the renew CTA).
create or replace function public.cancel_subscription(p_subscription_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.subscriptions%rowtype;
begin
  select * into s from public.subscriptions where id = p_subscription_id;
  if not found then raise exception 'Abonnement introuvable'; end if;
  if not (s.user_id = auth.uid()
          or (s.company_id is not null and s.company_id = public.my_company_id() and public.my_role() = 'HR_ADMIN')
          or (s.merchant_id is not null and s.merchant_id = public.my_merchant_id())
          or public.is_admin()) then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  update public.subscriptions set cancel_at_period_end = true where id = s.id;
end $$;

-- ---------------------------------------------------------------------------
-- Merchant code validation with the real bill amount (replaces v1)
-- ---------------------------------------------------------------------------
drop function if exists public.redeem_code(text, uuid);

create or replace function public.redeem_code(
  p_code text, p_merchant_id uuid, p_bill_amount numeric, p_bill_currency text default 'USD',
  p_pay_with_wallet boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r public.redemptions%rowtype;
  o public.offers%rowtype;
  v_bill_usd numeric;
  v_discount numeric;
  v_net numeric;
  v_rate numeric;
  v_cashback numeric;
begin
  if p_bill_amount is null or p_bill_amount <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'AMOUNT_REQUIRED');
  end if;
  v_bill_usd := public.to_usd(p_bill_amount, p_bill_currency);

  select * into r from public.redemptions where code_used = upper(btrim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'INVALID'); end if;
  if r.status = 'REDEEMED' then return jsonb_build_object('ok', false, 'reason', 'ALREADY_USED'); end if;
  if r.status in ('EXPIRED', 'INVALID') or (r.expires_at is not null and r.expires_at < now()) then
    if r.status = 'GENERATED' then update public.redemptions set status = 'EXPIRED' where id = r.id; end if;
    return jsonb_build_object('ok', false, 'reason', 'EXPIRED');
  end if;

  select * into o from public.offers where id = r.offer_id;
  if not found or o.merchant_id is distinct from p_merchant_id then
    return jsonb_build_object('ok', false, 'reason', 'INVALID');
  end if;

  -- Discount on the bill (USD). Offer values are expressed in USD / percent.
  v_discount := case o.discount_type
    when 'PERCENTAGE' then v_bill_usd * least(greatest(coalesce(o.discount_value, 0), 0), 100) / 100
    when 'FIXED' then least(greatest(coalesce(o.discount_value, 0), 0), v_bill_usd)
    when 'BOGO' then case when coalesce(o.discount_value, 0) > 0
                          then least(o.discount_value, v_bill_usd / 2) else v_bill_usd / 2 end
    else 0 end;
  v_discount := round(v_discount, 2);
  v_net := round(v_bill_usd - v_discount, 2);
  v_rate := case when o.discount_type = 'CASHBACK'
                 then greatest(coalesce(o.cashback_rate, 0), coalesce(o.discount_value, 0))
                 else coalesce(o.cashback_rate, 0) end;
  v_cashback := round(v_net * least(greatest(v_rate, 0), 100) / 100, 2);

  if p_pay_with_wallet then
    if not r.wallet_payment_authorized then
      return jsonb_build_object('ok', false, 'reason', 'WALLET_NOT_AUTHORIZED');
    end if;
    update public.profiles set wallet_balance = wallet_balance - v_net
     where id = r.user_id and wallet_balance >= v_net;
    if not found then return jsonb_build_object('ok', false, 'reason', 'INSUFFICIENT_FUNDS'); end if;
    update public.merchants set payout_balance = payout_balance + v_net where id = p_merchant_id;
  end if;

  update public.redemptions
     set status = 'REDEEMED', redeemed_at = now(),
         bill_amount = p_bill_amount, bill_currency = upper(coalesce(p_bill_currency, 'USD')),
         bill_amount_usd = v_bill_usd, net_amount_usd = v_net,
         discount_applied = v_discount, cashback_credited = v_cashback,
         paid_with_wallet = coalesce(p_pay_with_wallet, false)
   where id = r.id;

  if v_cashback > 0 then
    update public.profiles set wallet_balance = wallet_balance + v_cashback where id = r.user_id;
  end if;

  insert into public.transactions (user_id, company_id, merchant_id, offer_id, amount, amount_usd, cashback_amount,
                                   savings_usd, currency, payment_method, type, status, category, description, created_by_id)
  values (r.user_id, r.company_id, p_merchant_id, o.id, v_net, v_net, v_cashback, v_discount, 'USD',
          case when p_pay_with_wallet then 'WALLET' end, 'REDEMPTION', 'COMPLETED', o.category, o.title, r.user_id);

  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (r.user_id, case when v_cashback > 0 then 'CASHBACK' else 'REDEMPTION' end,
          case when v_cashback > 0 then 'Cashback crédité' else 'Offre utilisée' end,
          '« ' || o.title || ' » : ' || v_discount || ' USD économisés' ||
          case when v_cashback > 0 then ', ' || v_cashback || ' USD de cashback' else '' end ||
          case when p_pay_with_wallet then ', ' || v_net || ' USD payés avec le wallet' else '' end || '.',
          '/wallet-activity', r.user_id);

  if r.company_id is not null then
    update public.companies set total_saved = total_saved + v_discount + v_cashback where id = r.company_id;
  end if;

  return jsonb_build_object('ok', true, 'code', r.code_used, 'offer_title', o.title,
                            'bill_usd', v_bill_usd, 'discount_applied', v_discount, 'net_usd', v_net,
                            'cashback_credited', v_cashback, 'paid_with_wallet', coalesce(p_pay_with_wallet, false));
end $$;

-- ---------------------------------------------------------------------------
-- Member withdrawals: funds are reserved immediately, paid out by an admin
-- (replaces v1 which marked them completed without any payout).
-- ---------------------------------------------------------------------------
drop function if exists public.withdraw_from_wallet(uuid, numeric, text, text, text);

create or replace function public.withdraw_from_wallet(
  p_user_id uuid, p_amount numeric, p_currency text, p_method text, p_destination text, p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_usd numeric;
  v_balance numeric;
  v_company uuid;
  v_tx uuid;
begin
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('ok', false, 'error', 'Montant invalide'); end if;
  v_usd := public.to_usd(p_amount, p_currency);
  update public.profiles set wallet_balance = wallet_balance - v_usd
   where id = p_user_id and wallet_balance >= v_usd
   returning wallet_balance, company_id into v_balance, v_company;
  if not found then return jsonb_build_object('ok', false, 'error', 'Solde insuffisant'); end if;
  insert into public.transactions (user_id, company_id, amount, amount_usd, currency, psp_reference, payment_method,
                                   type, status, destination, description, created_by_id)
  values (p_user_id, v_company, p_amount, v_usd, upper(p_currency), p_reference, p_method,
          'WITHDRAWAL', 'PENDING', p_destination, 'Retrait vers ' || p_destination, p_user_id)
  returning id into v_tx;
  return jsonb_build_object('ok', true, 'balance', v_balance, 'transactionId', v_tx, 'amount_usd', v_usd);
end $$;

create or replace function public.admin_process_withdrawal(p_tx_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.transactions%rowtype;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into t from public.transactions where id = p_tx_id and type = 'WITHDRAWAL' for update;
  if not found or t.status <> 'PENDING' then raise exception 'Retrait introuvable ou déjà traité'; end if;
  if p_approve then
    update public.transactions set status = 'COMPLETED', admin_note = p_note, processed_by = auth.uid(), processed_at = now()
     where id = t.id;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'SYSTEM', 'Retrait effectué', t.amount || ' ' || t.currency || ' envoyés vers ' || coalesce(t.destination, 'votre compte') || '.', '/wallet-activity', t.user_id);
  else
    update public.transactions set status = 'CANCELLED', admin_note = p_note, processed_by = auth.uid(), processed_at = now()
     where id = t.id;
    update public.profiles set wallet_balance = wallet_balance + t.amount_usd where id = t.user_id;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'ALERT', 'Retrait refusé', 'Le montant a été recrédité sur votre wallet.' ||
            coalesce(' Motif : ' || p_note, ''), '/wallet-activity', t.user_id);
  end if;
  perform public.audit(case when p_approve then 'withdrawal.approve' else 'withdrawal.reject' end, 'transactions', t.id::text,
                       jsonb_build_object('amount_usd', t.amount_usd, 'note', p_note));
end $$;

-- ---------------------------------------------------------------------------
-- Merchant payouts
-- ---------------------------------------------------------------------------
create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null default auth.uid(),
  amount_usd numeric not null check (amount_usd > 0),
  method text not null check (method in ('MOBILE_MONEY', 'BANK_TRANSFER')),
  destination text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'REJECTED')),
  admin_note text,
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index payout_requests_merchant_idx on public.payout_requests(merchant_id, created_date desc);
create trigger set_updated_date before update on public.payout_requests
  for each row execute function public.set_updated_date();
alter table public.payout_requests enable row level security;
create policy "payout_requests: read" on public.payout_requests for select to authenticated
  using (merchant_id = (select public.my_merchant_id()) or (select public.is_admin()));

create or replace function public.merchant_request_payout(p_amount_usd numeric, p_method text, p_destination text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_merchant uuid := public.my_merchant_id();
  v_id uuid;
begin
  if v_merchant is null then raise exception 'Compte marchand requis' using errcode = '42501'; end if;
  if p_amount_usd is null or p_amount_usd <= 0 then raise exception 'Montant invalide'; end if;
  if p_method not in ('MOBILE_MONEY', 'BANK_TRANSFER') then raise exception 'Méthode invalide'; end if;
  if coalesce(btrim(p_destination), '') = '' then raise exception 'Destination requise'; end if;
  update public.merchants set payout_balance = payout_balance - p_amount_usd
   where id = v_merchant and verified_status = 'VERIFIED' and payout_balance >= p_amount_usd;
  if not found then raise exception 'Solde de paiement insuffisant'; end if;
  insert into public.payout_requests (merchant_id, requested_by, amount_usd, method, destination)
  values (v_merchant, auth.uid(), round(p_amount_usd, 2), p_method, left(btrim(p_destination), 120))
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.admin_process_payout(p_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare p public.payout_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  select * into p from public.payout_requests where id = p_id for update;
  if not found or p.status <> 'PENDING' then raise exception 'Demande introuvable ou déjà traitée'; end if;
  update public.payout_requests
     set status = case when p_approve then 'PAID' else 'REJECTED' end,
         admin_note = p_note, processed_by = auth.uid(), processed_at = now()
   where id = p.id;
  if p_approve then
    if p.requested_by is not null then
      insert into public.transactions (user_id, merchant_id, amount, amount_usd, currency, payment_method, type, status,
                                       destination, description, processed_by, processed_at, created_by_id)
      values (p.requested_by, p.merchant_id, p.amount_usd, p.amount_usd, 'USD', p.method, 'PAYOUT', 'COMPLETED',
              p.destination, 'Paiement marchand', auth.uid(), now(), p.requested_by);
    end if;
  else
    update public.merchants set payout_balance = payout_balance + p.amount_usd where id = p.merchant_id;
  end if;
  if p.requested_by is not null then
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (p.requested_by, case when p_approve then 'SYSTEM' else 'ALERT' end,
            case when p_approve then 'Paiement envoyé' else 'Demande de paiement refusée' end,
            p.amount_usd || ' USD' || case when p_approve then ' envoyés vers ' || p.destination
                                           else ' recrédités sur votre solde.' || coalesce(' Motif : ' || p_note, '') end,
            '/merchant-dashboard?section=payout', p.requested_by);
  end if;
  perform public.audit(case when p_approve then 'payout.approve' else 'payout.reject' end, 'payout_requests', p.id::text,
                       jsonb_build_object('amount_usd', p.amount_usd, 'note', p_note));
end $$;

-- ---------------------------------------------------------------------------
-- Invite codes: enforce company seats (replaces v1)
-- ---------------------------------------------------------------------------
create or replace function public.consume_invite_code(p_code_id uuid, p_user_id uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  i public.invite_codes%rowtype;
  c public.companies%rowtype;
begin
  select * into i from public.invite_codes where id = p_code_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Invalid invite code'); end if;
  if i.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'error', 'This invite code is no longer available');
  end if;
  if i.expires_at is not null and i.expires_at < now() then
    update public.invite_codes set status = 'EXPIRED' where id = i.id;
    return jsonb_build_object('ok', false, 'error', 'This invite code has expired');
  end if;
  if i.target_email is not null and i.target_email <> ''
     and lower(i.target_email) <> lower(coalesce(p_email, '')) then
    return jsonb_build_object('ok', false, 'error', 'This invite code is not for your account');
  end if;
  select * into c from public.companies where id = i.company_id for update;
  if c.max_employees is not null and c.seats_used >= c.max_employees then
    return jsonb_build_object('ok', false, 'error', 'Plus aucun siège disponible : votre RH doit passer à un plan supérieur.');
  end if;

  update public.profiles
     set company_id = i.company_id, role = i.role, account_type = 'entreprise'
   where id = p_user_id and role not in ('SUPER_ADMIN', 'admin');
  update public.invite_codes set status = 'USED', redeemed_by_id = p_user_id where id = i.id;
  update public.companies set seats_used = seats_used + 1 where id = i.company_id;

  return jsonb_build_object('ok', true, 'company_id', i.company_id, 'role', i.role);
end $$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
revoke execute on function public._activate_subscription(uuid, text, text, numeric, text) from public, anon, authenticated;
revoke execute on function public.complete_payment(text) from public, anon, authenticated;
revoke execute on function public.redeem_code(text, uuid, numeric, text, boolean) from public, anon, authenticated;
revoke execute on function public.withdraw_from_wallet(uuid, numeric, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.consume_invite_code(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_payment(text) to service_role;
grant execute on function public.redeem_code(text, uuid, numeric, text, boolean) to service_role;
grant execute on function public.withdraw_from_wallet(uuid, numeric, text, text, text, text) to service_role;
grant execute on function public.consume_invite_code(uuid, uuid, text) to service_role;

revoke execute on function public.subscribe_with_wallet(text, text) from public, anon;
revoke execute on function public.cancel_subscription(uuid) from public, anon;
revoke execute on function public.admin_process_withdrawal(uuid, boolean, text) from public, anon;
revoke execute on function public.merchant_request_payout(numeric, text, text) from public, anon;
revoke execute on function public.admin_process_payout(uuid, boolean, text) from public, anon;
grant execute on function public.subscribe_with_wallet(text, text) to authenticated;
grant execute on function public.cancel_subscription(uuid) to authenticated;
grant execute on function public.admin_process_withdrawal(uuid, boolean, text) to authenticated;
grant execute on function public.merchant_request_payout(numeric, text, text) to authenticated;
grant execute on function public.admin_process_payout(uuid, boolean, text) to authenticated;
