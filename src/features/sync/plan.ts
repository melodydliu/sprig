import type { Entry, Photo } from '@/types/entry';

/**
 * Pure sync-planning helpers — no I/O, no Supabase, no SQLite. This is the part
 * the unit tests exercise directly.
 *
 * Conflict resolution is last-write-wins on the ISO `updatedAt` string (ISO-8601
 * with a fixed offset sorts lexicographically the same as chronologically).
 */

/** Entries that still need pushing, oldest edit first so pushes replay in order. */
export function planPush(local: Entry[]): Entry[] {
  return local
    .filter((e) => e.syncStatus !== 'synced')
    .slice()
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

/** Photos of an entry whose bytes aren't in Storage yet — upload these first. */
export function planPhotoUploads(entry: Entry): Photo[] {
  return entry.photos.filter((p) => !p.remoteUrl);
}

export type MergeAction = 'insert' | 'update' | 'skip';

/** What to do with a row coming back from the server. */
export function mergeRemote(local: Entry | undefined, remote: Entry): MergeAction {
  if (!local) return 'insert';
  return remote.updatedAt > local.updatedAt ? 'update' : 'skip';
}

/** Storage object key for a photo. Mirrors the RLS path prefix (`${uid}/…`). */
export function storagePath(userId: string, entryId: string, photoId: string): string {
  return `${userId}/${entryId}/${photoId}.jpg`;
}

/**
 * The local SQLite file caches one account's cloud data. Given the id it was
 * last synced under and the id signing in now, should it be kept or wiped?
 */
export function resolveLocalForUser(
  storedId: string | null,
  currentId: string,
): 'keep' | 'wipe' {
  return storedId && storedId !== currentId ? 'wipe' : 'keep';
}
