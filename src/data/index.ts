/**
 * Single wiring point for the data layer.
 *
 * Native (iOS/Android): SQLite is the on-device source of truth
 * (`src/data/sqlite`). Photo bytes still live as files via `src/lib/images.ts`.
 * Auth stays the mock until Milestone 6 — one more binding to swap here.
 * Web uses `index.web.ts` (mock layer) since `expo-sqlite` needs extra setup
 * there and web is only for layout checks.
 *
 * Nothing else in the app imports from `./sqlite/*` or `./mock/*` directly.
 */

import { mockAuthService } from './mock/authService';
import type { AuthService, EntryRepository, PhotoRepository } from './repositories';
import { sqliteEntryRepository } from './sqlite/entryRepository';
import { sqlitePhotoRepository } from './sqlite/photoRepository';

export const entryRepository: EntryRepository = sqliteEntryRepository;
export const photoRepository: PhotoRepository = sqlitePhotoRepository;
export const authService: AuthService = mockAuthService;

export { TEST_EMAIL, TEST_PASSWORD } from './mock/authService';
export * from './repositories';
