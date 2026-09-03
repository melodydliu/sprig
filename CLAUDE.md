# Sprig — project notes for Claude

Personal foraging journal. Expo (managed) + expo-router + TypeScript. iOS Simulator
is the source of truth during the mock-data phase; keep everything web-compatible for
quick layout checks (`npm run web`).

## Architecture

- **UI never imports `src/data/mock/*` directly.** It talks only to the interfaces in
  `src/data/repositories.ts`, wired up in `src/data/index.ts`. Milestone 5 swaps the
  mock bindings for SQLite + Supabase without touching screens.
- **`src/features/entries/entriesStore.ts`** (zustand) holds every non-deleted entry in
  memory. Screens read from it and filter/sort client-side via
  `src/features/filters/query.ts` (pure, unit-tested) — no repo round-trip per keystroke.
- Real camera / photo library / GPS / maps from day one. Only auth, cloud storage and
  sync are stubbed.
- Mock persistence: entry metadata -> AsyncStorage (`src/data/mock/storage.ts`);
  photo bytes -> FileSystem `photos/` dir (`src/data/mock/photoRepository.ts`).

## Conventions

- Path alias `@/*` -> `src/*`, `@/assets/*` -> `assets/*`.
- Theme via `useTheme()` from `src/theme/ThemeProvider.tsx`; tokens in `src/theme/tokens.ts`.
  Never hardcode colors in components.
- Typography through `<Text variant="…">`; serif (Fraunces) for entry names + display,
  rounded sans (Nunito) for UI.
- Feature-first folders under `src/features/`; small components.

## Commands

- `npm run ios` — local dev build in the Simulator (no EAS, no Apple account).
- `npm run web` — layout checks in Chrome.
- `npm run seed-sim` — load placeholder photos + set GPS on the booted simulator.
- `npm run reset-data` — uninstall from the simulator so seed data rebuilds.
- `npm test` / `npm run typecheck`.

## Deferred until "ready to ship" (do not set up early)

EAS Build/Update, Apple Developer Program, TestFlight, Play, Android builds,
Google Maps API key, real Apple/Google sign-in.
