-- SECURITY FIX: guard_profile_update was SECURITY DEFINER, so is_privileged_session() (which tests current_user)
-- always saw the function owner (postgres) and every self-update passed, including wallet_balance.
-- Running it as the caller restores the protection. Role-change checks only matter for privileged writers.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if public.is_privileged_session() then
    return new;
  end if;
  if new.role in ('SUPER_ADMIN', 'admin') and old.role is distinct from new.role
     and not exists (select 1 from public.platform_admins where email = lower(new.email)) then
    raise exception 'Le rôle super admin se gère depuis la liste des super admins' using errcode = '42501';
  end if;
  if new.role = 'STAFF' and old.role is distinct from new.role
     and not exists (select 1 from public.staff_members where email = lower(new.email)) then
    raise exception 'Le rôle agent se gère depuis la liste du personnel' using errcode = '42501';
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
revoke all on function public.guard_profile_update() from public, anon;
