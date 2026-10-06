-- Platform v2 — super admins, referrals, profile preferences, settings, audit.

-- ---------------------------------------------------------------------------
-- Platform settings (non-secret, readable by the app)
-- ---------------------------------------------------------------------------
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_date timestamptz not null default now()
);
alter table public.platform_settings enable row level security;
create policy "platform_settings: read" on public.platform_settings for select to anon, authenticated using (true);
create policy "platform_settings: admin write" on public.platform_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.platform_settings (key, value, description) values
  ('referral_bonus_usd', '5', 'Bonus (USD) crédité au parrain au premier abonnement payé du filleul'),
  ('trial_days', '30', 'Durée de l''essai gratuit entreprise (jours)'),
  ('redemption_ttl_seconds', '180', 'Validité d''un code de remise (secondes)'),
  ('recognition_points', '10', 'Points attribués par reconnaissance reçue'),
  ('support_email', '"support@nelvin.app"', 'Email de contact affiché aux utilisateurs');

create or replace function public.setting_numeric(p_key text, p_default numeric)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> '{}')::numeric from public.platform_settings where key = p_key), p_default)
$$;

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log(created_date desc);
alter table public.admin_audit_log enable row level security;
create policy "admin_audit_log: admin read" on public.admin_audit_log for select to authenticated
  using ((select public.is_admin()));

create or replace function public.audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_audit_log (actor_id, actor_email, action, entity, entity_id, details)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;
revoke execute on function public.audit(text, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Profiles: referral + preference columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column referral_code text unique,
  add column referred_by uuid references auth.users(id) on delete set null,
  add column referral_rewarded boolean not null default false,
  add column notif_prefs jsonb not null default '{}'::jsonb,
  add column department text;

create or replace function public.gen_referral_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v text;
begin
  loop
    v := 'NEL';
    for i in 1..6 loop
      v := v || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = v);
  end loop;
  return v;
end $$;

update public.profiles set referral_code = public.gen_referral_code() where referral_code is null;

-- ---------------------------------------------------------------------------
-- Super admins: the allowlist is the single source of truth for SUPER_ADMIN.
-- Adding an email promotes the account (now, or at signup); removing it
-- demotes. At least two super admins must always remain.
-- ---------------------------------------------------------------------------
create table public.platform_admins (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%._%'),
  note text,
  added_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
create policy "platform_admins: admin read" on public.platform_admins for select to authenticated
  using ((select public.is_admin()));
create policy "platform_admins: admin insert" on public.platform_admins for insert to authenticated
  with check ((select public.is_admin()));
create policy "platform_admins: admin delete" on public.platform_admins for delete to authenticated
  using ((select public.is_admin()));

create or replace function public.platform_admins_before_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.email := lower(btrim(new.email));
  new.added_by := coalesce(new.added_by, auth.uid());
  return new;
end $$;
create trigger platform_admins_before_insert before insert on public.platform_admins
  for each row execute function public.platform_admins_before_insert();

create or replace function public.platform_admins_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'SUPER_ADMIN', onboarded = true where lower(email) = new.email;
  perform public.audit('admin.add', 'platform_admins', new.email, '{}'::jsonb);
  return new;
end $$;
create trigger platform_admins_after_insert after insert on public.platform_admins
  for each row execute function public.platform_admins_after_insert();

create or replace function public.platform_admins_before_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.platform_admins) <= 2 then
    raise exception 'Au moins deux super admins doivent rester actifs' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and lower(email) = old.email) then
    raise exception 'Vous ne pouvez pas retirer votre propre accès super admin' using errcode = 'P0001';
  end if;
  return old;
end $$;
create trigger platform_admins_before_delete before delete on public.platform_admins
  for each row execute function public.platform_admins_before_delete();

create or replace function public.platform_admins_after_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set role = 'MEMBER', onboarded = (account_type is not null)
   where lower(email) = old.email and role in ('SUPER_ADMIN', 'admin');
  perform public.audit('admin.remove', 'platform_admins', old.email, '{}'::jsonb);
  return old;
end $$;
create trigger platform_admins_after_delete after delete on public.platform_admins
  for each row execute function public.platform_admins_after_delete();

-- Seed the founding super admins (promoted immediately if they already exist,
-- otherwise as soon as they sign up with these emails).
insert into public.platform_admins (email, note) values
  ('ngomomaxin348@gmail.com', 'Super admin fondateur'),
  ('vinc.c@aol.com', 'Super admin fondateur')
on conflict (email) do nothing;

-- Accounts that had an admin role without being on the allowlist lose it.
update public.profiles p set role = 'MEMBER'
 where p.role in ('SUPER_ADMIN', 'admin')
   and not exists (select 1 from public.platform_admins a where a.email = lower(p.email));

-- Directory of admins for the staff screen (emails + whether they joined).
create or replace function public.admin_staff_list()
returns table (email text, note text, created_date timestamptz, user_id uuid, full_name text, joined boolean)
language sql stable security definer set search_path = '' as $$
  select a.email, a.note, a.created_date, p.id, p.full_name, p.id is not null
    from public.platform_admins a
    left join public.profiles p on lower(p.email) = a.email
   where public.is_admin()
   order by a.created_date
$$;

-- ---------------------------------------------------------------------------
-- Signup bootstrap (replaces the v1 trigger function): profile + referral
-- code + referrer + super admin promotion.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_ref uuid;
  v_is_admin boolean;
begin
  select id into v_ref from public.profiles
   where referral_code = upper(nullif(btrim(new.raw_user_meta_data->>'referral_code'), ''))
     and id <> new.id;
  v_is_admin := exists (select 1 from public.platform_admins where email = lower(new.email));

  insert into public.profiles (id, email, full_name, phone, avatar_url, referral_code, referred_by, role, onboarded)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    new.raw_user_meta_data->>'avatar_url',
    public.gen_referral_code(),
    v_ref,
    case when v_is_admin then 'SUPER_ADMIN' else 'MEMBER' end,
    v_is_admin
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.handle_auth_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  if exists (select 1 from public.platform_admins where email = lower(new.email)) then
    update public.profiles set role = 'SUPER_ADMIN', onboarded = true where id = new.id;
  end if;
  return new;
end $$;

-- Referral overview for the signed-in user (no PII beyond a masked name).
create or replace function public.my_referrals()
returns table (display_name text, joined_at timestamptz, onboarded boolean, rewarded boolean)
language sql stable security definer set search_path = '' as $$
  select coalesce(split_part(p.full_name, ' ', 1), split_part(p.email, '@', 1)) ||
         case when p.full_name like '% %' then ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.' else '' end,
         p.created_date, p.onboarded, p.referral_rewarded
    from public.profiles p
   where p.referred_by = auth.uid()
   order by p.created_date desc
$$;

-- ---------------------------------------------------------------------------
-- Profile guard (replaces v1): end users cannot touch roles, money, tenancy
-- or referral bookkeeping. SUPER_ADMIN can only come from the allowlist.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.role in ('SUPER_ADMIN', 'admin') and old.role is distinct from new.role
     and not exists (select 1 from public.platform_admins where email = lower(new.email)) then
    raise exception 'Le rôle super admin se gère depuis la liste des super admins' using errcode = '42501';
  end if;
  if public.is_privileged_session() then
    return new;
  end if;
  if public.is_admin() then
    if new.wallet_balance is distinct from old.wallet_balance then
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
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.referral_rewarded is distinct from old.referral_rewarded
     or new.department is distinct from old.department
     or (old.onboarded and not new.onboarded) then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- Attach a referrer after signup (e.g. Google sign-in, where signup metadata
-- cannot carry the code). Only within 7 days of account creation, only once.
create or replace function public.claim_referral(p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_ref uuid;
begin
  select id into v_ref from public.profiles
   where referral_code = upper(btrim(coalesce(p_code, ''))) and id <> auth.uid();
  if v_ref is null then return false; end if;
  update public.profiles set referred_by = v_ref
   where id = auth.uid() and referred_by is null and created_date > now() - interval '7 days';
  return found;
end $$;
revoke execute on function public.claim_referral(text) from public, anon;
grant execute on function public.claim_referral(text) to authenticated;
revoke execute on function public.my_referrals() from public, anon;
grant execute on function public.my_referrals() to authenticated;
revoke execute on function public.admin_staff_list() from public, anon;
grant execute on function public.admin_staff_list() to authenticated;
