/**
 * Repository + service interfaces. The UI only ever talks to these.
 *
 * Milestone 1-4: implemented by the in-memory mock layer (`src/data/mock`).
 * Milestone 5+: implemented by expo-sqlite + a Supabase sync layer.
 * Swapping implementations must not touch any screen or component.
 */

import type { AuthUser, Category, ColorName, Entry, EntryDraft, GeoPoint } from '@/types/entry';

export type SortKey = 'newest' | 'oldest' | 'nearest' | 'name' | 'recently_updated';

export interface EntryFilter {
  categories: Category[];
  colors: ColorName[];
  tags: string[];
  favoritesOnly: boolean;
  /** ISO date (inclusive lower bound) for `sightedAt`. */
  dateFrom: string | null;
  /** ISO date (inclusive upper bound) for `sightedAt`. */
  dateTo: string | null;
  /** Radius filter, in miles, around `origin`. */
  withinMiles: number | null;
}

export interface EntryQuery {
  search?: string;
  filter?: EntryFilter;
  sort?: SortKey;
  /** Needed for `nearest` sort and the `withinMiles` filter. */
  origin?: GeoPoint | null;
}

/** A new photo to attach, sourced from camera or library. */
export interface PhotoInput {
  uri: string;
  width: number;
  height: number;
  takenAt?: string | null;
  /** EXIF GPS, if the source photo carried it. */
  exifLocation?: GeoPoint | null;
}

export interface EntryRepository {
  list(query?: EntryQuery): Promise<Entry[]>;
  get(id: string): Promise<Entry | null>;
  /** Persists a new entry locally and returns the stored row. */
  create(draft: EntryDraft, photos: PhotoInput[]): Promise<Entry>;
  update(id: string, patch: Partial<EntryDraft>): Promise<Entry>;
  /** Soft delete (sets `deletedAt`). */
  remove(id: string): Promise<void>;
  setFavorite(id: string, value: boolean): Promise<Entry>;
  addPhotos(id: string, photos: PhotoInput[]): Promise<Entry>;
  removePhoto(entryId: string, photoId: string): Promise<Entry>;
  reorderPhotos(entryId: string, photoIdsInOrder: string[]): Promise<Entry>;
  /** No-op for the mock; triggers a sync pass for the real impl. */
  sync(): Promise<void>;
  /** Dev helper — wipes local data and reloads the sample set. */
  resetToSampleData(): Promise<void>;
}

export interface PhotoRepository {
  /**
   * Copies a source image into app storage, downscaling to a max long edge and
   * generating a thumbnail. Returns local URIs + dimensions.
   */
  ingest(
    entryId: string,
    input: PhotoInput,
    sortOrder: number,
  ): Promise<{
    id: string;
    localUri: string;
    thumbnailUri: string;
    width: number;
    height: number;
    takenAt: string | null;
  }>;
  /** Best-effort removal of the on-disk files for a photo. */
  deleteFiles(localUri: string, thumbnailUri: string): Promise<void>;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithPassword(email: string, password: string): Promise<AuthUser>;
  signInWithApple(): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** Fires whenever the session changes; returns an unsubscribe fn. */
  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void;
}
