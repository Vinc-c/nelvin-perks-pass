-- Scoped staff roles ("Nelvin agents"): MARKETING, FINANCE, SUPPORT, SALES.
-- Super admins stay in platform_admins; agents live in staff_members and get profiles.role = 'STAFF'.
-- Permissions are enforced by RLS / RPC checks via has_perm(), never only by the UI.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['EMPLOYEE','MEMBER','HR_ADMIN','MERCHANT','SUPER_ADMIN','admin','user','STAFF']));

create table if not exists public.staff_members (
  email text primary key,
  staff_role text not null check (staff_role in ('MARKETING','FINANCE','SUPPORT','SALES')),
  note text,
  added_by uuid,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.staff_members enable row level security;
drop policy if exists "staff_members: admin all" on public.staff_members;
create policy "staff_members: admin all" on public.staff_members for all
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.staff_members_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.email := lower(btrim(new.email));
  new.added_by := coalesce(new.added_by, auth.uid());
  new.updated_date := now();
  if tg_op = 'INSERT' then
    if exists (select 1 from public.platform_admins where email = new.email) then
      raise exception 'Cet email est déjà super admin';
    end if;
    if exists (select 1 from public.profiles where lower(email) = new.email and role in ('MERCHANT','HR_ADMIN','EMPLOYEE')) then
      raise exception 'Utilisez un compte dédié : cet email est déjà un compte marchand / RH / employé';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists staff_members_before_write on public.staff_members;
create trigger staff_members_before_write before insert or update on public.staff_members
  for each row execute function public.staff_members_before_write();

create or replace function public.staff_members_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'STAFF', onboarded = true
   where lower(email) = new.email and role not in ('SUPER_ADMIN','admin');
  perform public.audit(case when tg_op = 'INSERT' then 'staff.add' else 'staff.update' end, 'staff_members', new.email,
                       jsonb_build_object('staff_role', new.staff_role));
  return new;
end $$;
drop trigger if exists staff_members_after_write on public.staff_members;
create trigger staff_members_after_write after insert or update on public.staff_members
  for each row execute function public.staff_members_after_write();

create or replace function public.staff_members_after_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'MEMBER', onboarded = (account_type is not null)
   where lower(email) = old.email and role = 'STAFF';
  perform public.audit('staff.remove', 'staff_members', old.email, '{}'::jsonb);
  return old;
end $$;
drop trigger if exists staff_members_after_delete on public.staff_members;
create trigger staff_members_after_delete after delete on public.staff_members
  for each row execute function public.staff_members_after_delete();

-- A STAFF role can only be set while a staff_members row exists.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('SUPER_ADMIN', 'admin') and old.role is distinct from new.role
     and not exists (select 1 from public.platform_admins where email = lower(new.email)) then
    raise exception 'Le rôle super admin se gère depuis la liste des super admins' using errcode = '42501';
  end if;
  if new.role = 'STAFF' and old.role is distinct from new.role
     and not exists (select 1 from public.staff_members where email = lower(new.email)) then
    raise exception 'Le rôle agent se gère depuis la liste du personnel' using errcode = '42501';
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
     or new.created_date is distinct from old.created_date
     or (old.onboarded and not new.onboarded) then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;

-- Invited agents get their role at signup.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_ref uuid;
  v_is_admin boolean;
  v_is_staff boolean;
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
    nullif(new.raw_user_meta_data->>'phone', ''),
    new.raw_user_meta_data->>'avatar_url',
    public.gen_referral_code(), v_ref,
    case when v_is_admin then 'SUPER_ADMIN' when v_is_staff then 'STAFF' else 'MEMBER' end,
    v_is_admin or v_is_staff
  )
  on conflict (id) do nothing;
  return new;
end $$;

create or replace function public.my_staff_role() returns text
language sql stable security definer set search_path = '' as $$
  select case when public.is_admin() then 'SUPER_ADMIN'
    else (select s.staff_role from public.staff_members s join public.profiles p on lower(p.email) = s.email
           where p.id = auth.uid() and p.role = 'STAFF' and public.mfa_ok()) end
$$;

create or replace function public.has_perm(p_perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(case public.my_staff_role()
    when 'SUPER_ADMIN' then true
    when 'MARKETING' then p_perm in ('cms', 'blog')
    when 'FINANCE' then p_perm in ('finance')
    when 'SUPPORT' then p_perm in ('support')
    when 'SALES' then p_perm in ('promo')
    else false end, false)
$$;
revoke all on function public.my_staff_role() from public;
revoke all on function public.has_perm(text) from public;
grant execute on function public.my_staff_role() to anon, authenticated;
grant execute on function public.has_perm(text) to anon, authenticated;

-- Agents must enrol a second factor like super admins do.
update public.platform_settings
   set value = value || '"STAFF"'::jsonb
 where key = 'mfa_required_roles' and jsonb_typeof(value) = 'array' and not (value ? 'STAFF');

-- Marketing: CMS tables (+ blog). Old duplicate policies pointing at the legacy schema are dropped.
drop policy if exists "categories admin delete" on public.categories;
drop policy if exists "categories admin update" on public.categories;
drop policy if exists "categories admin write" on public.categories;
drop policy if exists "categories public read" on public.categories;
drop policy if exists "partner_logos admin delete" on public.partner_logos;
drop policy if exists "partner_logos admin update" on public.partner_logos;
drop policy if exists "partner_logos admin write" on public.partner_logos;
drop policy if exists "partner_logos public read active" on public.partner_logos;

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "partner_logos: admin write" on public.partner_logos;
create policy "partner_logos: admin write" on public.partner_logos for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "partner_logos: read" on public.partner_logos;
create policy "partner_logos: read" on public.partner_logos for select
  using (active or (select public.has_perm('cms')));
drop policy if exists "site_images: admin write" on public.site_images;
create policy "site_images: admin write" on public.site_images for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "site_images: read" on public.site_images;
create policy "site_images: read" on public.site_images for select
  using (active or (select public.has_perm('cms')));
drop policy if exists "site_copy: admin write" on public.site_copy;
create policy "site_copy: admin write" on public.site_copy for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "seo_pages: admin write" on public.seo_pages;
create policy "seo_pages: admin write" on public.seo_pages for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "site_banners: admin write" on public.site_banners;
create policy "site_banners: admin write" on public.site_banners for all
  using ((select public.has_perm('cms'))) with check ((select public.has_perm('cms')));
drop policy if exists "site_banners: public read live" on public.site_banners;
create policy "site_banners: public read live" on public.site_banners for select
  using ((active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())) or (select public.has_perm('cms')));
drop policy if exists "blog_posts: admin write" on public.blog_posts;
create policy "blog_posts: admin write" on public.blog_posts for all
  using ((select public.has_perm('blog'))) with check ((select public.has_perm('blog')));
drop policy if exists "blog_posts: public read published" on public.blog_posts;
create policy "blog_posts: public read published" on public.blog_posts for select
  using ((status = 'PUBLISHED' and coalesce(published_at, now()) <= now()) or (select public.has_perm('blog')));

-- Support: tickets.
drop policy if exists "support_tickets: read" on public.support_tickets;
create policy "support_tickets: read" on public.support_tickets for select
  using (user_id = (select auth.uid()) or (select public.has_perm('support')));
drop policy if exists "support_tickets: update" on public.support_tickets;
create policy "support_tickets: update" on public.support_tickets for update
  using (user_id = (select auth.uid()) or (select public.has_perm('support')))
  with check (user_id = (select auth.uid()) or (select public.has_perm('support')));
drop policy if exists "ticket_messages: read" on public.ticket_messages;
create policy "ticket_messages: read" on public.ticket_messages for select
  using (exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id
                  and (t.user_id = (select auth.uid()) or (select public.has_perm('support')))));
drop policy if exists "ticket_messages: write" on public.ticket_messages;
create policy "ticket_messages: write" on public.ticket_messages for insert
  with check (author_id = (select auth.uid()) and exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id
                  and (t.user_id = (select auth.uid()) or (select public.has_perm('support')))));

-- Finance: payout requests, withdrawals and the transaction ledger (read).
drop policy if exists "payout_requests: read" on public.payout_requests;
create policy "payout_requests: read" on public.payout_requests for select
  using (merchant_id = (select public.my_merchant_id()) or (select public.has_perm('finance')));
drop policy if exists "transactions: read" on public.transactions;
create policy "transactions: read" on public.transactions for select using (
  user_id = (select auth.uid())
  or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())
      and type = any (array['REDEMPTION','ALLOCATION','COMPANY_TOPUP','SUBSCRIPTION']))
  or (select public.has_perm('finance')));

-- Sales: promotions.
drop policy if exists "promo_orders: admin write" on public.promo_orders;
create policy "promo_orders: admin write" on public.promo_orders for all
  using ((select public.has_perm('promo'))) with check ((select public.has_perm('promo')));
drop policy if exists "promo_orders: read" on public.promo_orders;
create policy "promo_orders: read" on public.promo_orders for select
  using (merchant_id = (select public.my_merchant_id()) or (select public.has_perm('promo')));
drop policy if exists "promo_placements: admin write" on public.promo_placements;
create policy "promo_placements: admin write" on public.promo_placements for all
  using ((select public.has_perm('promo'))) with check ((select public.has_perm('promo')));

-- RPCs: swap the admin check for the matching permission (bodies are otherwise unchanged).
do $$
declare r record; def text;
begin
  for r in select * from (values
    ('public.admin_process_payout(uuid,boolean,text)'::regprocedure, 'finance'),
    ('public.admin_process_withdrawal(uuid,boolean,text)'::regprocedure, 'finance'),
    ('public.review_promo_order(uuid,text,text)'::regprocedure, 'promo')) as v(f, perm)
  loop
    def := pg_get_functiondef(r.f);
    if position('public.is_admin()' in def) = 0 then raise exception 'is_admin() not found in %', r.f; end if;
    def := replace(def, 'public.is_admin()', format('public.has_perm(%L)', r.perm));
    execute def;
  end loop;
end $$;

-- Every CMS change by an agent is written to the audit log.
create or replace function public.audit_cms_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare j jsonb := to_jsonb(coalesce(new, old));
begin
  perform public.audit('cms.' || lower(tg_op), tg_table_name,
    coalesce(j->>'id', j->>'key', j->>'value', j->>'slug', '?'), '{}'::jsonb);
  return coalesce(new, old);
end $$;
do $$
declare t text;
begin
  foreach t in array array['site_images','site_copy','site_banners','seo_pages','partner_logos','categories','blog_posts'] loop
    execute format('drop trigger if exists audit_cms_change on public.%I', t);
    execute format('create trigger audit_cms_change after insert or update or delete on public.%I for each row execute function public.audit_cms_change()', t);
  end loop;
end $$;
