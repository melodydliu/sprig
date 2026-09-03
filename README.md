# Sprig 🌿

A personal foraging journal. Spot a plant on a roadside, capture it in a few
seconds (photo + a couple of details + location), and find it again later by
browsing a list or a map.

Built with **Expo (managed) + expo-router + TypeScript**, **Supabase** (auth /
Postgres / storage — added in a later milestone), **react-native-maps**, and a
local-first data layer.

---

## Status

**Milestone 5c — background sync to Supabase.**

Local SQLite (`sprig.db`) is the source of truth; every write is queued and
pushed in the background — photos to a private Storage bucket, rows to Postgres —
and remote changes are pulled back with last-write-wins. The network is never on
the UI's critical path. Until real auth (M6) the sync layer uses an **anonymous**
Supabase session for identity. With no Supabase keys set, the app runs exactly as
before, fully local. `npm run web` still runs on the in-memory mock.

| Milestone | What |
| --- | --- |
| 1 ✅ | Project + design system + stubbed sign-in + mock data + seed entries |
| 2 ✅ | Capture flow (camera / library / GPS) |
| 3 ✅ | Journal list, Map, Entry detail, filters / search / sort, Settings |
| 4 ✅ | (paused here for UI/UX feedback) |
| 5a ✅ | Real local DB — `expo-sqlite`, clean-seeded on first run |
| 5b ✅ | Supabase schema + RLS + storage policies |
| 5c ✅ | Photo upload + background sync queue (anonymous session for now) |
| 6 | Real auth (magic link, Apple, Google) |

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

## The test login

The sign-in screen is fully designed but not wired to a backend. Use:

```
test@sprig.app  /  sprig123
```

or tap any social button — all resolve to the same mock user. Auth lives behind
`AuthService` so Milestone 6 swaps in Supabase by touching one file.

---

## Cloud backend (Supabase)

Optional and not required for local development — the app runs fully on the
device SQLite database without it. To enable backup + sync,
[`supabase/README.md`](./supabase/README.md) walks through creating a free
project, applying `supabase/schema.sql` + `supabase/policies.sql`, enabling
anonymous sign-ins, and setting `EXPO_PUBLIC_SUPABASE_URL` /
`EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see `.env.example`). Once those
are set the app signs in anonymously and syncs in the background; the sync status
shows on the Journal and in Settings.

---

## Later milestones (not set up yet — will propose steps + costs first)

EAS Build/Update, Apple Developer Program, TestFlight, Google Play, Android
builds, Google Maps API key for Android, real Apple/Google sign-in.
