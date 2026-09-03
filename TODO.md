# Sprig — remaining work

Hand-off for a fresh session. Read `CLAUDE.md` (architecture/conventions) and
`README.md` (setup/run) first — this file only covers what's left.

Repo: `github.com/melodydliu/sprig` (private), branch `main`. Commit + push after
each milestone with a clear message (see existing history for style; keep the
`Co-Authored-By` / `Claude-Session` trailers).

---

## Status

Done — spec steps 2–4 (Milestones 1–4 in commit history):

- Expo SDK 57 / RN 0.86 / React 19 / expo-router / TypeScript. Local iOS dev-client
  build (`npm run ios`), no EAS.
- Design system, stubbed auth, **mock data layer** behind `EntryRepository` /
  `PhotoRepository` / `AuthService` (`src/data/repositories.ts`), wired in
  `src/data/index.ts`. UI never imports `src/data/mock/*`.
- Mock persistence: entry metadata → AsyncStorage (`sprig.mock.entries.v1`);
  photo files → `expo-file-system` `photos/` dir. Settings key `sprig.settings.v1`.
  Auth session `sprig.mock.session.v1`.
- 23 seed entries around Huntington Beach / OC with generated botanical
  placeholder photos. "Reset to sample data" in Settings + `npm run reset-data`.
- Screens: sign-in (stub, `test@sprig.app` / `sprig123`), Journal list + map
  (react-native-maps + supercluster), Capture (camera-first + library fallback +
  details sheet + shared `/location` picker), Entry detail (gallery, directions,
  favourite, share, delete), Edit (shared `<EntryFormFields>`), Filters (sheet
  with category / colour / tag type-ahead / favourites / date-captured presets /
  within-miles) + Sort sheet + search, Settings (units mi/km persisted, export
  JSON, sync-now stub, reset).
- `entriesStore` (zustand) holds all entries; `runQuery` in
  `src/features/filters/query.ts` does search/filter/sort client-side.
- Tests: `src/features/filters/query.test.ts`, `src/lib/geo.test.ts` — 25 passing.
- `Entry.syncStatus` (`pending` | `synced` | `error`) already exists; mock
  `entryRepository.sync()` just marks everything `synced`.

**Paused here** for UI/UX feedback before backend work (spec step 4).

---

## Milestone 5 — real local DB, then Supabase (spec step 5)

### 5a. Local SQLite as source of truth

- Add `expo-sqlite` (async API — `import { openDatabaseAsync }` / new API).
  Consider `drizzle-orm` + `drizzle-orm/expo-sqlite` only if it stays light;
  raw SQL wrapper is fine and preferred for "no over-engineering".
- New impls: `src/data/sqlite/entryRepository.ts`, `photoRepository.ts` that
  satisfy the same interfaces. Wire them in `src/data/index.ts` (one file change).
- Schema mirrors the data model in `src/types/entry.ts`:
  - `entries` table: all `Entry` columns; `colors` / `tags` / `photos` handled as
    a `photos` child table + JSON columns for `colors`/`tags` (or join tables —
    JSON is simpler and fine for a single-user local DB).
  - `photos` table: `id, entry_id, local_uri, remote_url, thumbnail_uri, width,
    height, taken_at, sort_order`.
  - `profiles` table (or keep in AsyncStorage until auth milestone).
  - Keep `sync_status` + `updated_at` on `entries` for the sync queue.
- Migration: on first run, if the AsyncStorage mock data exists, import it into
  SQLite once (nice-to-have; a clean seed is acceptable — confirm with user).
- Keep `resetToSampleData()` working (rebuild seed into SQLite).
- Photo files stay in the FileSystem `photos/` dir exactly as now; only the DB
  changes.
- Keep the image pipeline (resize 1600px long edge + thumbnail) from
  `src/data/mock/photoRepository.ts` — move it to a shared `src/lib/images.ts` so
  both local + upload paths use it.

### 5b. Supabase — give the user SQL + policies + `.env.example`

- Add `@supabase/supabase-js` + `react-native-url-polyfill/auto`.
- `src/lib/supabase.ts` — client from `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (already stubbed in `.env.example`).
- **Deliver to the user** (they run these in the Supabase dashboard):
  - `supabase/schema.sql` — `profiles`, `entries`, `photos` tables. `entries`
    and `photos` keyed by `user_id = auth.uid()`. Soft delete via `deleted_at`.
  - **RLS policies**: enable RLS on all three; policies so each user can only
    `select/insert/update/delete` their own rows (`auth.uid() = user_id`).
  - **Storage**: a private bucket `entry-photos`; storage policies so a user can
    only read/write objects under a `${auth.uid()}/…` prefix.
  - `supabase/README.md` — how to apply, how to get the URL + anon key.
- Update `.env.example` comments; document in `README.md`.

### 5c. Photo upload + sync queue (spec "Sync behavior" section)

- Local DB is the source of truth. Every write goes local first, then enqueued.
- Sync queue: a `sync_queue` table (or derive from `entries.sync_status =
  'pending'`). On a sync pass:
  1. For each pending entry, upload any photos without a `remote_url` to Storage
     (`${user_id}/${entry_id}/${photo_id}.jpg`), set `remote_url`.
  2. Upsert the entry row to Postgres.
  3. Mark `sync_status = 'synced'`; on failure mark `'error'` + keep for retry.
- Triggers: on app foreground, on connectivity regained
  (`@react-native-community/netinfo`), and after each save. Debounce.
- Conflict resolution: last-write-wins by `updated_at`. Keep simple.
- Pull: on sync, also fetch rows changed since last sync and merge (LWW).
- Never block UI on network. The existing unobtrusive Settings "sync status" +
  the small indicator idea from the spec — add a subtle top-of-Journal indicator.
- Wire `Settings → Sync now` and the pull-to-refresh on Journal to the real pass.
- **Add unit tests for the sync queue** (spec step 8): ordering, retry on error,
  LWW conflict, photo-before-row ordering.

---

## Milestone 6 — real auth (spec step 6)

- Replace `MockAuthService` with a Supabase-backed `AuthService` (same interface;
  one-file swap in `src/data/index.ts`). Remove the `EXPO_PUBLIC_SPRIG_DEV_AUTOLOGIN`
  hack in `authService`.
- Email **magic link** (deep link back into the app — `scheme: "sprig"` already
  set), **Sign in with Apple** (`expo-apple-authentication`), **Google**
  (`@react-native-google-signin/google-signin` or Supabase OAuth + `expo-auth-session`).
- On sign-in, create/load the `profiles` row (`display_name`,
  `default_map_region`).
- **Needs the user first** (spec step 9 — ask before app-store-level credentials):
  - Apple Developer Program membership ($99/yr) for the Sign in with Apple
    entitlement + a real dev build.
  - Google OAuth client IDs (iOS + web) in Google Cloud console.
  - Supabase Auth providers configured (Apple, Google, email).
- Until then, keep the test-credential stub as a fallback path.

---

## Milestone 7 — docs & "run on my phone" (spec step 7)

- `README.md` is mostly there; add the real Supabase config steps, the
  Google Maps API key step for Android, and Apple/Google sign-in setup once M6
  is scoped.
- Confirm the "how to run on my phone" section (Expo Go for a camera/GPS reality
  check; dev build via `npm run ios` as source of truth).

---

## Android (deferred until user says "ready to ship")

- No Android SDK installed on this machine. Needs Android Studio or EAS cloud
  builds, plus a Google Maps SDK key (`app.json` android config). The map code is
  already platform-split; `react-native-maps` on Android needs the key.

---

## Open UI/UX feedback from the pause (confirm with user)

Addressed already: filter sheet taps fixed, tag filter → type-ahead field,
"When" → "Date captured", Settings icon → gear, Forage → Sprig rebrand.

Still open (asked at the pause, not yet answered):

1. **Card height / density** — cards are airy. Tighten, or keep the breathing room?
2. **Capture speed** — keep camera → 1 shot → details → Save, or add a
   "shoot several then review" mode?
3. **Filter date presets** vs exact date range + a real "within X miles" slider.
4. **Map markers** — category-coloured pins (current) vs photo-thumbnail markers.
5. **Serif (Fraunces) for entry names** vs the rounded sans — landing right?
6. The "Asparagus Fern" test entry in the seed list is leftover test data;
   Reset to sample data clears it.

---

## How to work (constraints learned this project)

- **iOS Simulator is the source of truth.** `npm run ios` (local build, no EAS).
- **Synthetic taps are blocked** in this environment (no Accessibility / Screen
  Recording perms; `cliclick`/`osascript` clicks fail). Verify screens by:
  - `xcrun simctl io booted screenshot <file>` for screenshots,
  - temporary route redirects in `src/app/(app)/index.tsx` (revert with
    `git checkout --`, NOT hand-made backups — a backup bit us once),
  - `xcrun simctl ui booted appearance dark|light`,
  - `xcrun simctl privacy booted grant photos|camera|location-always com.sprig.app`,
  - `xcrun simctl location booted set 33.6595,-117.9988`.
  - Ask the user to tap-through the interactive bits (capture Save, gestures).
- This shell is **zsh** — unquoted `$var` does NOT word-split; use arrays.
- `npm run ios` first build is slow; `--clear` Metro rebuilds ~90s. Budget for it;
  bash tool times out at 2 min — run long builds with `run_in_background`.
- After adding a native module: `npx expo prebuild --clean` (or just add the
  config plugin) then rebuild.
- Run `npx tsc --noEmit`, `npx expo lint`, `npx jest` before every commit.
- `.env.local` (gitignored) with `EXPO_PUBLIC_SPRIG_DEV_AUTOLOGIN=1` skips the
  login wall during dev; remove before shipping.

## Confirm with the user before

- Adding any paid service or app-store-level credential (Apple Developer, Google
  OAuth, Supabase paid tier, EAS).
- Whether the SQLite migration should import existing mock data or start from a
  clean seed.
