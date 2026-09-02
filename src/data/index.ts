/**
 * Single wiring point for the data layer.
 *
 * Today: the in-memory mock (persisted to AsyncStorage + FileSystem).
 * Milestone 5: swap these three bindings for the SQLite + Supabase impls.
 * Nothing else in the app imports from `./mock/*` directly.
 */

import { mockAuthService } from './mock/authService';
import { mockEntryRepository } from './mock/entryRepository';
import { mockPhotoRepository } from './mock/photoRepository';
import type { AuthService, EntryRepository, PhotoRepository } from './repositories';

export const entryRepository: EntryRepository = mockEntryRepository;
export const photoRepository: PhotoRepository = mockPhotoRepository;
export const authService: AuthService = mockAuthService;

export { TEST_EMAIL, TEST_PASSWORD } from './mock/authService';
export * from './repositories';
