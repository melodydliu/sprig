/**
 * Single wiring point for the data layer.
 *
 * Native (iOS/Android): SQLite is the on-device source of truth
 * (`src/data/sqlite`), photo bytes as files (`src/lib/images.ts`), auth +
 * cloud sync via Supabase (`src/data/supabase`, `src/features/sync`).
 * Web uses `index.web.ts` (mock layer) — `expo-sqlite` needs extra setup there
 * and web is only for layout checks.
 *
 * Nothing else in the app imports from `./sqlite/*`, `./supabase/*` or
 * `./mock/*` directly.
 */

import type { AuthService, EntryRepository, PhotoRepository } from './repositories';
import { sqliteEntryRepository } from './sqlite/entryRepository';
import { sqlitePhotoRepository } from './sqlite/photoRepository';
import { supabaseAuthService } from './supabase/authService';

export const entryRepository: EntryRepository = sqliteEntryRepository;
export const photoRepository: PhotoRepository = sqlitePhotoRepository;
export const authService: AuthService = supabaseAuthService;

export * from './repositories';
