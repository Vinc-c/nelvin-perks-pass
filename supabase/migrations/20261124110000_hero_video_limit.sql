-- At most 3 hero videos (MP4/WebM, 5 MB each is enforced at upload; bucket cap stays 10 MB for images).
create or replace function public.site_images_hero_video_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.media_type = 'video' and (new.section = 'HERO' or lower(new.key) like 'hero%background%') then
    if (select count(*) from public.site_images
         where media_type = 'video' and (section = 'HERO' or lower(key) like 'hero%background%') and id is distinct from new.id) >= 3 then
      raise exception 'Maximum 3 hero videos: delete one first' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists site_images_hero_video_limit on public.site_images;
create trigger site_images_hero_video_limit before insert or update of media_type, section, key on public.site_images
  for each row execute function public.site_images_hero_video_limit();
update storage.buckets set file_size_limit = 10485760 where id = 'nelvin-media';
