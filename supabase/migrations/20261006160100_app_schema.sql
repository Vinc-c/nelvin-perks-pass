-- Nelvin Perks Pass — application schema.
--
-- Conventions (keep the frontend simple):
--   id uuid, created_date, updated_date, created_by_id (defaults to auth.uid()).
-- Enumerations are TEXT + CHECK constraints (easy to extend later).
-- Every table has RLS. Server-side logic (wallet, redemptions, payments) runs in
-- Edge Functions with the service role and the SECURITY DEFINER RPCs below.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_date fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_date()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_date := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Companies (B2B tenants)
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  logo_url text,
  plan_tier text not null default 'STARTER' check (plan_tier in ('STARTER','GROWTH','ENTERPRISE')),
  billing_cycle text not null default 'MONTHLY' check (billing_cycle in ('MONTHLY','ANNUAL')),
  max_employees numeric not null default 15,
  seats_used numeric not null default 0,
  subscription_status text not null default 'TRIAL' check (subscription_status in ('TRIAL','ACTIVE','PAST_DUE','CANCELLED')),
  country text,
  industry text,
  contact_email text,
  total_saved numeric not null default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

-- ---------------------------------------------------------------------------
-- Merchants (partner brands)
-- ---------------------------------------------------------------------------
create table public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'FOOD_DINING',
  city text not null default '',
  country text not null default '',
  address text,
  lat double precision,
  lng double precision,
  verified_status text not null default 'PENDING' check (verified_status in ('PENDING','VERIFIED','REJECTED')),
  logo_url text,
  rating numeric not null default 4.5,
  payout_balance numeric not null default 0,
  contact_email text,
  contact_name text,
  contact_phone text,
  description text,
  website text,
  instagram text,
  facebook text,
  whatsapp text,
  cover_image_url text,
  offer_headline text,
  offer_how_to_use text,
  product_image_url text,
  offer_redeemable text not null default 'BOTH' check (offer_redeemable in ('ONLINE','OFFLINE','BOTH')),
  offer_terms text,
  offer_expiry date,
  offer_countries text,
  application_notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

-- ---------------------------------------------------------------------------
-- Profiles (app users; 1-1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'MEMBER'
    check (role in ('EMPLOYEE','MEMBER','HR_ADMIN','MERCHANT','SUPER_ADMIN','admin','user')),
  account_type text check (account_type in ('particulier','marchand','entreprise')),
  onboarded boolean not null default false,
  company_id uuid references public.companies(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  wallet_balance numeric not null default 0 check (wallet_balance >= 0),
  wallet_currency text not null default 'USD',
  avatar_url text,
  country text,
  city text,
  notif_push boolean not null default true,
  notif_email boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index profiles_company_id_idx on public.profiles(company_id);
create index profiles_merchant_id_idx on public.profiles(merchant_id);
create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(lower(email));

-- ---------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so RLS policies can read the caller's
-- profile without recursing into profiles' own policies)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role in ('SUPER_ADMIN','admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.my_company_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_merchant_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select merchant_id from public.profiles where id = auth.uid()
$$;

-- True when running as the service role or a direct DB session (migrations,
-- SQL editor) — i.e. not an end-user request coming through the Data API.
create or replace function public.is_privileged_session()
returns boolean language sql stable set search_path = '' as $$
  select coalesce(auth.role(), 'service_role') = 'service_role'
      or current_user in ('postgres','supabase_admin')
$$;

-- ---------------------------------------------------------------------------
-- Remaining tables
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  value text not null unique,
  label text not null,
  emoji text,
  description text,
  image_url text,
  sort_order numeric not null default 0,
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null unique,
  target_email text,
  target_name text,
  role text not null default 'EMPLOYEE' check (role in ('EMPLOYEE','HR_ADMIN')),
  status text not null default 'PENDING' check (status in ('PENDING','USED','EXPIRED','REVOKED')),
  redeemed_by_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index invite_codes_company_id_idx on public.invite_codes(company_id);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'FOOD_DINING',
  discount_type text not null default 'PERCENTAGE' check (discount_type in ('PERCENTAGE','FIXED','CASHBACK','BOGO')),
  discount_value numeric,
  deal_terms text,
  target_audience text not null default 'ALL' check (target_audience in ('B2C','B2B_ONLY','ALL')),
  cashback_rate numeric not null default 0,
  image_url text,
  is_featured boolean not null default false,
  off_peak_hours text,
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index offers_merchant_id_idx on public.offers(merchant_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'SYSTEM'
    check (type in ('CASHBACK','RECHARGE','REDEMPTION','ANNOUNCEMENT','ALERT','REWARD','SYSTEM')),
  title text not null,
  body text,
  read boolean not null default false,
  link text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index notifications_user_id_idx on public.notifications(user_id, created_date desc);

create table public.partner_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  domain text,
  logo_url text,
  sort_order numeric not null default 0,
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,   -- keep history if an offer is deleted
  merchant_id uuid references public.merchants(id) on delete set null,
  code_used text not null unique,
  code_type text not null default 'QR' check (code_type in ('QR','TOTP')),
  status text not null default 'GENERATED' check (status in ('GENERATED','REDEEMED','EXPIRED','INVALID')),
  discount_applied numeric not null default 0,
  cashback_credited numeric not null default 0,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index redemptions_user_id_idx on public.redemptions(user_id, created_date desc);
create index redemptions_merchant_id_idx on public.redemptions(merchant_id, created_date desc);
create index redemptions_company_id_idx on public.redemptions(company_id);
create index redemptions_offer_id_idx on public.redemptions(offer_id);

create table public.sales_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  agent_name text not null,
  agent_email text,
  agent_phone text,
  region text,
  company_id uuid references public.companies(id) on delete set null,
  commission_rate numeric not null default 0.05,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','EXPIRED')),
  sales_count numeric not null default 0,
  total_revenue numeric not null default 0,
  total_commission numeric not null default 0,
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create table public.site_copy (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text,
  value text not null,
  section text not null default 'GENERAL' check (section in ('HERO','STATS','MARKETING','GENERAL')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create table public.site_images (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text,
  image_url text not null,
  section text not null default 'LANDING' check (section in ('HERO','LANDING','MARKETING','APP')),
  active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  plan_type text not null check (plan_type in ('PASS_BASIC','PASS_PREMIUM','PASS_VIP','STARTER','GROWTH','ENTERPRISE','MERCHANT_BASIC','MERCHANT_PRO')),
  billing_cycle text not null default 'MONTHLY' check (billing_cycle in ('MONTHLY','ANNUAL')),
  psp_used text check (psp_used in ('PADDLE','STRIPE','PAYSTACK','FLUTTERWAVE','PAYUNIT','CAMPAY','KORAPAY')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','TRIALING','PAST_DUE','CANCELLED')),
  amount numeric,
  currency text not null default 'USD',
  expires_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_company_id_idx on public.subscriptions(company_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  merchant_id uuid references public.merchants(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  amount numeric not null,
  cashback_amount numeric not null default 0,
  currency text not null default 'USD',
  psp_reference text unique,
  provider_ref text,            -- PSP-side id (Stripe session, Paddle txn…) stored server-side at checkout
  payment_method text check (payment_method in ('CARD','MOBILE_MONEY','BANK_TRANSFER','WALLET','APPLE_PAY','GOOGLE_PAY')),
  type text not null default 'REDEMPTION' check (type in ('REDEMPTION','RECHARGE','WITHDRAWAL','SUBSCRIPTION','PAYOUT')),
  status text not null default 'COMPLETED' check (status in ('PENDING','COMPLETED','FAILED','REFUNDED')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid default auth.uid()
);
create index transactions_user_id_idx on public.transactions(user_id, created_date desc);
create index transactions_company_id_idx on public.transactions(company_id, created_date desc);
create index transactions_merchant_id_idx on public.transactions(merchant_id);
create index transactions_offer_id_idx on public.transactions(offer_id);

-- updated_date triggers
do $$
declare t text;
begin
  foreach t in array array['companies','merchants','profiles','categories','invite_codes','offers',
    'notifications','partner_logos','redemptions','sales_codes','site_copy','site_images',
    'subscriptions','transactions']
  loop
    execute format('create trigger set_updated_date before update on public.%I
                    for each row execute function public.set_updated_date()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Profile bootstrap on signup (email/password or Google)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Keep profiles.email in sync when a user changes their email.
create or replace function public.handle_auth_user_email_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_auth_user_email_change();

-- Backfill profiles for accounts that already exist.
insert into public.profiles (id, email, full_name, phone)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
       nullif(u.raw_user_meta_data->>'phone', '')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Integrity guards (end users cannot escalate privileges or move money)
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_privileged_session() or public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.role is distinct from old.role
     or new.account_type is distinct from old.account_type
     or new.company_id is distinct from old.company_id
     or new.merchant_id is distinct from old.merchant_id
     or new.wallet_balance is distinct from old.wallet_balance
     or new.wallet_currency is distinct from old.wallet_currency
     or (old.onboarded and not new.onboarded) then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.guard_merchant_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if public.is_privileged_session() or public.is_admin() then
    return new;
  end if;
  if new.verified_status is distinct from old.verified_status
     or new.payout_balance is distinct from old.payout_balance
     or new.rating is distinct from old.rating then
    raise exception 'Not allowed to change protected merchant fields' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger guard_merchant_update before update on public.merchants
  for each row execute function public.guard_merchant_update();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.companies     enable row level security;
alter table public.merchants     enable row level security;
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.invite_codes  enable row level security;
alter table public.offers        enable row level security;
alter table public.notifications enable row level security;
alter table public.partner_logos enable row level security;
alter table public.redemptions   enable row level security;
alter table public.sales_codes   enable row level security;
alter table public.site_copy     enable row level security;
alter table public.site_images   enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions  enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "profiles: admin read" on public.profiles for select to authenticated
  using ((select public.is_admin()));
create policy "profiles: HR reads company members" on public.profiles for select to authenticated
  using ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles: admin update" on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "profiles: admin delete" on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- companies
create policy "companies: read" on public.companies for select to authenticated
  using ((select public.is_admin()) or id = (select public.my_company_id()));
create policy "companies: admin insert" on public.companies for insert to authenticated
  with check ((select public.is_admin()));
create policy "companies: admin update" on public.companies for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "companies: admin delete" on public.companies for delete to authenticated
  using ((select public.is_admin()));

-- merchants: verified brands are public; applicants see their own; admins see all
create policy "merchants: read" on public.merchants for select to anon, authenticated
  using (verified_status = 'VERIFIED'
         or id = (select public.my_merchant_id())
         or (select public.is_admin()));
create policy "merchants: admin insert" on public.merchants for insert to authenticated
  with check ((select public.is_admin()));
create policy "merchants: update" on public.merchants for update to authenticated
  using ((select public.is_admin()) or id = (select public.my_merchant_id()))
  with check ((select public.is_admin()) or id = (select public.my_merchant_id()));
create policy "merchants: admin delete" on public.merchants for delete to authenticated
  using ((select public.is_admin()));

-- categories: public catalogue, admin-managed
create policy "categories: read" on public.categories for select to anon, authenticated using (true);
create policy "categories: admin write" on public.categories for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- invite codes: HR of the company (and admins)
create policy "invite_codes: HR read" on public.invite_codes for select to authenticated
  using ((select public.is_admin())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())));
create policy "invite_codes: HR insert" on public.invite_codes for insert to authenticated
  with check ((select public.is_admin())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())));
create policy "invite_codes: HR update" on public.invite_codes for update to authenticated
  using ((select public.is_admin())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())))
  with check ((select public.is_admin())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())));
create policy "invite_codes: HR delete" on public.invite_codes for delete to authenticated
  using ((select public.is_admin())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id())));

-- offers: public catalogue of verified partners; merchant manages its own; admins all
create policy "offers: read" on public.offers for select to anon, authenticated
  using (exists (select 1 from public.merchants m where m.id = merchant_id and m.verified_status = 'VERIFIED')
         or merchant_id = (select public.my_merchant_id())
         or (select public.is_admin()));
create policy "offers: insert" on public.offers for insert to authenticated
  with check ((select public.is_admin()) or merchant_id = (select public.my_merchant_id()));
create policy "offers: update" on public.offers for update to authenticated
  using ((select public.is_admin()) or merchant_id = (select public.my_merchant_id()))
  with check ((select public.is_admin()) or merchant_id = (select public.my_merchant_id()));
create policy "offers: delete" on public.offers for delete to authenticated
  using ((select public.is_admin()) or merchant_id = (select public.my_merchant_id()));

-- notifications: own inbox
create policy "notifications: read" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "notifications: insert" on public.notifications for insert to authenticated
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "notifications: update own" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "notifications: delete own" on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- CMS (logos, images, copy): public read of active content, admin write
create policy "partner_logos: read" on public.partner_logos for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "partner_logos: admin write" on public.partner_logos for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "site_images: read" on public.site_images for select to anon, authenticated
  using (active or (select public.is_admin()));
create policy "site_images: admin write" on public.site_images for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "site_copy: read" on public.site_copy for select to anon, authenticated using (true);
create policy "site_copy: admin write" on public.site_copy for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- redemptions: member owner, merchant of the offer, HR of the company, admins.
-- Writes go through Edge Functions / RPCs only.
create policy "redemptions: read" on public.redemptions for select to authenticated
  using (user_id = (select auth.uid())
         or merchant_id = (select public.my_merchant_id())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id()))
         or (select public.is_admin()));

-- sales codes: admins only
create policy "sales_codes: admin" on public.sales_codes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- subscriptions: owner, HR of the company, admins (writes server-side)
create policy "subscriptions: read" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id()))
         or (select public.is_admin()));
create policy "subscriptions: admin write" on public.subscriptions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- transactions: owner, HR of the company, admins (writes server-side)
create policy "transactions: read" on public.transactions for select to authenticated
  using (user_id = (select auth.uid())
         or ((select public.my_role()) = 'HR_ADMIN' and company_id = (select public.my_company_id()))
         or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Client RPC: a member expires their own pending code when the timer ends
-- ---------------------------------------------------------------------------
create or replace function public.expire_my_redemption(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.redemptions
     set status = 'EXPIRED'
   where id = p_id and user_id = auth.uid() and status = 'GENERATED';
$$;

-- ---------------------------------------------------------------------------
-- Server RPCs (service role only) — atomic money movements
-- ---------------------------------------------------------------------------

-- Merchant validates a member's code: marks it redeemed, credits cashback,
-- records the transaction, accrues the merchant payout and notifies the member.
-- Row lock makes double redemption impossible.
create or replace function public.redeem_code(p_code text, p_merchant_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  r public.redemptions%rowtype;
  o public.offers%rowtype;
  v_discount numeric;
  v_cashback numeric;
begin
  select * into r from public.redemptions where code_used = upper(trim(p_code)) for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'INVALID'); end if;
  if r.status = 'REDEEMED' then return jsonb_build_object('ok', false, 'reason', 'ALREADY_USED'); end if;
  if r.status in ('EXPIRED','INVALID') or (r.expires_at is not null and r.expires_at < now()) then
    if r.status = 'GENERATED' then
      update public.redemptions set status = 'EXPIRED' where id = r.id;
    end if;
    return jsonb_build_object('ok', false, 'reason', 'EXPIRED');
  end if;

  select * into o from public.offers where id = r.offer_id;
  if not found or o.merchant_id is distinct from p_merchant_id then
    return jsonb_build_object('ok', false, 'reason', 'INVALID');
  end if;

  v_discount := coalesce(o.discount_value, 0);
  v_cashback := coalesce(o.cashback_rate, 0);

  update public.redemptions
     set status = 'REDEEMED', redeemed_at = now(),
         discount_applied = v_discount, cashback_credited = v_cashback
   where id = r.id;

  if v_cashback > 0 then
    update public.profiles set wallet_balance = wallet_balance + v_cashback where id = r.user_id;
    insert into public.transactions (user_id, company_id, merchant_id, offer_id, amount, cashback_amount,
                                     currency, type, status, created_by_id)
    values (r.user_id, r.company_id, p_merchant_id, o.id, v_discount, v_cashback,
            'USD', 'REDEMPTION', 'COMPLETED', r.user_id);
    insert into public.notifications (user_id, type, title, body, link, created_by_id)
    values (r.user_id, 'CASHBACK', 'Cashback crédité',
            v_cashback || ' de cashback pour « ' || o.title || ' » ajouté à votre wallet.',
            '/wallet-activity', r.user_id);
  end if;

  update public.merchants set payout_balance = payout_balance + v_discount where id = p_merchant_id;

  if r.company_id is not null and v_cashback > 0 then
    update public.companies set total_saved = total_saved + v_cashback where id = r.company_id;
  end if;

  return jsonb_build_object('ok', true, 'code', r.code_used, 'offer_title', o.title,
                            'discount_applied', v_discount, 'cashback_credited', v_cashback);
end $$;

-- Confirms a PENDING recharge exactly once and credits the wallet.
create or replace function public.complete_recharge(p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  t public.transactions%rowtype;
  v_balance numeric;
begin
  select * into t from public.transactions
   where psp_reference = p_reference and type = 'RECHARGE' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Transaction introuvable'); end if;
  if t.status = 'COMPLETED' then
    select wallet_balance into v_balance from public.profiles where id = t.user_id;
    return jsonb_build_object('ok', true, 'status', 'already_completed', 'balance', v_balance,
                              'amount', t.amount, 'currency', t.currency, 'transactionId', t.id);
  end if;
  if t.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'error', 'Transaction non éligible (' || t.status || ')');
  end if;

  update public.transactions set status = 'COMPLETED' where id = t.id;
  update public.profiles
     set wallet_balance = wallet_balance + t.amount, wallet_currency = t.currency
   where id = t.user_id
   returning wallet_balance into v_balance;

  insert into public.notifications (user_id, type, title, body, link, created_by_id)
  values (t.user_id, 'RECHARGE', 'Recharge confirmée',
          'Votre wallet a été rechargé de ' || t.amount || ' ' || t.currency || '.',
          '/wallet-activity', t.user_id);

  return jsonb_build_object('ok', true, 'status', 'completed', 'balance', v_balance,
                            'amount', t.amount, 'currency', t.currency, 'transactionId', t.id);
end $$;

-- Debits the wallet atomically (never below zero) and records the withdrawal.
create or replace function public.withdraw_from_wallet(
  p_user_id uuid, p_amount numeric, p_currency text, p_method text, p_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_balance numeric;
  v_company uuid;
  v_tx uuid;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('ok', false, 'error', 'Montant invalide');
  end if;
  update public.profiles
     set wallet_balance = wallet_balance - p_amount
   where id = p_user_id and wallet_balance >= p_amount
   returning wallet_balance, company_id into v_balance, v_company;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Solde insuffisant');
  end if;
  insert into public.transactions (user_id, company_id, amount, currency, psp_reference,
                                   payment_method, type, status, created_by_id)
  values (p_user_id, v_company, p_amount, p_currency, p_reference, p_method,
          'WITHDRAWAL', 'COMPLETED', p_user_id)
  returning id into v_tx;
  return jsonb_build_object('ok', true, 'balance', v_balance, 'transactionId', v_tx);
end $$;

-- Atomically consumes an invite code and links the user to the company.
create or replace function public.consume_invite_code(p_code_id uuid, p_user_id uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  i public.invite_codes%rowtype;
begin
  select * into i from public.invite_codes where id = p_code_id for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'Invalid invite code'); end if;
  if i.status <> 'PENDING' then
    return jsonb_build_object('ok', false, 'error', 'This invite code is no longer available');
  end if;
  if i.expires_at is not null and i.expires_at < now() then
    update public.invite_codes set status = 'EXPIRED' where id = i.id;
    return jsonb_build_object('ok', false, 'error', 'This invite code has expired');
  end if;
  if i.target_email is not null and i.target_email <> ''
     and lower(i.target_email) <> lower(coalesce(p_email, '')) then
    return jsonb_build_object('ok', false, 'error', 'This invite code is not for your account');
  end if;

  update public.profiles
     set company_id = i.company_id, role = i.role, account_type = 'entreprise'
   where id = p_user_id and role not in ('SUPER_ADMIN','admin');
  update public.invite_codes set status = 'USED', redeemed_by_id = p_user_id where id = i.id;
  update public.companies set seats_used = seats_used + 1 where id = i.company_id;

  return jsonb_build_object('ok', true, 'company_id', i.company_id, 'role', i.role);
end $$;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
revoke execute on function public.redeem_code(text, uuid) from public, anon, authenticated;
revoke execute on function public.complete_recharge(text) from public, anon, authenticated;
revoke execute on function public.withdraw_from_wallet(uuid, numeric, text, text, text) from public, anon, authenticated;
revoke execute on function public.consume_invite_code(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_email_change() from public, anon, authenticated;
revoke execute on function public.expire_my_redemption(uuid) from public, anon;
grant execute on function public.expire_my_redemption(uuid) to authenticated;
grant execute on function public.redeem_code(text, uuid) to service_role;
grant execute on function public.complete_recharge(text) to service_role;
grant execute on function public.withdraw_from_wallet(uuid, numeric, text, text, text) to service_role;
grant execute on function public.consume_invite_code(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime (live notification badge)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for logos, covers, offer visuals, CMS images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nelvin-public', 'nelvin-public', true, 10485760,
        array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "nelvin-public read" on storage.objects;
drop policy if exists "nelvin-public insert" on storage.objects;
drop policy if exists "nelvin-public update" on storage.objects;
drop policy if exists "nelvin-public delete" on storage.objects;

-- Public bucket: objects are served by URL without a SELECT policy, so no
-- broad listing policy is needed.
create policy "nelvin-public: authenticated upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'nelvin-public');
-- Anonymous partner applicants may only upload into applications/.
create policy "nelvin-public: anon application upload" on storage.objects for insert to anon
  with check (bucket_id = 'nelvin-public' and (storage.foldername(name))[1] = 'applications');
create policy "nelvin-public: owner or admin update" on storage.objects for update to authenticated
  using (bucket_id = 'nelvin-public' and (owner_id = (select auth.uid())::text or (select public.is_admin())));
create policy "nelvin-public: owner or admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'nelvin-public' and (owner_id = (select auth.uid())::text or (select public.is_admin())));
