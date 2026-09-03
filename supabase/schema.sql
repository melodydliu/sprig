-- Sprig — database schema
-- ---------------------------------------------------------------------------
-- Apply in the Supabase dashboard: SQL Editor ▸ New query ▸ paste ▸ Run.
-- Run this file first, then policies.sql. Both are idempotent (safe to re-run).
--
-- The on-device SQLite database stays the source of truth; Postgres is backup
-- + cross-device sync (Milestone 5c). Auth arrives in Milestone 6.
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- profiles — one row per auth user
-- ===========================================================================
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text not null default '',
  default_map_region jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Create the profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- entries
-- ---------------------------------------------------------------------------
-- Ids are minted on-device (`en_…`, text), so a sync push is a plain upsert
-- keyed by id. `updated_at` is owned by the client for last-write-wins sync —
-- there is deliberately NO server trigger that overwrites it.
-- `sync_status` is a local-only concept and is not stored here.
-- ===========================================================================
create table if not exists public.entries (
  id              text primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text,
  category        text not null,
  colors          text[] not null default '{}',
  notes           text not null default '',
  location_lat    double precision,
  location_lng    double precision,
  location_source text,
  location_label  text,
  sighted_at      timestamptz not null,
  tags            text[] not null default '{}',
  is_favorite     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists entries_user_id_idx      on public.entries (user_id);
create index if not exists entries_user_updated_idx on public.entries (user_id, updated_at);
create index if not exists entries_user_sighted_idx on public.entries (user_id, sighted_at);

-- ===========================================================================
-- photos
-- ---------------------------------------------------------------------------
-- Photo *bytes* are not stored in Postgres. They live in Storage at
--   entry-photos/${user_id}/${entry_id}/${photo_id}.jpg
-- and `storage_path` / `remote_url` point at them. The device-local
-- `local_uri` / `thumbnail_uri` never leave the phone.
-- `user_id` is denormalised from the parent entry so per-user checks stay
-- single-column (and match the Storage path prefix).
-- ===========================================================================
create table if not exists public.photos (
  id           text primary key,
  entry_id     text not null references public.entries (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text,
  remote_url   text,
  width        integer not null default 0,
  height       integer not null default 0,
  taken_at     timestamptz,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists photos_entry_id_idx on public.photos (entry_id);
create index if not exists photos_user_id_idx  on public.photos (user_id);
