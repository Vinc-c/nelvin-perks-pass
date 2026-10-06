-- Two-factor authentication: mandatory for sensitive roles + recovery codes.
--
-- * `mfa_required_roles` (platform setting, default SUPER_ADMIN + HR_ADMIN):
--   for these roles a session only counts as 2FA-satisfied at AAL2, so a
--   super admin who has not enrolled TOTP has no admin rights until they do
--   (the app forces enrollment right after sign-in).
-- * Recovery codes: 10 single-use codes, stored hashed, generated from an AAL2
--   session; one code removes the lost authenticator (Edge Function
--   `mfa-recover`) so the user can enroll a new one.
-- Break-glass (SQL editor): update public.platform_settings set value = '[]' where key = 'mfa_required_roles';

insert into public.platform_settings (key, value, description) values
  ('mfa_required_roles', '["SUPER_ADMIN", "HR_ADMIN"]', 'Rôles pour lesquels la double authentification est obligatoire')
on conflict (key) do nothing;

create or replace function public.mfa_required_for(p_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select jsonb_typeof(value) = 'array' and value ? p_role
                     from public.platform_settings where key = 'mfa_required_roles'), false)
$$;

create or replace function public.mfa_has_factor()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;

-- AAL2, or (no verified factor and 2FA not mandatory for my role).
create or replace function public.mfa_ok()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or (not public.mfa_has_factor()
          and not public.mfa_required_for(coalesce((select role from public.profiles where id = auth.uid()), '')))
$$;

create or replace function public.require_mfa()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.mfa_ok() then
    raise exception 'Double authentification requise : activez-la dans Sécurité puis validez votre session'
      using errcode = '42501';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Recovery codes
-- ---------------------------------------------------------------------------
create table public.mfa_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_date timestamptz not null default now()
);
create index mfa_recovery_codes_user_idx on public.mfa_recovery_codes(user_id);
alter table public.mfa_recovery_codes enable row level security; -- no policy: functions only
revoke all on public.mfa_recovery_codes from anon, authenticated;

create table public.mfa_recovery_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_date timestamptz not null default now()
);
create index mfa_recovery_attempts_user_idx on public.mfa_recovery_attempts(user_id, created_date);
alter table public.mfa_recovery_attempts enable row level security;
revoke all on public.mfa_recovery_attempts from anon, authenticated;

create or replace function public._recovery_hash(p_user_id uuid, p_code text)
returns text language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(p_user_id::text || ':' || upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex')
$$;
revoke execute on function public._recovery_hash(uuid, text) from public, anon, authenticated;

create or replace function public.generate_mfa_recovery_codes()
returns text[] language plpgsql volatile security definer set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codes text[] := '{}';
  v_code text;
  v_bytes bytea;
begin
  if auth.uid() is null then raise exception 'Non connecté' using errcode = '42501'; end if;
  if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'Validez d''abord votre session avec la double authentification' using errcode = '42501';
  end if;
  delete from public.mfa_recovery_codes where user_id = auth.uid();
  for i in 1..10 loop
    v_bytes := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    for j in 0..9 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, j) % 32) + 1, 1);
    end loop;
    v_code := substr(v_code, 1, 5) || '-' || substr(v_code, 6, 5);
    v_codes := v_codes || v_code;
    insert into public.mfa_recovery_codes (user_id, code_hash) values (auth.uid(), public._recovery_hash(auth.uid(), v_code));
  end loop;
  perform public.audit('mfa.recovery.generate', 'profiles', auth.uid()::text, '{}'::jsonb);
  return v_codes;
end $$;

-- Service role only (Edge Function `mfa-recover`): burns one code. At most 5
-- attempts per hour per user.
create or replace function public.consume_mfa_recovery_code(p_user_id uuid, p_code text)
returns boolean language plpgsql volatile security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select count(*) from public.mfa_recovery_attempts
       where user_id = p_user_id and created_date > now() - interval '1 hour') >= 5 then
    raise exception 'Trop de tentatives. Réessayez dans une heure.' using errcode = 'P0001';
  end if;
  select id into v_id from public.mfa_recovery_codes
   where user_id = p_user_id and used_at is null and code_hash = public._recovery_hash(p_user_id, p_code)
   limit 1 for update;
  if v_id is null then
    insert into public.mfa_recovery_attempts (user_id) values (p_user_id);
    return false;
  end if;
  update public.mfa_recovery_codes set used_at = now() where id = v_id;
  delete from public.mfa_recovery_attempts where user_id = p_user_id;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity, entity_id, details)
  values (p_user_id, (select email from public.profiles where id = p_user_id), 'mfa.recovery.used', 'profiles', p_user_id::text, '{}'::jsonb);
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, 'ALERT', 'Code de secours utilisé',
          'Votre double authentification a été réinitialisée. Si ce n''est pas vous, changez votre mot de passe immédiatement.',
          '/security-settings');
  return true;
end $$;

create or replace function public.mfa_policy()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'required', public.mfa_required_for(coalesce((select role from public.profiles where id = auth.uid()), '')),
    'has_factor', public.mfa_has_factor(),
    'aal', coalesce(auth.jwt()->>'aal', 'aal1'),
    'recovery_remaining', (select count(*) from public.mfa_recovery_codes where user_id = auth.uid() and used_at is null)
  )
$$;

revoke execute on function public.mfa_required_for(text) from public, anon;
revoke execute on function public.mfa_has_factor() from public, anon;
revoke execute on function public.require_mfa() from public, anon;
revoke execute on function public.generate_mfa_recovery_codes() from public, anon;
revoke execute on function public.consume_mfa_recovery_code(uuid, text) from public, anon, authenticated;
revoke execute on function public.mfa_policy() from public, anon;
grant execute on function public.mfa_required_for(text), public.mfa_has_factor(), public.require_mfa(),
  public.generate_mfa_recovery_codes(), public.mfa_policy() to authenticated;
grant execute on function public.consume_mfa_recovery_code(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- HR operations that move money or people require a 2FA-satisfied session.
-- ---------------------------------------------------------------------------
create or replace function public.hr_distribute_allowances()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid := public.my_company_id();
  v_period text := to_char(now(), 'YYYY-MM');
  v_per_employee numeric;
  v_count int;
  v_total numeric;
  e record;
  p record;
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  perform public.require_mfa();
  if exists (select 1 from public.allowance_runs where company_id = v_company and period = v_period) then
    raise exception 'Les allocations de % ont déjà été distribuées', v_period;
  end if;
  select coalesce(sum(monthly_amount_usd), 0) into v_per_employee
    from public.benefit_policies where company_id = v_company and active;
  if v_per_employee <= 0 then raise exception 'Aucune allocation active dans la politique d''avantages'; end if;
  select count(*) into v_count from public.profiles
   where company_id = v_company and role = 'EMPLOYEE' and onboarded;
  if v_count = 0 then raise exception 'Aucun employé actif'; end if;
  v_total := v_per_employee * v_count;

  update public.companies set wallet_balance = wallet_balance - v_total
   where id = v_company and wallet_balance >= v_total;
  if not found then
    raise exception 'Budget insuffisant : % USD requis', v_total using errcode = 'P0001';
  end if;

  for e in select id from public.profiles where company_id = v_company and role = 'EMPLOYEE' and onboarded loop
    update public.profiles set wallet_balance = wallet_balance + v_per_employee where id = e.id;
    for p in select category, label, monthly_amount_usd from public.benefit_policies
              where company_id = v_company and active and monthly_amount_usd > 0 loop
      insert into public.transactions (user_id, company_id, amount, amount_usd, currency, type, status, category,
                                       description, created_by_id)
      values (e.id, v_company, p.monthly_amount_usd, p.monthly_amount_usd, 'USD', 'ALLOCATION', 'COMPLETED',
              p.category, 'Allocation ' || p.label || ' — ' || v_period, auth.uid());
    end loop;
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (e.id, 'REWARD', 'Allocations du mois reçues',
            v_per_employee || ' USD crédités par votre entreprise (' || v_period || ').', '/employee?section=wallet', auth.uid());
  end loop;

  insert into public.allowance_runs (company_id, period, employees, total_usd, run_by)
  values (v_company, v_period, v_count, v_total, auth.uid());
  return jsonb_build_object('ok', true, 'period', v_period, 'employees', v_count, 'total_usd', v_total);
end $$;

create or replace function public.hr_allocate(p_user_id uuid, p_amount_usd numeric, p_label text default 'Bonus')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id();
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  perform public.require_mfa();
  if p_amount_usd is null or p_amount_usd <= 0 or p_amount_usd > 10000 then raise exception 'Montant invalide'; end if;
  if not exists (select 1 from public.profiles where id = p_user_id and company_id = v_company and role in ('EMPLOYEE', 'HR_ADMIN')) then
    raise exception 'Employé introuvable dans votre entreprise' using errcode = '42501';
  end if;
  update public.companies set wallet_balance = wallet_balance - p_amount_usd
   where id = v_company and wallet_balance >= p_amount_usd;
  if not found then raise exception 'Budget entreprise insuffisant'; end if;
  update public.profiles set wallet_balance = wallet_balance + p_amount_usd where id = p_user_id;
  insert into public.transactions (user_id, company_id, amount, amount_usd, currency, type, status, category, description, created_by_id)
  values (p_user_id, v_company, p_amount_usd, p_amount_usd, 'USD', 'ALLOCATION', 'COMPLETED', 'BONUS',
          left(coalesce(nullif(btrim(p_label), ''), 'Bonus'), 120), auth.uid());
  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (p_user_id, 'REWARD', 'Vous avez reçu une allocation',
          p_amount_usd || ' USD — ' || coalesce(nullif(btrim(p_label), ''), 'Bonus'), '/employee?section=wallet', auth.uid());
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.hr_remove_employee(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid := public.my_company_id();
begin
  if public.my_role() <> 'HR_ADMIN' or v_company is null then
    raise exception 'Réservé aux administrateurs RH' using errcode = '42501';
  end if;
  perform public.require_mfa();
  if p_user_id = auth.uid() then raise exception 'Vous ne pouvez pas vous retirer vous-même'; end if;
  update public.profiles
     set company_id = null, role = 'MEMBER', account_type = 'particulier', department = null
   where id = p_user_id and company_id = v_company and role in ('EMPLOYEE', 'HR_ADMIN');
  if not found then raise exception 'Employé introuvable dans votre entreprise' using errcode = '42501'; end if;
  update public.companies set seats_used = greatest(seats_used - 1, 0) where id = v_company;
  insert into public.notifications (user_id, type, title, body, created_by_id)
  values (p_user_id, 'SYSTEM', 'Accès entreprise retiré',
          'Votre compte reste actif en tant que particulier.', auth.uid());
end $$;
