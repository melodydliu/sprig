# Sprig 🌿

A personal foraging journal. Spot a plant on a roadside, capture it in a few
seconds (photo + a couple of details + location), and find it again later by
browsing a list or a map.

Built with **Expo (managed) + expo-router + TypeScript**, **Supabase** (auth /
Postgres / storage — added in a later milestone), **react-native-maps**, and a
local-first data layer.

---

## Status

**Live on TestFlight.** 🌿

The app is a local-first foraging journal: SQLite (`sprig.db`) is the source of
truth, and every write syncs in the background to a private Supabase project
(rows to Postgres, photos to a private Storage bucket) with last-write-wins.
Sign-in is **email + password** (Supabase Auth) behind a hard login wall; a new
account starts with an empty journal, and signing in on another device restores
it from the cloud. `npm run web` runs on the in-memory mock.

Bundle id is `com.sprigbook.app` (`com.sprig.app` was already taken). Build /
submit / TestFlight setup steps are in `TESTFLIGHT.md`; that build expires 90
days after submission — see `TODO.md` for the refresh command.

| Milestone | What |
| --- | --- |
| 1 ✅ | Project + design system + stubbed sign-in + mock data + seed entries |
| 2 ✅ | Capture flow (camera / library / GPS) |
| 3 ✅ | Journal list, Map, Entry detail, filters / search / sort, Settings |
| 4 ✅ | (paused here for UI/UX feedback) |
| 5a ✅ | Real local DB — `expo-sqlite` |
| 5b ✅ | Supabase schema + RLS + storage policies |
| 5c ✅ | Photo upload + background sync queue |
| 6 ✅ | Real auth — email + password, per-account local cache |
| 7 ✅ | Pre-flight cleanup → EAS Build → **TestFlight (internal)** |

---

## Run it on the iOS Simulator (primary dev loop)

No Apple Developer account, no EAS, no cost. You need **Xcode** with the
Command Line Tools and an iOS platform installed.

### One-time setup

1. Install **Xcode** from the Mac App Store.
2. `xcode-select --install`
3. Open Xcode once to accept the license and let it install components.
4. Install an iOS Simulator runtime if you don't have one:
   `xcodebuild -downloadPlatform iOS` (or Xcode ▸ Settings ▸ Components).
5. CocoaPods (used by the native build): `brew install cocoapods`
6. `npm install`

### Every time

```bash
npm run ios          # builds the dev client locally and launches the Simulator
```

The first build takes several minutes (it compiles the native project). After
that, `npm run ios` is fast, and JS changes hot-reload via Fast Refresh — just
edit and save.

Default simulator: **iPhone 17**. To pick another:
`npx expo run:ios --device "iPhone 17 Pro"`.

### Make the Simulator useful for testing

```bash
npm run seed-sim     # adds placeholder photos to the sim's photo library
                     # and sets the simulated GPS to Huntington Beach, CA
```

- **Camera** doesn't exist in the Simulator — the Capture flow falls back to the
  photo library automatically.
- **Location**: change the live fix any time via
  *Simulator ▸ Features ▸ Location ▸ Custom Location…* (Huntington Beach is
  `33.6595, -117.9988`).
- **Maps**: Apple Maps works in the Simulator with no API key.

### Reset the sample data

```bash
npm run reset-data   # uninstalls Sprig from the sim; next `npm run ios` re-seeds
```

Or, in the app: **Settings ▸ Developer ▸ Reset to sample data**.

---

## Quick layout checks in the browser

```bash
npm run web          # opens in Chrome; resize to phone width
```

Web is for typography/layout iteration only. The map screen shows a
"Map available on device" placeholder on web.

---

## Optional: reality check on a physical phone

Camera and GPS behave differently on real hardware. For a quick check you can run
the JS in **Expo Go** (free, from the App Store):

```bash
npm start            # then scan the QR code with Expo Go
```

Native modules that aren't in Expo Go won't work there — the Simulator dev build
is the source of truth.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run ios` | Local dev build + launch in the Simulator |
| `npm run web` | Web build for layout checks |
| `npm start` | Dev server for an existing dev build / Expo Go |
| `npm run seed-sim` | Seed the sim's photo library + GPS |
| `npm run reset-data` | Wipe local data (uninstall from sim) |
| `npm run gen-seed-images` | Regenerate the botanical placeholder photos |
| `npm test` | Unit tests (filter/sort/geo logic) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |

---

## Project layout

```
src/
  app/                 expo-router routes (thin)
    (auth)/sign-in     stubbed sign-in
    (app)/             journal, capture, entry/[id], settings
  theme/               design tokens + ThemeProvider (light/dark)
  components/           shared UI (Text, Button, Field, Screen, Toast, …)
  features/
    auth/              AuthService consumer + auth store
    entries/           entries store + cards / list / detail pieces
    filters/           pure search / filter / sort  (unit-tested)
    location/          useCurrentLocation (graceful degradation)
  data/
    repositories.ts    the interfaces the UI depends on
    index.ts           wiring point (mock today, Supabase later)
    mock/              in-memory + AsyncStorage + FileSystem + seed
  lib/                 geo, date formatting, ids
assets/seed/           bundled botanical placeholder photos
scripts/               seed-image generator, simulator helpers
```

## Signing in

Sign-in is real (Supabase email + password) behind a hard login wall, so the app
needs a configured Supabase project to run past the sign-in screen — set
`EXPO_PUBLIC_SUPABASE_*` in `.env.local` (see below), then create an account in
the app. Auth lives behind the `AuthService` interface (`src/data/repositories.ts`),
implemented by `src/data/supabase/authService.ts`; `npm run web` uses a mock that
accepts any credentials for layout checks.

---

## Cloud backend (Supabase)

Required for the app to run (auth + sync share the project). To set it up,
[`supabase/README.md`](./supabase/README.md) walks through creating a free
project, applying `supabase/schema.sql` + `supabase/policies.sql`, turning off
"Confirm email", adding the `sprig://reset-password` redirect URL, and setting
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
(see `.env.example`). Once those are set, create an account in the app; finds
sync in the background and the status shows on the Journal and in Settings.

---

## Later milestones (not set up yet — will propose steps + costs first)

EAS Build/Update, Google Play, Android builds, Google Maps API key for Android,
Sign in with Apple / Google, custom email (SMTP) for confirmation + reset.
See `TODO.md` for the TestFlight path.
