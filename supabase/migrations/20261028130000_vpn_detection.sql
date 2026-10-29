-- VPN / proxy detection. The `vpn-check` Edge Function records, per member, the
-- latest verdict for their current IP. A trigger refuses money-moving inserts
-- while a VPN was seen in the last hour; withdrawals additionally need a fresh
-- clean check (the app runs one right before). Admins are exempt.
create table if not exists public.ip_reputation (
  ip text primary key,
  is_vpn boolean not null,
  checked_at timestamptz not null default now()
);
alter table public.ip_reputation enable row level security;   -- service role only

create table if not exists public.network_checks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ip text,
  is_vpn boolean not null default false,
  checked_at timestamptz not null default now()
);
alter table public.network_checks enable row level security;
create policy "network_checks: own read" on public.network_checks for select to authenticated using (user_id = (select auth.uid()));
create policy "network_checks: admin read" on public.network_checks for select to authenticated using ((select public.is_admin()));

create or replace function public.enforce_no_vpn()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  c public.network_checks%rowtype;
  v_role text;
begin
  if new.user_id is null or new.status <> 'PENDING'
     or new.type not in ('RECHARGE','WITHDRAWAL','SUBSCRIPTION','COMPANY_TOPUP','GIFT') then
    return new;
  end if;
  select role into v_role from public.profiles where id = new.user_id;
  if v_role in ('SUPER_ADMIN','admin') then return new; end if;

  select * into c from public.network_checks where user_id = new.user_id;
  if found and c.is_vpn and c.checked_at > now() - interval '60 minutes' then
    raise exception 'VPN or proxy detected. Please turn it off and try again.' using errcode = 'P0001';
  end if;
  if new.type = 'WITHDRAWAL' and (not found or c.checked_at < now() - interval '30 minutes') then
    raise exception 'Network check required before a withdrawal. Please retry.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger enforce_no_vpn before insert on public.transactions
  for each row execute function public.enforce_no_vpn();
