-- Wallet economics (all rates editable by super admins in Admin → Money rules):
--  * Top-up bonus by USD tier, credited to a SPEND-ONLY balance (profiles.bonus_balance, a part of wallet_balance).
--  * Commission (default 1%) on every wallet purchase at a merchant, taken from the merchant's receipt.
--  * Customer withdrawal: platform fee (default 5%) + PSP fee (% + fixed), only on the withdrawable cash part.
--  * Cashback / referral / HR allocations are spend-only too (setting promo_credits_spend_only).
-- Order of spending: cash first, bonus last (bonus_balance is clamped to wallet_balance on every update).

alter table public.profiles add column if not exists bonus_balance numeric not null default 0 check (bonus_balance >= 0);
alter table public.transactions add column if not exists bonus_usd numeric not null default 0,
  add column if not exists fee_usd numeric not null default 0,
  add column if not exists commission_usd numeric not null default 0;
alter table public.redemptions add column if not exists commission_usd numeric not null default 0;
alter table public.payout_requests add column if not exists fee_usd numeric not null default 0;

insert into public.platform_settings (key, value, description) values
  ('topup_bonus_enabled', '1', 'Top-up bonus on/off (1/0)'),
  ('commission_pct', '1', 'Commission % on wallet purchases at merchants'),
  ('withdrawal_fee_pct', '5', 'Platform fee % on customer withdrawals'),
  ('withdrawal_psp_fee_pct', '0', 'PSP fee % passed on to customer withdrawals'),
  ('withdrawal_psp_fee_fixed_usd', '0', 'PSP fixed fee (USD) passed on to customer withdrawals'),
  ('withdrawal_min_usd', '10', 'Minimum customer withdrawal (USD)'),
  ('promo_credits_spend_only', '1', 'Cashback, referral bonus and HR allocations are spend-only (1/0)'),
  ('payout_enabled', '1', 'Merchant payout requests on/off (1/0)'),
  ('payout_min_usd', '20', 'Minimum merchant payout (USD)'),
  ('payout_max_usd', '5000', 'Maximum merchant payout per request (USD)'),
  ('payout_basic_monthly_limit', '1', 'Payout requests per month, Merchant Basic (0 = unlimited)'),
  ('payout_pro_monthly_limit', '0', 'Payout requests per month, Merchant Pro (0 = unlimited)'),
  ('payout_sla_days', '3', 'Days announced to merchants to receive a payout'),
  ('payout_fee_pct', '0', 'Fee % deducted from merchant payouts')
on conflict (key) do nothing;

create table if not exists public.topup_bonus_tiers (
  id uuid primary key default gen_random_uuid(),
  min_usd numeric not null unique check (min_usd > 0 and min_usd <= 100000),
  bonus_type text not null check (bonus_type in ('FIXED','PERCENT')),
  bonus_value numeric not null check (bonus_value >= 0),
  active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  check ((bonus_type = 'FIXED' and bonus_value <= 1000) or (bonus_type = 'PERCENT' and bonus_value <= 50))
);
alter table public.topup_bonus_tiers enable row level security;
drop policy if exists topup_bonus_tiers_read on public.topup_bonus_tiers;
create policy topup_bonus_tiers_read on public.topup_bonus_tiers for select to authenticated
  using (active or (select public.is_admin()));

-- Protect the new balance exactly like wallet_balance.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('SUPER_ADMIN', 'admin') and old.role is distinct from new.role
     and not exists (select 1 from public.platform_admins where email = lower(new.email)) then
    raise exception 'Le rôle super admin se gère depuis la liste des super admins' using errcode = '42501';
  end if;
  if new.role = 'STAFF' and old.role is distinct from new.role
     and not exists (select 1 from public.staff_members where email = lower(new.email)) then
    raise exception 'Le rôle agent se gère depuis la liste du personnel' using errcode = '42501';
  end if;
  if public.is_privileged_session() then
    return new;
  end if;
  if public.is_admin() then
    if new.wallet_balance is distinct from old.wallet_balance or new.bonus_balance is distinct from old.bonus_balance then
      raise exception 'Le solde wallet ne se modifie que par des opérations tracées' using errcode = '42501';
    end if;
    return new;
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.role is distinct from old.role
     or new.account_type is distinct from old.account_type
     or new.company_id is distinct from old.company_id
     or new.merchant_id is distinct from old.merchant_id
     or new.wallet_balance is distinct from old.wallet_balance
     or new.bonus_balance is distinct from old.bonus_balance
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.referral_rewarded is distinct from old.referral_rewarded
     or new.department is distinct from old.department
     or new.created_date is distinct from old.created_date
     or (old.onboarded and not new.onboarded) then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- The spend-only part can never exceed the wallet: spending reaches into it only once the cash is gone.
create or replace function public.profiles_bonus_clamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.bonus_balance := greatest(0, least(new.bonus_balance, new.wallet_balance));
  return new;
end $$;
drop trigger if exists profiles_bonus_clamp on public.profiles;
create trigger profiles_bonus_clamp before update of wallet_balance, bonus_balance on public.profiles
  for each row execute function public.profiles_bonus_clamp();

create or replace function public._promo_spend_only() returns boolean
language sql stable security definer set search_path = '' as $$ select public.setting_numeric('promo_credits_spend_only', 1) > 0 $$;

create or replace function public._credit_wallet(p_user uuid, p_amount numeric, p_spend_only boolean) returns numeric
language plpgsql security definer set search_path = '' as $$
declare v numeric;
begin
  if p_amount is null or p_amount <= 0 then return null; end if;
  update public.profiles set wallet_balance = wallet_balance + p_amount,
         bonus_balance = bonus_balance + case when p_spend_only then p_amount else 0 end
   where id = p_user returning wallet_balance into v;
  return v;
end $$;

create or replace function public.topup_bonus_for(p_usd numeric) returns numeric
language sql stable security definer set search_path = '' as $$
  select case when public.setting_numeric('topup_bonus_enabled', 1) <= 0 or p_usd is null then 0
    else coalesce((select case bonus_type when 'FIXED' then bonus_value else round(p_usd * bonus_value / 100, 2) end
                     from public.topup_bonus_tiers where active and min_usd <= p_usd order by min_usd desc limit 1), 0) end
$$;

create or replace function public._withdrawal_fees(p_usd numeric, out platform_fee numeric, out psp_fee numeric)
language sql stable security definer set search_path = '' as $$
  select round(p_usd * least(greatest(public.setting_numeric('withdrawal_fee_pct', 5), 0), 100) / 100, 2),
         round(p_usd * greatest(public.setting_numeric('withdrawal_psp_fee_pct', 0), 0) / 100
               + greatest(public.setting_numeric('withdrawal_psp_fee_fixed_usd', 0), 0), 2)
$$;

-- Top-up now credits the bonus too.
create or replace function public.complete_payment(p_reference text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  t public.transactions%rowtype;
  v_usd numeric; v_balance numeric; v_bonus numeric := 0;
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
    v_bonus := public.topup_bonus_for(v_usd);
    update public.profiles set wallet_balance = wallet_balance + v_usd + v_bonus, bonus_balance = bonus_balance + v_bonus
     where id = t.user_id returning wallet_balance into v_balance;
    if v_bonus > 0 then update public.transactions set bonus_usd = v_bonus where id = t.id; end if;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Recharge confirmée',
            'Votre wallet a été rechargé de ' || t.amount || ' ' || t.currency || '.' ||
            case when v_bonus > 0 then ' Bonus offert : ' || v_bonus || ' USD (utilisable pour vos achats).' else '' end,
            '/wallet-activity', t.user_id);
  elsif t.type = 'COMPANY_TOPUP' then
    update public.companies set wallet_balance = wallet_balance + v_usd where id = t.company_id
    returning wallet_balance into v_balance;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (t.user_id, 'RECHARGE', 'Wallet entreprise crédité',
            t.amount || ' ' || t.currency || ' ajoutés au budget avantages.', '/hr?section=benefits', t.user_id);
  elsif t.type = 'SUBSCRIPTION' then
    v_extra := public._activate_subscription(t.user_id, t.plan_code, coalesce(t.billing_cycle, 'MONTHLY'), v_usd,
                                             split_part(t.psp_reference, '-', 2));
  elsif t.type = 'GIFT' then
    v_extra := public._issue_gift(t.id);
  elsif t.type = 'PROMOTION' then
    v_extra := public._activate_promo(t.id);
  else
    raise exception 'Type de paiement non pris en charge: %', t.type;
  end if;

  return jsonb_build_object('ok', true, 'status', 'completed', 'type', t.type, 'balance', v_balance,
                            'amount', t.amount, 'currency', t.currency, 'amount_usd', v_usd, 'bonus_usd', v_bonus,
                            'transactionId', t.id) || v_extra;
end $$;

-- Purchase with the wallet: commission taken from the merchant's receipt; cashback may be spend-only.
create or replace function public.redeem_code(p_code text, p_merchant_id uuid, p_bill_amount numeric,
  p_bill_currency text default 'USD', p_pay_with_wallet boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.redemptions%rowtype;
  o public.offers%rowtype;
  v_bill_usd numeric; v_discount numeric; v_net numeric; v_rate numeric;
  v_cashback numeric; v_cap numeric; v_today numeric; v_commission numeric := 0;
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

  if o.usage_limit is not null and public.offer_uses(r.user_id, o.id, o.usage_period) >= o.usage_limit then
    update public.redemptions set status = 'INVALID' where id = r.id;
    return jsonb_build_object('ok', false, 'reason', 'LIMIT_REACHED', 'limit', o.usage_limit, 'period', o.usage_period);
  end if;

  v_discount := case o.discount_type
    when 'PERCENTAGE' then v_bill_usd * least(greatest(coalesce(o.discount_value, 0), 0), 100) / 100
    when 'FIXED' then least(greatest(coalesce(o.discount_value, 0), 0), v_bill_usd)
    when 'PERK' then least(greatest(coalesce(o.discount_value, 0), 0), v_bill_usd)
    else 0 end;
  v_discount := round(v_discount, 2);
  v_net := round(v_bill_usd - v_discount, 2);
  v_rate := case when o.discount_type = 'CASHBACK'
                 then greatest(coalesce(o.cashback_rate, 0), coalesce(o.discount_value, 0))
                 else coalesce(o.cashback_rate, 0) end;
  v_cashback := round(v_net * least(greatest(v_rate, 0), 100) / 100, 2);

  v_cap := public.setting_numeric('cashback_daily_cap_usd', 100);
  select coalesce(sum(cashback_credited), 0) into v_today from public.redemptions
   where user_id = r.user_id and status = 'REDEEMED' and redeemed_at > now() - interval '24 hours';
  v_cashback := round(least(v_cashback, greatest(v_cap - v_today, 0)), 2);

  if p_pay_with_wallet then
    if not r.wallet_payment_authorized then
      return jsonb_build_object('ok', false, 'reason', 'WALLET_NOT_AUTHORIZED');
    end if;
    update public.profiles set wallet_balance = wallet_balance - v_net
     where id = r.user_id and wallet_balance >= v_net;
    if not found then return jsonb_build_object('ok', false, 'reason', 'INSUFFICIENT_FUNDS'); end if;
    v_commission := round(v_net * least(greatest(public.setting_numeric('commission_pct', 1), 0), 100) / 100, 2);
    update public.merchants set payout_balance = payout_balance + (v_net - v_commission) where id = p_merchant_id;
  end if;

  update public.redemptions
     set status = 'REDEEMED', redeemed_at = now(),
         bill_amount = p_bill_amount, bill_currency = upper(coalesce(p_bill_currency, 'USD')),
         bill_amount_usd = v_bill_usd, net_amount_usd = v_net,
         discount_applied = v_discount, cashback_credited = v_cashback,
         paid_with_wallet = coalesce(p_pay_with_wallet, false), commission_usd = v_commission
   where id = r.id;

  if v_cashback > 0 then
    perform public._credit_wallet(r.user_id, v_cashback, public._promo_spend_only());
  end if;

  insert into public.transactions (user_id, company_id, merchant_id, offer_id, amount, amount_usd, cashback_amount,
                                   savings_usd, commission_usd, currency, payment_method, type, status, category, description, created_by_id)
  values (r.user_id, r.company_id, p_merchant_id, o.id, v_net, v_net, v_cashback, v_discount, v_commission, 'USD',
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
                            'commission_usd', v_commission, 'merchant_receives_usd', v_net - v_commission,
                            'cashback_credited', v_cashback, 'paid_with_wallet', coalesce(p_pay_with_wallet, false));
end $$;

-- Customer withdrawal: only the cash part, minus platform fee and PSP fees.
create or replace function public.withdraw_from_wallet(p_user_id uuid, p_amount numeric, p_currency text,
  p_method text, p_destination text, p_reference text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_usd numeric; v_balance numeric; v_company uuid; v_tx uuid;
  v_min numeric := public.setting_numeric('withdrawal_min_usd', 10);
  v_pf numeric; v_psp numeric; v_fee numeric;
begin
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('ok', false, 'error', 'Montant invalide'); end if;
  v_usd := public.to_usd(p_amount, p_currency);
  if v_usd < v_min then return jsonb_build_object('ok', false, 'error', 'Retrait minimum : ' || v_min || ' USD'); end if;
  select platform_fee, psp_fee into v_pf, v_psp from public._withdrawal_fees(v_usd);
  v_fee := v_pf + v_psp;
  if v_fee >= v_usd then return jsonb_build_object('ok', false, 'error', 'Montant trop faible pour couvrir les frais'); end if;
  update public.profiles set wallet_balance = wallet_balance - v_usd
   where id = p_user_id and wallet_balance - bonus_balance >= v_usd
   returning wallet_balance, company_id into v_balance, v_company;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Solde retirable insuffisant : les bonus et crédits offerts ne sont pas retirables');
  end if;
  insert into public.transactions (user_id, company_id, amount, amount_usd, fee_usd, currency, psp_reference, payment_method,
                                   type, status, destination, description, created_by_id)
  values (p_user_id, v_company, p_amount, v_usd, v_fee, upper(p_currency), p_reference, p_method,
          'WITHDRAWAL', 'PENDING', p_destination, 'Retrait vers ' || p_destination || ' (frais ' || v_fee || ' USD)', p_user_id)
  returning id into v_tx;
  return jsonb_build_object('ok', true, 'balance', v_balance, 'transactionId', v_tx, 'amount_usd', v_usd,
                            'fee_usd', v_fee, 'net_usd', v_usd - v_fee);
end $$;

-- Quote shown to the customer before confirming (also gives balances and rates).
create or replace function public.withdrawal_quote(p_amount_usd numeric default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  pr public.profiles%rowtype; v_min numeric := public.setting_numeric('withdrawal_min_usd', 10);
  v_pf numeric := 0; v_psp numeric := 0; v_withdrawable numeric; v_reason text;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found then raise exception 'Non connecté' using errcode = '42501'; end if;
  v_withdrawable := greatest(pr.wallet_balance - pr.bonus_balance, 0);
  if p_amount_usd is not null and p_amount_usd > 0 then
    select platform_fee, psp_fee into v_pf, v_psp from public._withdrawal_fees(p_amount_usd);
    if p_amount_usd < v_min then v_reason := 'MIN';
    elsif p_amount_usd > v_withdrawable then v_reason := 'BALANCE';
    elsif v_pf + v_psp >= p_amount_usd then v_reason := 'FEES'; end if;
  end if;
  return jsonb_build_object('total', pr.wallet_balance, 'bonus', pr.bonus_balance, 'withdrawable', v_withdrawable,
    'min', v_min, 'platform_fee_pct', public.setting_numeric('withdrawal_fee_pct', 5),
    'platform_fee', v_pf, 'psp_fee', v_psp, 'fee', v_pf + v_psp,
    'net', greatest(coalesce(p_amount_usd, 0) - v_pf - v_psp, 0), 'ok', v_reason is null and p_amount_usd is not null, 'reason', v_reason);
end $$;

-- Platform / employer funded credits follow the spend-only setting.
do $$
declare o oid; d text; n text;
begin
  select p.oid into o from pg_proc p where p.proname = '_activate_subscription' and p.pronamespace = 'public'::regnamespace;
  d := pg_get_functiondef(o);
  n := replace(d, 'update public.profiles set wallet_balance = wallet_balance + v_bonus where id = pr.referred_by;',
                  'perform public._credit_wallet(pr.referred_by, v_bonus, public._promo_spend_only());');
  if n = d then raise exception 'referral credit statement not found'; end if;
  execute n;
  select p.oid into o from pg_proc p where p.proname = 'hr_distribute_allowances' and p.pronamespace = 'public'::regnamespace;
  d := pg_get_functiondef(o);
  n := replace(d, 'update public.profiles set wallet_balance = wallet_balance + v_per_employee where id = e.id;',
                  'perform public._credit_wallet(e.id, v_per_employee, public._promo_spend_only());');
  if n = d then raise exception 'allowance credit statement not found'; end if;
  execute n;
  select p.oid into o from pg_proc p where p.proname = 'hr_allocate' and p.pronamespace = 'public'::regnamespace;
  d := pg_get_functiondef(o);
  n := replace(d, 'update public.profiles set wallet_balance = wallet_balance + p_amount_usd where id = p_user_id;',
                  'perform public._credit_wallet(p_user_id, p_amount_usd, public._promo_spend_only());');
  if n = d then raise exception 'allocation credit statement not found'; end if;
  execute n;
end $$;

-- Grants: internal helpers are not callable from the API.
revoke all on function public._promo_spend_only(), public._credit_wallet(uuid, numeric, boolean),
  public._withdrawal_fees(numeric), public.profiles_bonus_clamp() from public, anon, authenticated;
revoke all on function public.topup_bonus_for(numeric), public.withdrawal_quote(numeric) from public, anon;
grant execute on function public.topup_bonus_for(numeric), public.withdrawal_quote(numeric) to authenticated;
revoke all on function public.withdraw_from_wallet(uuid, numeric, text, text, text, text) from public, anon, authenticated;
grant execute on function public.withdraw_from_wallet(uuid, numeric, text, text, text, text) to service_role;
revoke all on function public.complete_payment(text) from public, anon, authenticated;
grant execute on function public.complete_payment(text) to service_role;
