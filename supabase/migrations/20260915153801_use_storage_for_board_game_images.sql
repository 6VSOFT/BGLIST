insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('board-game-images', 'board-game-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Signed-in staff can view board game images" on storage.objects;
drop policy if exists "Signed-in staff can upload board game images" on storage.objects;
drop policy if exists "Signed-in staff can update board game images" on storage.objects;
drop policy if exists "Signed-in staff can delete board game images" on storage.objects;

create policy "Signed-in staff can view board game images"
on storage.objects for select to authenticated
using (bucket_id = 'board-game-images');

create policy "Signed-in staff can upload board game images"
on storage.objects for insert to authenticated
with check (bucket_id = 'board-game-images');

create policy "Signed-in staff can update board game images"
on storage.objects for update to authenticated
using (bucket_id = 'board-game-images')
with check (bucket_id = 'board-game-images');

create policy "Signed-in staff can delete board game images"
on storage.objects for delete to authenticated
using (bucket_id = 'board-game-images');
