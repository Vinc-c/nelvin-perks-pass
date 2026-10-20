-- Premium "Privilège" offers replace the buy-one-get-one mechanic, plus editable
-- SEO (slug / title / description) for partners and offers.
--
-- PERK  = a premium extra offered to the member (free dessert, room upgrade, VIP
--         access, free delivery...). discount_value is its estimated USD value,
--         deducted from the bill and capped at the bill amount.

-- ---------------------------------------------------------------------------
-- Offers: PERK type, perk label, booking flag, SEO
-- ---------------------------------------------------------------------------
alter table public.offers drop constraint if exists offers_discount_type_check;

alter table public.offers
  add column if not exists perk_label text check (perk_label is null or char_length(perk_label) <= 120),
  add column if not exists booking_required boolean not null default false,
  add column if not exists slug text,
  add column if not exists seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  add column if not exists seo_description text check (seo_description is null or char_length(seo_description) <= 200);

update public.offers
   set discount_type = 'PERK', perk_label = coalesce(perk_label, 'Un article offert')
 where discount_type = 'BOGO';

alter table public.offers add constraint offers_discount_type_check
  check (discount_type in ('PERCENTAGE','FIXED','CASHBACK','PERK'));

-- ---------------------------------------------------------------------------
-- Merchants: SEO
-- ---------------------------------------------------------------------------
alter table public.merchants
  add column if not exists slug text,
  add column if not exists seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  add column if not exists seo_description text check (seo_description is null or char_length(seo_description) <= 200);

create or replace function public.slugify(p_text text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(p_text, ''),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
      'aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuy')),
    '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function public.fill_slug()
returns trigger language plpgsql set search_path = '' as $$
declare
  base text;
  candidate text;
  taken boolean;
  j jsonb := to_jsonb(new);
begin
  -- Keep a slug that is already set and unchanged.
  if tg_op = 'UPDATE' and coalesce(new.slug, '') <> '' and new.slug is not distinct from old.slug then
    return new;
  end if;
  base := public.slugify(coalesce(nullif(new.slug, ''), j ->> case tg_table_name when 'offers' then 'title' else 'name' end));
  if base = '' then base := left(new.id::text, 8); end if;
  base := left(base, 80);
  candidate := base;
  if tg_table_name = 'offers' then
    select exists (select 1 from public.offers where slug = candidate and id <> new.id) into taken;
  else
    select exists (select 1 from public.merchants where slug = candidate and id <> new.id) into taken;
  end if;
  if taken then candidate := base || '-' || left(new.id::text, 6); end if;
  new.slug := candidate;
  return new;
end $$;

create trigger fill_offer_slug before insert or update on public.offers
  for each row execute function public.fill_slug();
create trigger fill_merchant_slug before insert or update on public.merchants
  for each row execute function public.fill_slug();

-- Backfill: touching the row lets the trigger generate the slug.
update public.offers set slug = '' where slug is null or slug = '';
update public.merchants set slug = '' where slug is null or slug = '';

create unique index if not exists offers_slug_key on public.offers(slug);
create unique index if not exists merchants_slug_key on public.merchants(slug);

-- ---------------------------------------------------------------------------
-- Plans: replace the 2-for-1 wording
-- ---------------------------------------------------------------------------
update public.plans
   set features = array_replace(features, 'Offres 2-pour-1 premium', 'Privilèges exclusifs (extras offerts, surclassements)')
 where 'Offres 2-pour-1 premium' = any(features);

-- ---------------------------------------------------------------------------
-- redeem_code: PERK replaces BOGO (value deducted from the bill, capped)
-- ---------------------------------------------------------------------------
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
    when 'PERK' then least(greatest(coalesce(o.discount_value, 0), 0), v_bill_usd)
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

revoke execute on function public.fill_slug() from public, anon, authenticated;
