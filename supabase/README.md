# Supabase setup

Sprig's cloud backend: Postgres (`entries` + `photos`), Storage (photo bytes),
and Auth (Milestone 6). The on-device SQLite database stays the source of truth
— this is backup + cross-device sync.

Nothing in the app talks to Supabase yet. Milestone 5c (sync queue) and
Milestone 6 (auth) are the first consumers. You can set this up now or when 5c
lands.

## 1. Create the project

1. <https://supabase.com> → **New project** (the free tier is enough).
2. Pick a region near you. Save the database password somewhere safe.

## 2. Apply the schema

Dashboard ▸ **SQL Editor** ▸ *New query*, then paste and **Run**, in order:

1. [`schema.sql`](./schema.sql) — tables, indexes, the new-user → profile
   trigger, and `enable row level security` on all three tables
2. [`policies.sql`](./policies.sql) — the own-rows-only policies + the private
   `entry-photos` Storage bucket

Both files are idempotent, so it's safe to re-run them after edits.

**About the pre-run warning:** the SQL editor flags both files for "destructive
operations" — that's the guarded `create or replace trigger` / `drop policy if
exists` lines, which only ever touch Sprig's own objects and recreate them
immediately. `schema.sql` no longer trips the "tables without RLS" warning (it
enables RLS itself). Both are expected; click through and run.

## 3. Point the app at it

Dashboard ▸ **Project Settings** ▸ **API** (labelled **Data API** on newer
projects):

| Dashboard value | Env var |
| --- | --- |
| Project URL | `EXPO_PUBLIC_SUPABASE_URL` |
| `anon` / `public` key (a.k.a. publishable) | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Put both in **`.env.local`** at the repo root (git-ignored — a plain `.env` is
*not*). See [`../.env.example`](../.env.example). Restart `npm start` after
changing env vars.

The `anon` key is meant to ship in a client app: every table has RLS, so it can
only ever read or write the signed-in user's own rows. Never commit the
**service role** key.

## Data model notes

- **Ids are client-minted** (`en_…`, `ph_…`, stored as `text`). A sync push is a
  plain `upsert` keyed by `id` — no server-side id remapping.
- **`updated_at` is owned by the client** for last-write-wins sync. There is no
  server trigger that overwrites it; the app sets it on every local edit.
- **Soft delete:** `entries.deleted_at` is set and the row is kept, so the
  tombstone syncs to other devices.
- **Photo bytes are not in Postgres.** They go to Storage at
  `entry-photos/${user_id}/${entry_id}/${photo_id}.jpg`; `photos.storage_path`
  and `photos.remote_url` point at them. The device-local `local_uri` /
  `thumbnail_uri` never leave the phone.
- `photos.user_id` is denormalised from the parent entry so per-user checks
  (and the Storage path prefix) stay single-column.
- **Sync ordering:** upsert an entry row before its photo rows (`photos.entry_id`
  has a foreign key to `entries.id`).

## Files

| File | |
| --- | --- |
| `schema.sql` | `profiles`, `entries`, `photos` tables (+ indexes, sign-up trigger) |
| `policies.sql` | RLS on all three (own-rows-only) + private `entry-photos` bucket & storage policies |
