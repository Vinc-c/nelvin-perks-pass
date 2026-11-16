-- Marketing module: blog, promotional banners and per-page SEO overrides.
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 160),
  excerpt text check (char_length(excerpt) <= 300),
  body text not null default '',
  cover_url text,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED')),
  author text,
  published_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('HOME_TOP','HOME_MID','MEMBER_HOME','BLOG')),
  title text not null check (char_length(title) <= 120),
  subtitle text check (char_length(subtitle) <= 240),
  image_url text,
  cta_label text check (char_length(cta_label) <= 40),
  cta_url text check (cta_url is null or cta_url ~ '^(/|https://)'),
  active boolean not null default true,
  starts_at timestamptz, ends_at timestamptz,
  sort_order int not null default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create table if not exists public.seo_pages (
  path text primary key check (path like '/%'),
  title text check (char_length(title) <= 70),
  description text check (char_length(description) <= 170),
  og_image text,
  noindex boolean not null default false,
  updated_date timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
alter table public.site_banners enable row level security;
alter table public.seo_pages enable row level security;
create policy "blog_posts: public read published" on public.blog_posts for select to anon, authenticated
  using ((status = 'PUBLISHED' and coalesce(published_at, now()) <= now()) or (select public.is_admin()));
create policy "blog_posts: admin write" on public.blog_posts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "site_banners: public read live" on public.site_banners for select to anon, authenticated
  using ((active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())) or (select public.is_admin()));
create policy "site_banners: admin write" on public.site_banners for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "seo_pages: public read" on public.seo_pages for select to anon, authenticated using (true);
create policy "seo_pages: admin write" on public.seo_pages for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create trigger set_updated_date before update on public.blog_posts for each row execute function public.set_updated_date();
create trigger set_updated_date before update on public.site_banners for each row execute function public.set_updated_date();
create trigger set_updated_date before update on public.seo_pages for each row execute function public.set_updated_date();
create index if not exists blog_posts_pub_idx on public.blog_posts (status, published_at desc);
create index if not exists site_banners_place_idx on public.site_banners (placement, sort_order);
