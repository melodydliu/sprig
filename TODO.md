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

Done — spec step 5a (this session):

- **Local SQLite is the on-device source of truth.** `expo-sqlite` (`sprig.db`),
  raw-SQL wrapper (no ORM). New impls in `src/data/sqlite/` (`db.ts` +
  `PRAGMA user_version` migration runner, `schema.ts`, pure `mappers.ts`,
  `entryRepository.ts`, `photoRepository.ts`). Wired in `src/data/index.ts`;
  `src/data/index.web.ts` keeps web on the mock.
- Schema: `entries` (all `Entry` columns; `colors`/`tags` as JSON text,
  `location` split into `location_lat`/`location_lng`, `sync_status` +
  `updated_at` kept), `photos` child table (FK + `ON DELETE CASCADE`), `meta`
  (`seeded` flag). No `profiles` table yet — profile still comes from
  `mockAuthService` until M6.
- **Clean seed on first run** (user's call — no AsyncStorage import path).
  `resetToSampleData()` rebuilds the seed into SQLite.
- Image pipeline moved to shared `src/lib/images.ts`; seed moved to
  backend-neutral `src/data/seed.ts`. Mock files kept as thin re-exports.
- `entryRepository.sync()` still just marks rows `synced` (real pass is 5c).
- Tests: `src/data/sqlite/mappers.test.ts` (11 cases). 36 passing total.

Done — spec step 5b (this session):

- `@supabase/supabase-js` + `react-native-url-polyfill` added (both JS-only, no
  native rebuild). `src/lib/supabase.ts` — nullable client from the env vars +
  `isSupabaseConfigured` guard. **No consumer yet** (5c / M6).
- `supabase/schema.sql` — `profiles` / `entries` / `photos`, client-minted
  `text` ids, `text[]` for colors/tags, `location` split lat/lng, soft delete,
  new-user→profile trigger. **No server `updated_at` trigger** — client owns it
  for LWW.
- `supabase/policies.sql` — RLS own-rows-only on all three + private
  `entry-photos` bucket with `${uid}/…` prefix storage policies. Idempotent
  (drop-if-exists before each).
- `supabase/README.md` — create project, apply order, where to find URL + anon
  key. `.env.example` + `README.md` updated.

Done — spec step 5c (this session):

- **`src/features/sync/`** — the engine. `plan.ts` (pure: `planPush` oldest-first,
  `planPhotoUploads`, `mergeRemote` LWW, `storagePath`), `remoteMappers.ts` (local
  ↔ Postgres row shapes), `identity.ts` (`getSyncUserId` → cached anonymous
  session), `syncStore.ts` (`useSync` zustand), `engine.ts`
  (`createSyncEngine(deps)` — injectable deps, `runOnce` / `requestSync` (2s
  debounce, coalesced) / `syncNow` / `refreshPending`), `local.ts` + `remote.ts`
  (the concrete deps halves), `useSyncBootstrap.ts` (initial sync + AppState
  foreground + `startAutoRefresh`), `components/SyncStatusBar.tsx`.
- Push: photos → Storage (`${uid}/${entryId}/${photoId}.jpg`, private bucket,
  signed URL back) **before** the entry upsert, then photo rows + prune removed,
  then tombstone storage cleanup. Success → `synced`; failure → `error`, retried
  next pass. Pull: `entries` + nested `photos` changed since `meta.last_pulled_at`,
  merged LWW; pulled photos render from a signed URL.
- Derive the pending set from `entries.sync_status != 'synced'` — **no
  `sync_queue` table**, no new SQLite migration.
- **Identity = anonymous Supabase session** (user's call; real auth is M6).
  Needs "Anonymous sign-ins" enabled in the dashboard.
- **No NetInfo** (user's call). Triggers: after each save (debounced), app
  foreground, manual "Sync now" / pull-to-refresh.
- Removed `sync()` from the `EntryRepository` interface + both impls; extracted
  the shared read path to `src/data/sqlite/read.ts`.
- Wired: `entriesStore` writes → `requestSync()`; `(app)/_layout` →
  `useSyncBootstrap()`; Journal → `<SyncStatusBar/>` + pull-to-refresh; Settings
  "Sync" section reads `useSync`, "Sync now" → `syncEngine.syncNow()`.
- Tests: `plan.test.ts`, `remoteMappers.test.ts`, `engine.test.ts` (fake deps:
  photo-before-row ordering, retry, LWW pull, push order, tombstone). 54 passing.

---

## Milestone 5 — Supabase (spec step 5, continued)

### 5a. Local SQLite as source of truth — DONE (see above)

### 5b. Supabase SQL + policies + client — DONE (see above)

### 5c. Photo upload + sync queue — DONE (see above)

---

## Milestone 6 — real auth — DONE (email + password)

Done this session:

- `src/data/supabase/authService.ts` (`supabaseAuthService`) implements a
  reworked `AuthService`: `signUp` / `signIn` / `signOut` / `sendPasswordReset`
  / `updatePassword` / `getCurrentUser` / `onAuthStateChange`. Loads/creates the
  `profiles` row. `authErrors.ts` — friendly message mapping (pure, tested).
- Bound in `src/data/index.ts`; web stays on `MockAuthService` (reworked to the
  new interface, accepts any credentials for layout checks).
- **Hard login wall.** `src/app/(auth)/sign-in.tsx` rebuilt: email/password with
  a Sign in ⇄ Create account toggle, inline validation, "Forgot password?".
  Apple/Google buttons + the test-login hint removed.
- `src/app/reset-password.tsx` (root route, outside both guards): request-link
  view + `sprig://reset-password` deep-link handler → set-new-password.
- **Per-account local data.** `meta.sync_user_id`;
  `resolveLocalForUser` (pure, in `plan.ts`) + `reconcileLocalAccount`
  (`src/features/sync/account.ts`) — sign-in as a different user, or sign-out,
  wipes the local SQLite cache; the next sync pass re-pulls from the cloud.
  Wired from `authStore` on every auth-state change; `entriesStore.reset()`.
- `src/features/sync/identity.ts` — `getSyncUserId()` now just reads the
  session; anonymous sign-in removed.
- **Auto-seed removed.** A real account starts with an empty journal.
  `resetToSampleData()` (Settings ▸ Developer, `npm run reset-data`) still loads
  the demo set. Removed `EXPO_PUBLIC_SPRIG_DEV_AUTOLOGIN`.
- Tests: `authErrors.test.ts`, `account.test.ts` (+ existing). 59 passing.

**User did:** Apple Developer Program enrolled. Supabase email provider is on.

**User still needs (before this build is fully usable):**
- Supabase ▸ Authentication ▸ Providers ▸ Email ▸ **turn OFF "Confirm email"**
  (built-in mailer is rate-limited; custom SMTP + confirmation is a pre-public
  item — see Phase 2).
- Supabase ▸ Authentication ▸ URL Configuration ▸ add redirect
  `sprig://reset-password`.

Deferred: phone/SMS auth (paid SMS provider), Sign in with Apple / Google
(post-launch), account deletion real flow (Phase 2).

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
