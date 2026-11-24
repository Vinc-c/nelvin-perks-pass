-- Hero videos: a dedicated public bucket (videos + images) that only admins can write to,
-- so the general upload bucket stays images-only for ordinary users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nelvin-media', 'nelvin-media', true, 52428800,
        array['video/mp4','video/webm','image/png','image/jpeg','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "nelvin-media: admin insert" on storage.objects;
drop policy if exists "nelvin-media: admin update" on storage.objects;
drop policy if exists "nelvin-media: admin delete" on storage.objects;
create policy "nelvin-media: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'nelvin-media' and (select public.is_admin()));
create policy "nelvin-media: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'nelvin-media' and (select public.is_admin()));
create policy "nelvin-media: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'nelvin-media' and (select public.is_admin()));

alter table public.site_images
  add column if not exists media_type text not null default 'image' check (media_type in ('image','video')),
  add column if not exists poster_url text;
