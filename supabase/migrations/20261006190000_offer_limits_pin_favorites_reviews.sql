-- P1 — mechanics of the leading perks apps:
--   * per-member usage limits on offers (e.g. buy-one-get-one once a year);
--   * PIN redemption: the member validates on their own phone by typing the
--     partner's PIN (no merchant login needed at the till);
--   * favourites and verified reviews (only members who used the offer),
--     which replace the hard-coded 4.5 merchant rating.
-- Also: trigger functions are no longer callable through the API.

-- ---------------------------------------------------------------------------
-- Usage limits
-- ---------------------------------------------------------------------------
alter table public.offers
  add column usage_limit int check (usage_limit is null or usage_limit between 1 and 1000),
  add column usage_period text not null default 'YEAR'
    check (usage_period in ('DAY', 'WEEK', 'MONTH', 'YEAR', 'LIFETIME'));

create or replace function public.period_start(p_period text)
returns timestamptz language sql stable set search_path = '' as $$
  select case p_period
    when 'DAY' then now() - interval '1 day'
    when 'WEEK' then now() - interval '7 days'
    when 'MONTH' then now() - interval '1 month'
    when 'YEAR' then now() - interval '1 year'
    else '-infinity'::timestamptz end
$$;

create or replace function public.offer_uses(p_user uuid, p_offer uuid, p_period text)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.redemptions
   where user_id = p_user and offer_id = p_offer and status = 'REDEEMED'
     and redeemed_at >= public.period_start(p_period)
$$;
revoke execute on function public.offer_uses(uuid, uuid, text) from public, anon, authenticated;

-- For the signed-in member: uses and remaining uses for a set of offers.
create or replace function public.my_offer_usage(p_offer_ids uuid[])
returns table (offer_id uuid, used int, usage_limit int, usage_period text, remaining int)
language sql stable security definer set search_path = '' as $$
  select o.id, public.offer_uses(auth.uid(), o.id, o.usage_period), o.usage_limit, o.usage_period,
         case when o.usage_limit is null then null
              else greatest(o.usage_limit - public.offer_uses(auth.uid(), o.id, o.usage_period), 0) end
    from public.offers o
   where o.id = any(p_offer_ids) and auth.uid() is not null
$$;
revoke execute on function public.my_offer_usage(uuid[]) from public, anon;
grant execute on function public.my_offer_usage(uuid[]) to authenticated;

-- Service role (generate-redemption): refuse a new code when the limit is reached.
create or replace function public.offer_usage_remaining(p_user uuid, p_offer uuid)
returns int language sql stable security definer set search_path = '' as $$
  select case when o.usage_limit is null then null
              else greatest(o.usage_limit - public.offer_uses(p_user, o.id, o.usage_period), 0) end
    from public.offers o where o.id = p_offer
$$;
revoke execute on function public.offer_usage_remaining(uuid, uuid) from public, anon, authenticated;
grant execute on function public.offer_usage_remaining(uuid, uuid) to service_role;

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

  -- Usage limit per member (e.g. a buy-one-get-one usable once a year).
  if o.usage_limit is not null and public.offer_uses(r.user_id, o.id, o.usage_period) >= o.usage_limit then
    update public.redemptions set status = 'INVALID' where id = r.id;
    return jsonb_build_object('ok', false, 'reason', 'LIMIT_REACHED', 'limit', o.usage_limit, 'period', o.usage_period);
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
-- PIN redemption
-- ---------------------------------------------------------------------------
alter table public.redemptions drop constraint if exists redemptions_code_type_check;
alter table public.redemptions add constraint redemptions_code_type_check check (code_type in ('QR', 'TOTP', 'PIN'));

create table public.merchant_pins (
  merchant_id uuid primary key references public.merchants(id) on delete cascade,
  pin_hash text not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_date timestamptz not null default now()
);
alter table public.merchant_pins enable row level security;
revoke all on public.merchant_pins from anon, authenticated;

create table public.pin_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  created_date timestamptz not null default now()
);
create index pin_attempts_idx on public.pin_attempts(user_id, merchant_id, created_date);
alter table public.pin_attempts enable row level security;
revoke all on public.pin_attempts from anon, authenticated;

create or replace function public._pin_hash(p_merchant uuid, p_pin text)
returns text language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_merchant::text || ':pin:' || btrim(coalesce(p_pin, '')), 'UTF8')), 'hex')
$$;
revoke execute on function public._pin_hash(uuid, text) from public, anon, authenticated;

-- Merchant (or admin for a given merchant) sets the 4–6 digit counter PIN.
create or replace function public.merchant_set_pin(p_pin text, p_merchant_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_merchant uuid := coalesce(p_merchant_id, public.my_merchant_id());
begin
  if v_merchant is null then raise exception 'Compte partenaire requis' using errcode = '42501'; end if;
  if v_merchant is distinct from public.my_merchant_id() and not public.is_admin() then
    raise exception 'Accès refusé' using errcode = '42501';
  end if;
  if btrim(coalesce(p_pin, '')) !~ '^[0-9]{4,6}$' then raise exception 'Le PIN doit contenir 4 à 6 chiffres'; end if;
  if btrim(p_pin) ~ '^(\d)\1+$' or btrim(p_pin) in ('1234', '12345', '123456', '4321', '654321') then
    raise exception 'PIN trop simple : évitez les suites et les chiffres répétés';
  end if;
  insert into public.merchant_pins (merchant_id, pin_hash, updated_by)
  values (v_merchant, public._pin_hash(v_merchant, p_pin), auth.uid())
  on conflict (merchant_id) do update set pin_hash = excluded.pin_hash, updated_by = excluded.updated_by, updated_date = now();
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.merchant_pin_status(p_merchant_id uuid default null)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('has_pin', exists (select 1 from public.merchant_pins p where p.merchant_id = coalesce(p_merchant_id, public.my_merchant_id())),
                            'updated_date', (select updated_date from public.merchant_pins p where p.merchant_id = coalesce(p_merchant_id, public.my_merchant_id())))
   where coalesce(p_merchant_id, public.my_merchant_id()) = public.my_merchant_id() or public.is_admin()
$$;
revoke execute on function public.merchant_set_pin(text, uuid) from public, anon;
revoke execute on function public.merchant_pin_status(uuid) from public, anon;
grant execute on function public.merchant_set_pin(text, uuid), public.merchant_pin_status(uuid) to authenticated;

-- Service role only (Edge Function redeem-with-pin, after access checks):
-- checks the PIN (5 wrong tries / 15 min per member and partner), creates a
-- PIN redemption and applies it with the same rules as a scanned code.
create or replace function public.redeem_offer_with_pin(
  p_user_id uuid, p_offer_id uuid, p_pin text, p_bill_amount numeric,
  p_bill_currency text default 'USD', p_pay_with_wallet boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
  if not exists (select 1 from public.merchant_pins
                  where merchant_id = o.merchant_id and pin_hash = public._pin_hash(o.merchant_id, p_pin)) then
    insert into public.pin_attempts (user_id, merchant_id) values (p_user_id, o.merchant_id);
    return jsonb_build_object('ok', false, 'reason', 'BAD_PIN');
  end if;
  delete from public.pin_attempts where user_id = p_user_id and merchant_id = o.merchant_id;

  select company_id into v_company from public.profiles where id = p_user_id;
  v_code := 'PIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.redemptions (user_id, company_id, offer_id, merchant_id, code_used, code_type, status,
                                  expires_at, wallet_payment_authorized, created_by_id)
  values (p_user_id, v_company, o.id, o.merchant_id, v_code, 'PIN', 'GENERATED',
          now() + interval '2 minutes', coalesce(p_pay_with_wallet, false), p_user_id);
  return public.redeem_code(v_code, o.merchant_id, p_bill_amount, p_bill_currency, p_pay_with_wallet);
end $$;
revoke execute on function public.redeem_offer_with_pin(uuid, uuid, text, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.redeem_offer_with_pin(uuid, uuid, text, numeric, text, boolean) to service_role;

-- ---------------------------------------------------------------------------
-- Favourites
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete cascade,
  created_date timestamptz not null default now(),
  primary key (user_id, offer_id)
);
create index favorites_offer_idx on public.favorites(offer_id);
alter table public.favorites enable row level security;
create policy "favorites: own" on public.favorites for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Verified reviews + real merchant rating
-- ---------------------------------------------------------------------------
alter table public.merchants alter column rating drop not null, alter column rating drop default;
alter table public.merchants add column reviews_count int not null default 0;
update public.merchants set rating = null;

create table public.offer_reviews (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  hidden boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (user_id, offer_id)
);
create index offer_reviews_offer_idx on public.offer_reviews(offer_id);
create index offer_reviews_merchant_idx on public.offer_reviews(merchant_id);
create trigger set_updated_date before update on public.offer_reviews
  for each row execute function public.set_updated_date();
alter table public.offer_reviews enable row level security;
create policy "offer_reviews: read" on public.offer_reviews for select to anon, authenticated
  using (not hidden or user_id = (select auth.uid()) or (select public.is_admin()));
-- Only members who actually used the offer can review it.
create policy "offer_reviews: verified insert" on public.offer_reviews for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.redemptions r
                           where r.user_id = (select auth.uid()) and r.offer_id = offer_reviews.offer_id
                             and r.status = 'REDEEMED'));
create policy "offer_reviews: own update" on public.offer_reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "offer_reviews: own or admin delete" on public.offer_reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.offer_review_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  select merchant_id into new.merchant_id from public.offers where id = new.offer_id;
  if tg_op = 'INSERT' then
    select coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Membre')
           || coalesce(' ' || nullif(left(split_part(btrim(full_name), ' ', 2), 1), '') || '.', '')
      into v_name from public.profiles where id = new.user_id;
    new.author_name := coalesce(v_name, 'Membre');
  else
    new.user_id := old.user_id;
    new.offer_id := old.offer_id;
    new.author_name := old.author_name;
    if not public.is_admin() then new.hidden := old.hidden; end if;
  end if;
  return new;
end $$;
create trigger offer_review_before_write before insert or update on public.offer_reviews
  for each row execute function public.offer_review_before_write();

create or replace function public.refresh_merchant_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_merchant uuid := coalesce(new.merchant_id, old.merchant_id);
begin
  update public.merchants m
     set rating = s.avg_rating, reviews_count = s.n
    from (select round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as n
            from public.offer_reviews where merchant_id = v_merchant and not hidden) s
   where m.id = v_merchant;
  return null;
end $$;
create trigger offer_review_rating after insert or update or delete on public.offer_reviews
  for each row execute function public.refresh_merchant_rating();

-- guard_merchant_update protects `rating`; the rating trigger runs as owner,
-- so allow it when the change comes from the reviews trigger.
create or replace function public.guard_merchant_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_privileged_session() or public.is_admin() or pg_trigger_depth() > 1 then
    return new;
  end if;
  if new.verified_status is distinct from old.verified_status
     or new.payout_balance is distinct from old.payout_balance
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count then
    raise exception 'Not allowed to change protected merchant fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Trigger functions are not meant to be called through the API.
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as fn
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prorettype = 'trigger'::regtype
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.fn);
  end loop;
end $$;
