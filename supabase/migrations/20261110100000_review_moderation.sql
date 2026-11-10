-- Review moderation (back-office) + merchant → member reviews.

-- 1. Member → merchant/offer reviews get a moderation status.
alter table public.offer_reviews
  add column if not exists status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  add column if not exists admin_note text,
  add column if not exists original_comment text,
  add column if not exists reviewed_at timestamptz;
update public.offer_reviews set status = case when hidden then 'REJECTED' else 'APPROVED' end where status = 'PENDING' and created_date < now();

drop policy if exists "offer_reviews: read" on public.offer_reviews;
create policy "offer_reviews: read" on public.offer_reviews for select to anon, authenticated
  using ((status = 'APPROVED' and not hidden) or user_id = (select auth.uid()) or (select public.is_admin()));

create or replace function public.offer_review_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  select merchant_id into new.merchant_id from public.offers where id = new.offer_id;
  if tg_op = 'INSERT' then
    select coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Membre')
           || coalesce(' ' || nullif(left(split_part(btrim(full_name), ' ', 2), 1), '') || '.', '')
      into v_name from public.profiles where id = new.user_id;
    new.author_name := coalesce(v_name, 'Membre');
    new.status := 'PENDING'; new.hidden := false; new.admin_note := null; new.original_comment := null;
  else
    new.user_id := old.user_id;
    new.offer_id := old.offer_id;
    new.author_name := old.author_name;
    if public.is_admin() then
      new.hidden := (new.status = 'REJECTED');
      if new.comment is distinct from old.comment and old.original_comment is null then new.original_comment := old.comment; end if;
      if new.status is distinct from old.status then new.reviewed_at := now(); end if;
    else
      -- The author can edit; any change sends the review back to moderation.
      new.hidden := old.hidden; new.admin_note := old.admin_note; new.original_comment := old.original_comment; new.reviewed_at := old.reviewed_at;
      new.status := case when new.rating is distinct from old.rating or new.comment is distinct from old.comment then 'PENDING' else old.status end;
    end if;
  end if;
  return new;
end $$;

create or replace function public.refresh_merchant_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_merchant uuid := coalesce(new.merchant_id, old.merchant_id);
begin
  update public.merchants m
     set rating = s.avg_rating, reviews_count = s.n
    from (select round(avg(rating)::numeric, 1) as avg_rating, count(*)::int as n
            from public.offer_reviews where merchant_id = v_merchant and not hidden and status = 'APPROVED') s
   where m.id = v_merchant;
  return null;
end $$;

-- 2. Merchant → member reviews (private: author + back-office only).
create table if not exists public.member_reviews (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redemption_id uuid not null references public.redemptions(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  admin_note text,
  original_comment text,
  reviewed_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (redemption_id)
);
create index if not exists member_reviews_user_idx on public.member_reviews(user_id);
create index if not exists member_reviews_merchant_idx on public.member_reviews(merchant_id);
create trigger set_updated_date before update on public.member_reviews
  for each row execute function public.set_updated_date();
alter table public.member_reviews enable row level security;
create policy "member_reviews: read" on public.member_reviews for select to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "member_reviews: merchant insert" on public.member_reviews for insert to authenticated
  with check (author_id = (select auth.uid())
              and merchant_id = (select public.my_merchant_id())
              and exists (select 1 from public.redemptions r
                           where r.id = redemption_id and r.merchant_id = member_reviews.merchant_id
                             and r.user_id = member_reviews.user_id and r.status = 'REDEEMED'));
create policy "member_reviews: author or admin update" on public.member_reviews for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "member_reviews: admin delete" on public.member_reviews for delete to authenticated
  using ((select public.is_admin()));

create or replace function public.member_review_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.status := 'PENDING'; new.admin_note := null; new.original_comment := null; new.author_id := auth.uid();
  else
    new.merchant_id := old.merchant_id; new.user_id := old.user_id; new.redemption_id := old.redemption_id; new.author_id := old.author_id;
    if public.is_admin() then
      if new.comment is distinct from old.comment and old.original_comment is null then new.original_comment := old.comment; end if;
      if new.status is distinct from old.status then new.reviewed_at := now(); end if;
    else
      new.admin_note := old.admin_note; new.original_comment := old.original_comment; new.reviewed_at := old.reviewed_at;
      new.status := case when new.rating is distinct from old.rating or new.comment is distinct from old.comment then 'PENDING' else old.status end;
    end if;
  end if;
  return new;
end $$;
create trigger member_review_before_write before insert or update on public.member_reviews
  for each row execute function public.member_review_before_write();
