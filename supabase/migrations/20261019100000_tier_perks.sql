-- Tier-gated perks: an offer can require a membership level (Premium or VIP Gold).
-- Free / Basic members see the offer but cannot generate a code for it.
-- Company-sponsored employees count as Premium; family members inherit the
-- plan that covers them.

alter table public.offers
  add column if not exists required_plan text
  check (required_plan is null or required_plan in ('PASS_PREMIUM', 'PASS_VIP'));

create or replace function public.plan_rank(p_code text)
returns int language sql immutable set search_path = '' as $$
  select case p_code when 'PASS_BASIC' then 1 when 'PASS_PREMIUM' then 2 when 'PASS_VIP' then 3 else 0 end
$$;

-- Highest membership level a user currently enjoys (0 = free tier).
create or replace function public.member_plan_rank(p_user uuid)
returns int language plpgsql stable security definer set search_path = '' as $$
declare
  v_rank int := 0;
  v_company uuid;
  v_family jsonb;
begin
  v_rank := public.plan_rank((public.live_b2c_subscription(p_user)).plan_type);
  select company_id into v_company from public.profiles where id = p_user;
  if v_company is not null then v_rank := greatest(v_rank, 2); end if;
  v_family := public.family_coverage(p_user);
  if v_family is not null then v_rank := greatest(v_rank, public.plan_rank(v_family ->> 'plan')); end if;
  return v_rank;
end $$;
revoke execute on function public.member_plan_rank(uuid) from public, anon, authenticated;
grant execute on function public.member_plan_rank(uuid) to service_role;

-- Same value for the signed-in member (used by the UI to show locked perks).
create or replace function public.my_plan_rank()
returns int language sql stable security definer set search_path = '' as $$
  select public.member_plan_rank(auth.uid())
$$;
revoke execute on function public.my_plan_rank() from public, anon;
grant execute on function public.my_plan_rank() to authenticated, service_role;

create or replace function public.offer_plan_ok(p_user uuid, p_offer uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((
    select o.required_plan is null or public.member_plan_rank(p_user) >= public.plan_rank(o.required_plan)
      from public.offers o where o.id = p_offer
  ), false)
$$;
revoke execute on function public.offer_plan_ok(uuid, uuid) from public, anon, authenticated;
grant execute on function public.offer_plan_ok(uuid, uuid) to service_role;

-- Backstop for every path that creates a redemption (QR and PIN).
create or replace function public.guard_redemption_plan()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.offer_id is not null and not public.offer_plan_ok(new.user_id, new.offer_id) then
    raise exception 'Cette offre est réservée à un niveau d''abonnement supérieur' using errcode = 'P0002';
  end if;
  return new;
end $$;
drop trigger if exists guard_redemption_plan on public.redemptions;
create trigger guard_redemption_plan before insert on public.redemptions
  for each row execute function public.guard_redemption_plan();
