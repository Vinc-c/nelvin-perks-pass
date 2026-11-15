-- White-label dashboards for companies on the two highest B2B plans (GROWTH, ENTERPRISE).
-- HR submits a branding proposal; the Nelvin marketing team approves, edits or rejects it.
create table if not exists public.company_branding (
  company_id uuid primary key references public.companies(id) on delete cascade,
  status text not null default 'NONE' check (status in ('NONE','PENDING','APPROVED','REJECTED')),
  -- live (approved) values
  primary_color text, accent_color text, logo_url text, banner_url text, welcome_title text, welcome_text text,
  -- proposal waiting for review
  pending jsonb,
  review_note text,
  submitted_at timestamptz, reviewed_at timestamptz, reviewed_by uuid references auth.users(id),
  updated_date timestamptz not null default now()
);
alter table public.company_branding enable row level security;
create policy "company_branding: admin all" on public.company_branding for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.branding_plan_ok(p_company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.companies c
                  where c.id = p_company and c.plan_tier in ('GROWTH','ENTERPRISE')
                    and coalesce(c.subscription_status,'') in ('ACTIVE','TRIALING','active','trialing'));
$$;

create or replace function public._branding_clean(p jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  v_base constant text := 'https://wdxgflyhjhcevdruvfjb.supabase.co/storage/v1/object/public/nelvin-public/';
  k text; v text; out jsonb := '{}'::jsonb;
begin
  foreach k in array array['primary_color','accent_color'] loop
    v := nullif(btrim(p->>k), '');
    if v is not null and v !~ '^#[0-9A-Fa-f]{6}$' then raise exception 'Invalid color for %', k; end if;
    out := out || jsonb_build_object(k, v);
  end loop;
  foreach k in array array['logo_url','banner_url'] loop
    v := nullif(btrim(p->>k), '');
    if v is not null and left(v, length(v_base)) <> v_base then raise exception 'Upload the image through Nelvin (%)', k; end if;
    out := out || jsonb_build_object(k, v);
  end loop;
  out := out || jsonb_build_object('welcome_title', left(nullif(btrim(p->>'welcome_title'), ''), 80),
                                   'welcome_text', left(nullif(btrim(p->>'welcome_text'), ''), 280));
  return out;
end $$;

create or replace function public.submit_company_branding(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id();
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then raise exception 'Only the company HR admin can customise the dashboard'; end if;
  if not public.branding_plan_ok(v_company) then raise exception 'Dashboard customisation requires the Growth or Enterprise plan'; end if;
  insert into public.company_branding (company_id, status, pending, submitted_at, review_note)
  values (v_company, 'PENDING', public._branding_clean(p), now(), null)
  on conflict (company_id) do update
    set pending = excluded.pending, submitted_at = now(), review_note = null,
        status = 'PENDING', updated_date = now();
  return jsonb_build_object('ok', true, 'status', 'PENDING');
end $$;

create or replace function public.review_company_branding(p_company uuid, p_action text, p_note text default null, p_edits jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.company_branding; v jsonb;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  select * into b from public.company_branding where company_id = p_company;
  if not found or b.pending is null then raise exception 'Nothing to review'; end if;
  if p_action = 'approve' then
    v := public._branding_clean(coalesce(b.pending, '{}'::jsonb) || coalesce(p_edits, '{}'::jsonb));
    update public.company_branding set status = 'APPROVED', pending = null,
      primary_color = v->>'primary_color', accent_color = v->>'accent_color', logo_url = v->>'logo_url',
      banner_url = v->>'banner_url', welcome_title = v->>'welcome_title', welcome_text = v->>'welcome_text',
      review_note = p_note, reviewed_at = now(), reviewed_by = auth.uid(), updated_date = now()
     where company_id = p_company;
  elsif p_action = 'reject' then
    update public.company_branding set status = 'REJECTED', review_note = p_note, reviewed_at = now(), reviewed_by = auth.uid(), updated_date = now()
     where company_id = p_company;
  else raise exception 'Unknown action'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- Branding for the caller's company: employees/HR get the live values; HR also gets the proposal state.
create or replace function public.get_my_branding()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id(); b public.company_branding; v_ok boolean;
begin
  if v_company is null then return null; end if;
  v_ok := public.branding_plan_ok(v_company);
  select * into b from public.company_branding where company_id = v_company;
  return jsonb_build_object(
    'eligible', v_ok,
    'status', coalesce(b.status, 'NONE'),
    'live', case when v_ok and b.primary_color is not null then jsonb_build_object(
        'primary_color', b.primary_color, 'accent_color', b.accent_color, 'logo_url', b.logo_url,
        'banner_url', b.banner_url, 'welcome_title', b.welcome_title, 'welcome_text', b.welcome_text) else null end,
    'pending', case when public.my_role() = 'HR_ADMIN' then b.pending else null end,
    'review_note', case when public.my_role() = 'HR_ADMIN' then b.review_note else null end);
end $$;

revoke all on function public.submit_company_branding(jsonb), public.review_company_branding(uuid,text,text,jsonb), public.get_my_branding(), public.branding_plan_ok(uuid), public._branding_clean(jsonb) from public, anon;
grant execute on function public.submit_company_branding(jsonb), public.review_company_branding(uuid,text,text,jsonb), public.get_my_branding() to authenticated;
