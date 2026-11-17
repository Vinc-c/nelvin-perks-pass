-- Paid promotion: the super admin sets prices per placement, verified merchants buy days of visibility
-- for one of their offers, payment goes through the normal PSP checkout (transactions.type = 'PROMOTION').

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type = any (array[
  'REDEMPTION','RECHARGE','WITHDRAWAL','SUBSCRIPTION','PAYOUT','ALLOCATION','COMPANY_TOPUP','REFERRAL_BONUS','REFUND','GIFT','PROMOTION']));

create table if not exists public.promo_placements (
  code text primary key,
  name text not null,
  description text,
  price_usd_per_day numeric not null default 1 check (price_usd_per_day >= 0),
  min_days int not null default 3 check (min_days >= 1),
  max_days int not null default 30 check (max_days >= min_days),
  max_slots int not null default 5 check (max_slots >= 1),
  active boolean not null default true,
  sort int not null default 0,
  updated_date timestamptz not null default now()
);
alter table public.promo_placements enable row level security;
drop policy if exists "promo_placements: read" on public.promo_placements;
create policy "promo_placements: read" on public.promo_placements for select to anon, authenticated using (true);
drop policy if exists "promo_placements: admin write" on public.promo_placements;
create policy "promo_placements: admin write" on public.promo_placements for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.promo_placements (code, name, description, price_usd_per_day, min_days, max_days, max_slots, sort) values
  ('HOME_REEL', 'Home carousel', 'Large card in the auto-scrolling carousel at the top of every member''s Home.', 2, 3, 30, 6, 1),
  ('TOP_OF_OFFERS', 'Top of the offers list', 'Your offer appears first, with a Sponsored tag, in the member offers list.', 1, 3, 30, 10, 2)
on conflict (code) do nothing;

insert into public.platform_settings (key, value, description)
values ('promo_requires_review', 'false'::jsonb, 'When true, paid promotions wait for admin approval before going live.')
on conflict (key) do nothing;

create table if not exists public.promo_orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  placement text not null references public.promo_placements(code),
  days int not null check (days >= 1),
  price_usd numeric not null check (price_usd >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'PENDING_PAYMENT' check (status in ('PENDING_PAYMENT','IN_REVIEW','ACTIVE','REJECTED','STOPPED','CANCELLED')),
  transaction_id uuid references public.transactions(id) on delete set null,
  admin_note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists promo_orders_live_idx on public.promo_orders (placement, status, starts_at, ends_at);
create index if not exists promo_orders_merchant_idx on public.promo_orders (merchant_id, created_at desc);
alter table public.promo_orders enable row level security;
drop policy if exists "promo_orders: read" on public.promo_orders;
create policy "promo_orders: read" on public.promo_orders for select to authenticated
  using (merchant_id = (select public.my_merchant_id()) or (select public.is_admin()));
drop policy if exists "promo_orders: admin write" on public.promo_orders;
create policy "promo_orders: admin write" on public.promo_orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Slots already taken on a placement during a period (paid, in review, or checkout opened in the last 30 minutes).
create or replace function public.promo_slots_used(p_placement text, p_from timestamptz, p_to timestamptz)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.promo_orders
  where placement = p_placement and starts_at < p_to and ends_at > p_from
    and (status in ('ACTIVE','IN_REVIEW') or (status = 'PENDING_PAYMENT' and created_at > now() - interval '30 minutes'))
$$;

create or replace function public.promo_slots_left(p_placement text, p_start date, p_days int)
returns int language sql stable security definer set search_path = '' as $$
  select greatest(0, pp.max_slots - public.promo_slots_used(pp.code, p_start::timestamptz, (p_start + p_days)::timestamptz))
  from public.promo_placements pp where pp.code = p_placement and pp.active
$$;

-- Merchant: create an unpaid order (price is computed here, never trusted from the client).
create or replace function public.create_promo_order(p_offer uuid, p_placement text, p_days int, p_start date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_merchant uuid := public.my_merchant_id();
  o public.offers%rowtype;
  pp public.promo_placements%rowtype;
  v_start timestamptz;
  v_end timestamptz;
  v_price numeric;
  v_id uuid;
begin
  if auth.uid() is null or v_merchant is null then raise exception 'Merchant account required'; end if;
  if not exists (select 1 from public.merchants where id = v_merchant and verified_status = 'VERIFIED') then
    raise exception 'Your business must be verified before you can promote offers';
  end if;
  select * into o from public.offers where id = p_offer and merchant_id = v_merchant;
  if not found then raise exception 'Offer not found'; end if;
  select * into pp from public.promo_placements where code = p_placement and active;
  if not found then raise exception 'This placement is not available'; end if;
  if p_days is null or p_days < pp.min_days or p_days > pp.max_days then
    raise exception 'Choose between % and % days', pp.min_days, pp.max_days;
  end if;
  if p_start is null or p_start < (now() at time zone 'utc')::date or p_start > (now() at time zone 'utc')::date + 60 then
    raise exception 'Start date must be within the next 60 days';
  end if;
  v_start := p_start::timestamptz;
  v_end := v_start + make_interval(days => p_days);
  if o.expires_at is not null and o.expires_at < v_end then
    raise exception 'The offer expires before the end of this promotion';
  end if;
  if public.promo_slots_used(pp.code, v_start, v_end) >= pp.max_slots then
    raise exception 'No slot left on these dates. Try another start date.';
  end if;
  update public.promo_orders set status = 'CANCELLED', updated_at = now()
   where merchant_id = v_merchant and offer_id = p_offer and placement = p_placement and status = 'PENDING_PAYMENT';
  v_price := round(pp.price_usd_per_day * p_days, 2);
  insert into public.promo_orders (merchant_id, offer_id, placement, days, price_usd, starts_at, ends_at)
  values (v_merchant, p_offer, p_placement, p_days, v_price, v_start, v_end) returning id into v_id;
  return jsonb_build_object('id', v_id, 'price_usd', v_price, 'starts_at', v_start, 'ends_at', v_end);
end $$;

-- Called by complete_payment once the PSP confirmed the payment.
create or replace function public._activate_promo(p_tx uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  o public.promo_orders%rowtype;
  v_review boolean;
  v_status text;
  v_start timestamptz;
begin
  select * into o from public.promo_orders where transaction_id = p_tx for update;
  if not found then raise exception 'Promotion order not found for this payment'; end if;
  select coalesce((value)::text = 'true', false) into v_review from public.platform_settings where key = 'promo_requires_review';
  v_status := case when coalesce(v_review, false) then 'IN_REVIEW' else 'ACTIVE' end;
  -- Paid after the planned start: the full duration still runs from now.
  v_start := greatest(o.starts_at, date_trunc('minute', now()));
  update public.promo_orders
     set status = v_status, starts_at = v_start, ends_at = v_start + make_interval(days => o.days), updated_at = now()
   where id = o.id;
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  select p.id, 'SYSTEM',
         case when v_status = 'ACTIVE' then 'Your promotion is live' else 'Promotion received' end,
         case when v_status = 'ACTIVE' then 'Your offer is now promoted.' else 'Payment received. The Nelvin team will approve your promotion shortly.' end,
         '/merchant-dashboard?section=promote', p.id
  from public.profiles p where p.merchant_id = o.merchant_id;
  return jsonb_build_object('promotion_id', o.id, 'promotion_status', v_status);
end $$;

-- Admin: approve, reject or stop a promotion.
create or replace function public.review_promo_order(p_id uuid, p_decision text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.promo_orders%rowtype;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select * into o from public.promo_orders where id = p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_decision = 'APPROVE' and o.status = 'IN_REVIEW' then
    update public.promo_orders set status = 'ACTIVE', admin_note = p_note, updated_at = now() where id = p_id;
  elsif p_decision = 'REJECT' and o.status in ('IN_REVIEW','ACTIVE') then
    update public.promo_orders set status = 'REJECTED', admin_note = p_note, updated_at = now() where id = p_id;
  elsif p_decision = 'STOP' and o.status = 'ACTIVE' then
    update public.promo_orders set status = 'STOPPED', admin_note = p_note, updated_at = now() where id = p_id;
  else
    raise exception 'This action is not possible for status %', o.status;
  end if;
end $$;

-- Public: offers promoted right now (only offer ids and placement are exposed).
create or replace function public.public_promoted_offers()
returns table (offer_id uuid, placement text) language sql stable security definer set search_path = '' as $$
  select offer_id, placement from public.promo_orders
  where status = 'ACTIVE' and starts_at <= now() and ends_at > now()
$$;

-- complete_payment: add the PROMOTION branch.
create or replace function public.complete_payment(p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $function$
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
  elsif t.type = 'GIFT' then
    v_extra := public._issue_gift(t.id);
  elsif t.type = 'PROMOTION' then
    v_extra := public._activate_promo(t.id);
  else
    raise exception 'Type de paiement non pris en charge: %', t.type;
  end if;

  return jsonb_build_object('ok', true, 'status', 'completed', 'type', t.type, 'balance', v_balance,
                            'amount', t.amount, 'currency', t.currency, 'amount_usd', v_usd,
                            'transactionId', t.id) || v_extra;
end $function$;

-- Internal helpers are not callable from the API.
revoke execute on function public.promo_slots_used(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public._activate_promo(uuid) from public, anon, authenticated;
revoke execute on function public.create_promo_order(uuid, text, int, date) from public, anon;
revoke execute on function public.review_promo_order(uuid, text, text) from public, anon;
grant execute on function public.create_promo_order(uuid, text, int, date) to authenticated;
grant execute on function public.review_promo_order(uuid, text, text) to authenticated;
grant execute on function public.promo_slots_left(text, date, int) to anon, authenticated;
grant execute on function public.public_promoted_offers() to anon, authenticated;
