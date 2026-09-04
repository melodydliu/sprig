-- Sprig — database schema
-- ---------------------------------------------------------------------------
-- Apply in the Supabase dashboard: SQL Editor ▸ New query ▸ paste ▸ Run.
-- Run this file first, then policies.sql. Both are idempotent (safe to re-run).
--
-- The on-device SQLite database stays the source of truth; Postgres is backup
-- + cross-device sync (Milestone 5c). Auth arrives in Milestone 6.
--
-- The dashboard may warn about "destructive operations" (the guarded
-- `create or replace trigger` on auth.users — it replaces only Sprig's own
-- trigger). RLS is enabled on all three tables at the end of this file, so the
-- tables are never reachable without a policy; policies.sql adds those next.
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

create or replace trigger on_auth_user_created
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
  categories      text[] not null default '{}',
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

-- Migrating existing deployments: `category` (single) -> `categories` (array).
-- Safe to re-run — each statement is a no-op once already applied.
alter table public.entries add column if not exists categories text[] not null default '{}';
update public.entries set categories = array[category]
  where category is not null and categories = '{}';
alter table public.entries drop column if exists category;

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

-- ===========================================================================
-- Enable Row-Level Security immediately.
-- ---------------------------------------------------------------------------
-- With RLS on and no policies yet, every table is deny-all — safe. policies.sql
-- adds the own-rows-only policies (and the Storage bucket) next.
-- ===========================================================================
alter table public.profiles enable row level security;
alter table public.entries  enable row level security;
alter table public.photos   enable row level security;
