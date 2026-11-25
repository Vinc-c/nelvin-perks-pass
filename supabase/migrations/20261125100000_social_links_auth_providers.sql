-- Footer social links and login-option switches, both edited by super admins (Admin → Social & login).
insert into public.platform_settings (key, value, description) values
  ('social_links', '{}'::jsonb, 'Public social media URLs shown as icons in the footer (empty = hidden)'),
  ('auth_providers', '{"google":1,"apple":0,"phone":0}'::jsonb, 'Login options shown on the auth pages (1 = on). Apple and phone also need the provider enabled in Supabase Auth.')
on conflict (key) do nothing;

create or replace function public.admin_set_social_links(p_links jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare k text; v text; clean jsonb := '{}'::jsonb;
  hosts jsonb := '{"facebook":["facebook.com","fb.com"],"instagram":["instagram.com"],"x":["x.com","twitter.com"],"linkedin":["linkedin.com"],
    "youtube":["youtube.com","youtu.be"],"tiktok":["tiktok.com"],"whatsapp":["wa.me","whatsapp.com"],"telegram":["t.me","telegram.me"]}';
  host text; ok boolean;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  for k in select jsonb_object_keys(p_links) loop
    if not hosts ? k then raise exception 'Réseau inconnu : %', k; end if;
    v := btrim(coalesce(p_links->>k, ''));
    if v = '' then continue; end if;
    if length(v) > 200 or v !~* '^https://[a-z0-9.-]+(/[^\s<>"'']*)?$' then raise exception 'Lien invalide pour % (https:// requis)', k; end if;
    host := lower(substring(v from '^https://([^/]+)'));
    select bool_or(host = h or host like '%.' || h) into ok from jsonb_array_elements_text(hosts->k) h;
    if not coalesce(ok, false) then raise exception 'Le lien % doit pointer vers le site officiel du réseau', k; end if;
    clean := clean || jsonb_build_object(k, v);
  end loop;
  update public.platform_settings set value = clean, updated_by = auth.uid(), updated_date = now() where key = 'social_links';
  perform public.audit('social_links.update', 'platform_settings', 'social_links', clean);
end $$;

create or replace function public.admin_set_auth_providers(p_providers jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare k text; clean jsonb := '{}'::jsonb;
begin
  if not public.is_admin() then raise exception 'Accès refusé' using errcode = '42501'; end if;
  for k in select jsonb_object_keys(p_providers) loop
    if k not in ('google','apple','phone') then raise exception 'Option inconnue : %', k; end if;
    clean := clean || jsonb_build_object(k, case when (p_providers->>k) in ('1','true') then 1 else 0 end);
  end loop;
  update public.platform_settings set value = '{"google":1,"apple":0,"phone":0}'::jsonb || clean, updated_by = auth.uid(), updated_date = now() where key = 'auth_providers';
  perform public.audit('auth_providers.update', 'platform_settings', 'auth_providers', clean);
end $$;

revoke all on function public.admin_set_social_links(jsonb), public.admin_set_auth_providers(jsonb) from public, anon;
grant execute on function public.admin_set_social_links(jsonb), public.admin_set_auth_providers(jsonb) to authenticated;

-- Phone sign-in: keep the verified phone number on the profile (email may be null for phone-only accounts).
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_ref uuid; v_is_admin boolean; v_is_staff boolean;
begin
  select id into v_ref from public.profiles
   where referral_code = upper(nullif(btrim(new.raw_user_meta_data->>'referral_code'), ''))
     and id <> new.id;
  v_is_admin := exists (select 1 from public.platform_admins where email = lower(new.email));
  v_is_staff := not v_is_admin and exists (select 1 from public.staff_members where email = lower(new.email));
  insert into public.profiles (id, email, full_name, phone, avatar_url, referral_code, referred_by, role, onboarded)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(nullif(new.raw_user_meta_data->>'phone', ''), nullif(new.phone, '')),
    new.raw_user_meta_data->>'avatar_url',
    public.gen_referral_code(), v_ref,
    case when v_is_admin then 'SUPER_ADMIN' when v_is_staff then 'STAFF' else 'MEMBER' end,
    v_is_admin or v_is_staff
  )
  on conflict (id) do nothing;
  return new;
end $$;
