-- Sprig — Row-Level Security + Storage policies
-- ---------------------------------------------------------------------------
-- Apply AFTER schema.sql. Idempotent: every policy is dropped-if-exists first,
-- so this file is safe to re-run after edits.
--
-- Rule for every table: a user can only see and change their own rows
-- (auth.uid() = user_id). The `anon` key is therefore safe to ship in the app.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- profiles
-- ===========================================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ===========================================================================
-- entries
-- ===========================================================================
alter table public.entries enable row level security;

drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own" on public.entries
  for select using (auth.uid() = user_id);

drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own" on public.entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own" on public.entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
create policy "entries_delete_own" on public.entries
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- photos
-- ===========================================================================
alter table public.photos enable row level security;

drop policy if exists "photos_select_own" on public.photos;
create policy "photos_select_own" on public.photos
  for select using (auth.uid() = user_id);

drop policy if exists "photos_insert_own" on public.photos;
create policy "photos_insert_own" on public.photos
  for insert with check (auth.uid() = user_id);

drop policy if exists "photos_update_own" on public.photos;
create policy "photos_update_own" on public.photos
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_delete_own" on public.photos
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- Storage: private bucket `entry-photos`
-- ---------------------------------------------------------------------------
-- Objects are keyed  ${user_id}/${entry_id}/${photo_id}.jpg
-- so the first path segment is the owner's uid.
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('entry-photos', 'entry-photos', false)
on conflict (id) do nothing;

drop policy if exists "entry_photos_select_own" on storage.objects;
create policy "entry_photos_select_own" on storage.objects
  for select using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_insert_own" on storage.objects;
create policy "entry_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_update_own" on storage.objects;
create policy "entry_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_delete_own" on storage.objects;
create policy "entry_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
