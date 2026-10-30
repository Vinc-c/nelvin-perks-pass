-- Audit hardening (2026-10-30)

-- 1. created_date is protected (it gates the 7-day referral window).
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.role in ('SUPER_ADMIN', 'admin') and old.role is distinct from new.role
     and not exists (select 1 from public.platform_admins where email = lower(new.email)) then
    raise exception 'Le rôle super admin se gère depuis la liste des super admins' using errcode = '42501';
  end if;
  if public.is_privileged_session() then
    return new;
  end if;
  if public.is_admin() then
    if new.wallet_balance is distinct from old.wallet_balance then
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
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.referral_rewarded is distinct from old.referral_rewarded
     or new.department is distinct from old.department
     or new.created_date is distinct from old.created_date
     or (old.onboarded and not new.onboarded) then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $function$;

-- 2. Cap merchant-defined cashback (no uncapped wallet minting).
alter table public.offers
  add constraint offers_cashback_rate_cap check (cashback_rate is null or (cashback_rate >= 0 and cashback_rate <= 50)) not valid;

-- 3. PIN brute force: also limit failures per merchant (all users), not only per user.
create or replace function public.redeem_offer_with_pin(p_user_id uuid, p_offer_id uuid, p_pin text, p_bill_amount numeric, p_bill_currency text default 'USD'::text, p_pay_with_wallet boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  o public.offers%rowtype;
  v_code text;
  v_company uuid;
begin
  select * into o from public.offers where id = p_offer_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'INVALID'); end if;
  if not exists (select 1 from public.merchant_pins where merchant_id = o.merchant_id) then
    return jsonb_build_object('ok', false, 'reason', 'NO_PIN');
  end if;
  if (select count(*) from public.pin_attempts
       where user_id = p_user_id and merchant_id = o.merchant_id and created_date > now() - interval '15 minutes') >= 5 then
    return jsonb_build_object('ok', false, 'reason', 'TOO_MANY_ATTEMPTS');
  end if;
  -- Per-merchant ceiling across all accounts: 30 bad PINs per hour locks PIN redemption for that merchant.
  if (select count(*) from public.pin_attempts
       where merchant_id = o.merchant_id and created_date > now() - interval '1 hour') >= 30 then
    return jsonb_build_object('ok', false, 'reason', 'TOO_MANY_ATTEMPTS');
  end if;
  if not exists (select 1 from public.merchant_pins
                  where merchant_id = o.merchant_id and pin_hash = public._pin_hash(o.merchant_id, p_pin)) then
    insert into public.pin_attempts (user_id, merchant_id) values (p_user_id, o.merchant_id);
    return jsonb_build_object('ok', false, 'reason', 'BAD_PIN');
  end if;
  -- A merchant's own account cannot redeem its own offers (self-dealing).
  if exists (select 1 from public.profiles where id = p_user_id and merchant_id = o.merchant_id) then
    return jsonb_build_object('ok', false, 'reason', 'INVALID');
  end if;

  select company_id into v_company from public.profiles where id = p_user_id;
  v_code := 'PIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.redemptions (user_id, company_id, offer_id, merchant_id, code_used, code_type, status,
                                  expires_at, wallet_payment_authorized, created_by_id)
  values (p_user_id, v_company, o.id, o.merchant_id, v_code, 'PIN', 'GENERATED',
          now() + interval '2 minutes', coalesce(p_pay_with_wallet, false), p_user_id);
  return public.redeem_code(v_code, o.merchant_id, p_bill_amount, p_bill_currency, p_pay_with_wallet);
end $function$;

-- 4. Stale PENDING payments are closed by a job (polls no longer mark them FAILED).
create or replace function public.expire_stale_pending_payments()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare n integer;
begin
  update public.transactions
     set status = 'FAILED', admin_note = coalesce(admin_note || ' · ', '') || 'Expired: no payment confirmed within 48h'
   where status = 'PENDING' and type in ('RECHARGE','SUBSCRIPTION','COMPANY_TOPUP','GIFT')
     and created_date < now() - interval '48 hours';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.expire_stale_pending_payments() from public, anon, authenticated;
select cron.schedule('nelvin-expire-pending-payments', '17 * * * *', $$select public.expire_stale_pending_payments()$$);

-- 5. Invite-code consumption / PSP helper functions stay as-is; admin RPCs get a strict search_path.
alter function public.admin_list_individuals(text) set search_path to '';
alter function public.admin_individual_detail(uuid) set search_path to '';
