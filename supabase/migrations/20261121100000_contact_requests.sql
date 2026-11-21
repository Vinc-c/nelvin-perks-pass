-- Contact sales: public form -> contact_requests, read and handled by staff (super admin, SALES, SUPPORT).
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  audience text not null check (audience in ('COMPANY','MERCHANT','OTHER')),
  plan_code text,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  phone text check (phone is null or char_length(phone) <= 40),
  company text check (company is null or char_length(company) <= 160),
  country text check (country is null or char_length(country) <= 80),
  size text check (size is null or char_length(size) <= 40),
  message text check (message is null or char_length(message) <= 3000),
  lang text,
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','CLOSED')),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  note text check (note is null or char_length(note) <= 2000)
);
create index if not exists contact_requests_status_idx on public.contact_requests (status, created_at desc);
alter table public.contact_requests enable row level security;

-- Add the 'leads' permission to SALES and SUPPORT (super admin already has all).
create or replace function public.has_perm(p_perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(case public.my_staff_role()
    when 'SUPER_ADMIN' then true
    when 'MARKETING' then p_perm in ('cms', 'blog')
    when 'FINANCE' then p_perm in ('finance')
    when 'SUPPORT' then p_perm in ('support', 'leads')
    when 'SALES' then p_perm in ('promo', 'leads')
    else false end, false)
$$;

drop policy if exists contact_requests_staff_read on public.contact_requests;
create policy contact_requests_staff_read on public.contact_requests for select
  using ((select public.has_perm('leads')));
-- No direct insert/update/delete policies: writes go through the functions below.

create or replace function public.submit_contact_request(
  p_audience text, p_full_name text, p_email text, p_phone text default null, p_company text default null,
  p_country text default null, p_size text default null, p_message text default null,
  p_plan_code text default null, p_lang text default null, p_website text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_email text := lower(btrim(coalesce(p_email, '')));
begin
  -- Honeypot: bots fill the hidden "website" field; pretend success and store nothing.
  if coalesce(p_website, '') <> '' then return gen_random_uuid(); end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Adresse e-mail invalide'; end if;
  if char_length(btrim(coalesce(p_full_name, ''))) < 2 then raise exception 'Nom requis'; end if;
  if p_audience not in ('COMPANY','MERCHANT','OTHER') then raise exception 'Type de demande invalide'; end if;
  -- Light rate limit: 3 requests per e-mail per hour, 200 per hour overall.
  if (select count(*) from public.contact_requests where lower(email) = v_email and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.contact_requests where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'Trop de demandes, réessayez plus tard';
  end if;
  insert into public.contact_requests (audience, plan_code, full_name, email, phone, company, country, size, message, lang)
  values (p_audience, nullif(btrim(p_plan_code), ''), btrim(p_full_name), v_email, nullif(btrim(p_phone), ''),
          nullif(btrim(p_company), ''), nullif(btrim(p_country), ''), nullif(btrim(p_size), ''), nullif(btrim(p_message), ''), p_lang)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_contact_request(text,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.submit_contact_request(text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;

create or replace function public.staff_update_contact_request(p_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_perm('leads') then raise exception 'Accès refusé'; end if;
  if p_status not in ('NEW','CONTACTED','CLOSED') then raise exception 'Statut invalide'; end if;
  update public.contact_requests set status = p_status, note = coalesce(p_note, note),
    handled_by = auth.uid(), handled_at = now() where id = p_id;
  if not found then raise exception 'Demande introuvable'; end if;
end $$;
revoke all on function public.staff_update_contact_request(uuid,text,text) from public;
grant execute on function public.staff_update_contact_request(uuid,text,text) to authenticated;
