-- Subscription plan change prorating, cashback daily cap, invite hardening,
-- chat quota, SVG upload removal, annual price rule. Applied live via execute_sql.
-- (_activate_subscription, redeem_code and consume_invite_code full definitions
--  are in the live database; see git history of this file for the intent.)
create table if not exists public.invite_code_attempts (id bigserial primary key, ip text not null, created_at timestamptz not null default now());
create index if not exists invite_code_attempts_ip_idx on public.invite_code_attempts (ip, created_at desc);
alter table public.invite_code_attempts enable row level security;
create table if not exists public.chat_usage (user_id uuid not null, day date not null default current_date, calls int not null default 0, primary key (user_id, day));
alter table public.chat_usage enable row level security;
update storage.buckets set allowed_mime_types = array_remove(allowed_mime_types, 'image/svg+xml') where id = 'nelvin-public';
update public.plans set price_annual = round(price_monthly * 12 * 0.85) where price_monthly > 0;
alter table public.plans add constraint plans_annual_price_sane check (price_monthly = 0 or (price_annual >= price_monthly * 6 and price_annual < price_monthly * 12));
