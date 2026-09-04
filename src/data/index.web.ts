/**
 * Web build of the data layer.
 *
 * `npm run web` is for typography/layout checks only (see README). `expo-sqlite`
 * needs extra Metro/wasm wiring on web that isn't worth setting up for that, so
 * web keeps running on the in-memory mock (AsyncStorage-persisted). Metro picks
 * this file over `index.ts` automatically for the web platform.
 */

import { mockAuthService } from './mock/authService';
import { mockEntryRepository } from './mock/entryRepository';
import { mockPhotoRepository } from './mock/photoRepository';
import type { AuthService, EntryRepository, PhotoRepository } from './repositories';

export const entryRepository: EntryRepository = mockEntryRepository;
export const photoRepository: PhotoRepository = mockPhotoRepository;
export const authService: AuthService = mockAuthService;

export * from './repositories';
