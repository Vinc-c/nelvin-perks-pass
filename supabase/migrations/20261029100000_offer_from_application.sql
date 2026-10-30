-- A partner application carries the partner's first offer (headline, how to use,
-- conditions, expiry, image) on the merchants row. Until now nothing turned it
-- into a real row in public.offers when the application was approved, so
-- verified partners showed "Offer coming soon". This creates the offer on approval.
create or replace function public.offer_from_application(p_merchant uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  m public.merchants%rowtype;
  v_title text;
  v_type text := 'PERK';
  v_value numeric := 0;
  v_perk text;
  v_pct text;
  v_fix text;
  v_terms text;
  v_id uuid;
begin
  select * into m from public.merchants where id = p_merchant;
  if not found or coalesce(btrim(m.offer_headline), '') = '' then return null; end if;
  if exists (select 1 from public.offers where merchant_id = p_merchant) then return null; end if;

  v_title := left(btrim(m.offer_headline), 160);
  v_pct := substring(m.offer_headline from '(\d{1,3}(?:[.,]\d+)?)\s*%');
  v_fix := substring(m.offer_headline from '(?:\$|USD\s*)\s*(\d+(?:[.,]\d+)?)');
  if v_pct is not null then
    v_type := 'PERCENTAGE'; v_value := least(100, replace(v_pct, ',', '.')::numeric);
  elsif v_fix is not null then
    v_type := 'FIXED'; v_value := replace(v_fix, ',', '.')::numeric;
  else
    v_perk := left(btrim(m.offer_headline), 120);
  end if;

  v_terms := concat_ws(E'\n',
    nullif(btrim(coalesce(m.offer_how_to_use, '')), ''),
    case when btrim(coalesce(m.offer_terms, '')) ~ '[A-Za-z]' then btrim(m.offer_terms) end,
    nullif(btrim(coalesce(m.application_notes, '')), ''));

  insert into public.offers (merchant_id, title, description, category, discount_type, discount_value, perk_label,
                             deal_terms, target_audience, image_url, expires_at, created_by_id)
  values (m.id, v_title, coalesce(m.description, ''), m.category, v_type, v_value, v_perk,
          nullif(v_terms, ''), 'ALL', coalesce(nullif(m.product_image_url, ''), nullif(m.cover_image_url, ''), ''),
          case when m.offer_expiry is not null then (m.offer_expiry::timestamp + interval '23 hours 59 minutes')::timestamptz end,
          m.created_by_id)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.offer_from_application(uuid) from public, anon, authenticated;

create or replace function public.merchant_approved_offer()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.verified_status = 'VERIFIED' and old.verified_status is distinct from 'VERIFIED' then
    perform public.offer_from_application(new.id);
  end if;
  return new;
end $$;
create trigger merchant_approved_offer after update of verified_status on public.merchants
  for each row execute function public.merchant_approved_offer();

-- Backfill: partners already approved without any offer.
select public.offer_from_application(id) from public.merchants where verified_status = 'VERIFIED';

-- Readable titles for bare headlines such as "20%" / "save 50%" (applied after the backfill above).
update public.offers o
   set title = trim(to_char(o.discount_value, 'FM990.99'), '.') || '% off at ' || m.name, slug = ''
  from public.merchants m
 where m.id = o.merchant_id and o.discount_type = 'PERCENTAGE'
   and (o.title !~ '[A-Za-z]{4,}' or o.title ~* '^save\s*[0-9]+%$');
