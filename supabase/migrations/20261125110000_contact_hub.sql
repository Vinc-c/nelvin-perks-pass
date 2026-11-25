-- One request form for demos, partner applications, quotes and support. Each request gets a reference,
-- emails support@ (and an acknowledgement to the sender) and lands in Admin → Contact requests.
alter table public.contact_requests
  add column if not exists topic text not null default 'QUOTE' check (topic in ('DEMO','PARTNER','QUOTE','SUPPORT','OTHER')),
  add column if not exists reference text,
  add column if not exists details jsonb not null default '{}'::jsonb;
update public.contact_requests set reference = 'NV-' || to_char(created_at, 'YYMM') || '-' || upper(substr(md5(id::text), 1, 5)) where reference is null;
create unique index if not exists contact_requests_reference_key on public.contact_requests (reference);
create index if not exists contact_requests_topic_idx on public.contact_requests (topic, status, created_at desc);

insert into public.platform_settings (key, value, description)
values ('support_email', '"support@nelvinbenefits.com"'::jsonb, 'Inbox that receives every contact / support request')
on conflict (key) do nothing;

create or replace function public.submit_contact(
  p_topic text, p_audience text, p_full_name text, p_email text, p_phone text default null, p_company text default null,
  p_country text default null, p_size text default null, p_message text default null, p_plan_code text default null,
  p_lang text default null, p_website text default null, p_details jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid; v_ref text; v_email text := lower(btrim(coalesce(p_email, '')));
  v_aud text; v_det jsonb := '{}'::jsonb; k text; v_to text; v_fr boolean := coalesce(p_lang, 'en') = 'fr';
  v_topic_label text; v_body text;
begin
  if coalesce(p_website, '') <> '' then return jsonb_build_object('id', gen_random_uuid(), 'reference', 'NV-0000-00000'); end if; -- honeypot
  if p_topic not in ('DEMO','PARTNER','QUOTE','SUPPORT','OTHER') then raise exception 'Type de demande invalide'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 200 then raise exception 'Adresse e-mail invalide'; end if;
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'Nom requis'; end if;
  if p_topic in ('SUPPORT','OTHER') and char_length(btrim(coalesce(p_message, ''))) < 5 then raise exception 'Message requis'; end if;
  v_aud := case p_topic when 'DEMO' then 'COMPANY' when 'PARTNER' then 'MERCHANT'
            when 'QUOTE' then case when p_audience = 'MERCHANT' then 'MERCHANT' else 'COMPANY' end else 'OTHER' end;
  if (select count(*) from public.contact_requests where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.contact_requests where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'Trop de demandes, réessayez plus tard';
  end if;
  foreach k in array array['preferred_time','website_url','business_type','order_reference','urgency','role'] loop
    if coalesce(p_details->>k, '') <> '' then v_det := v_det || jsonb_build_object(k, left(btrim(p_details->>k), 300)); end if;
  end loop;
  v_ref := 'NV-' || to_char(now(), 'YYMM') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
  insert into public.contact_requests (topic, audience, reference, plan_code, full_name, email, phone, company, country, size, message, lang, details)
  values (p_topic, v_aud, v_ref, nullif(btrim(p_plan_code), ''), left(btrim(p_full_name), 120), v_email, nullif(left(btrim(p_phone), 40), ''),
          nullif(left(btrim(p_company), 160), ''), nullif(left(btrim(p_country), 80), ''), nullif(left(btrim(p_size), 40), ''),
          nullif(left(btrim(p_message), 3000), ''), p_lang, v_det)
  returning id into v_id;

  v_topic_label := case p_topic when 'DEMO' then 'Demo request' when 'PARTNER' then 'Partner application' when 'QUOTE' then 'Quote request'
                   when 'SUPPORT' then 'Support request' else 'Message' end;
  select coalesce(nullif(value #>> '{}', ''), 'support@nelvinbenefits.com') into v_to from public.platform_settings where key = 'support_email';
  v_body := 'Reference: ' || v_ref || E'\n' || 'From: ' || btrim(p_full_name) || ' <' || v_email || '>' ||
            coalesce(E'\nCompany: ' || nullif(btrim(p_company), ''), '') || coalesce(E'\nPhone: ' || nullif(btrim(p_phone), ''), '') ||
            coalesce(E'\nCountry: ' || nullif(btrim(p_country), ''), '') || coalesce(E'\nSize: ' || nullif(btrim(p_size), ''), '') ||
            coalesce(E'\nPlan: ' || nullif(btrim(p_plan_code), ''), '') || coalesce(E'\n\n' || nullif(btrim(p_message), ''), '');
  perform public.enqueue_email(null, coalesce(v_to, 'support@nelvinbenefits.com'), 'generic',
    jsonb_build_object('title', v_topic_label || ' · ' || v_ref, 'body', v_body, 'link', '/admin?section=leads'), 'en');
  perform public.enqueue_email(null, v_email, 'generic', jsonb_build_object(
    'title', case when v_fr then 'Nous avons bien reçu votre demande · ' else 'We received your request · ' end || v_ref,
    'body', case when v_fr then 'Bonjour ' || split_part(btrim(p_full_name), ' ', 1) || E',\nmerci de nous avoir contactés. Votre numéro de suivi est ' || v_ref || E'. Notre équipe vous répondra sous un jour ouvré.\nConservez ce numéro si vous nous réécrivez.'
                 else 'Hello ' || split_part(btrim(p_full_name), ' ', 1) || E',\nthank you for contacting us. Your reference is ' || v_ref || E'. Our team will reply within one business day.\nKeep this reference if you write to us again.' end,
    'link', '/'), case when v_fr then 'fr' else 'en' end);
  return jsonb_build_object('id', v_id, 'reference', v_ref);
end $$;
revoke all on function public.submit_contact(text,text,text,text,text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.submit_contact(text,text,text,text,text,text,text,text,text,text,text,text,jsonb) to anon, authenticated;
