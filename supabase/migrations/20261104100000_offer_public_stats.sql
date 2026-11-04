-- Aggregate, non-personal offer stats for the Trending / Recommended / New shelves and rating stars.
create or replace function public.offer_public_stats()
returns table (offer_id uuid, uses_30d int, uses_total int, rating_avg numeric, rating_count int)
language sql stable security definer set search_path to ''
as $$
  select o.id,
         coalesce(u.uses_30d, 0)::int,
         coalesce(u.uses_total, 0)::int,
         r.avg_rating,
         coalesce(r.n, 0)::int
    from public.offers o
    left join (
      select offer_id,
             count(*) filter (where redeemed_at > now() - interval '30 days') as uses_30d,
             count(*) as uses_total
        from public.redemptions where status = 'REDEEMED' group by offer_id
    ) u on u.offer_id = o.id
    left join (
      select offer_id, round(avg(rating)::numeric, 1) as avg_rating, count(*) as n
        from public.offer_reviews where not hidden group by offer_id
    ) r on r.offer_id = o.id
   where u.offer_id is not null or r.offer_id is not null;
$$;
revoke all on function public.offer_public_stats() from public;
grant execute on function public.offer_public_stats() to anon, authenticated;
