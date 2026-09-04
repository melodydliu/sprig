import type { Entry, Photo } from '@/types/entry';

/**
 * Local `Entry` / `Photo` ↔ the Postgres row shapes in `supabase/schema.sql`.
 * Pure — mirrors `src/data/sqlite/mappers.ts` but for the cloud tables.
 *
 * Differences from the local model:
 * - `user_id` is stamped from the sync session (not the local `userId`).
 * - `syncStatus` is local-only and never leaves the device.
 * - `colors` / `tags` stay JS arrays (Postgres `text[]`).
 * - `is_favorite` is a real boolean (no 0/1).
 * - photo bytes live in Storage; a pulled photo uses its `remote_url` as the
 *   local URI until an offline cache downloads it.
 */

export interface RemoteEntryRow {
  id: string;
  user_id: string;
  name: string | null;
  categories: string[];
  colors: string[];
  notes: string;
  location_lat: number | null;
  location_lng: number | null;
  location_source: string | null;
  location_label: string | null;
  sighted_at: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RemotePhotoRow {
  id: string;
  entry_id: string;
  user_id: string;
  storage_path: string | null;
  remote_url: string | null;
  width: number;
  height: number;
  taken_at: string | null;
  sort_order: number;
  updated_at: string;
}

export function entryToRemote(entry: Entry, userId: string): RemoteEntryRow {
  return {
    id: entry.id,
    user_id: userId,
    name: entry.name,
    categories: entry.categories ?? [],
    colors: entry.colors ?? [],
    notes: entry.notes ?? '',
    location_lat: entry.location?.latitude ?? null,
    location_lng: entry.location?.longitude ?? null,
    location_source: entry.locationSource ?? null,
    location_label: entry.locationLabel ?? null,
    sighted_at: entry.sightedAt,
    tags: entry.tags ?? [],
    is_favorite: entry.isFavorite,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
  };
}

export function photoToRemote(
  photo: Photo,
  userId: string,
  storagePath: string | null,
  updatedAt: string,
): RemotePhotoRow {
  return {
    id: photo.id,
    entry_id: photo.entryId,
    user_id: userId,
    storage_path: storagePath ?? photo.remoteUrl ?? null,
    remote_url: photo.remoteUrl,
    width: photo.width,
    height: photo.height,
    taken_at: photo.takenAt,
    sort_order: photo.sortOrder,
    updated_at: updatedAt,
  };
}

function remoteToPhoto(row: RemotePhotoRow): Photo {
  const uri = row.remote_url ?? '';
  return {
    id: row.id,
    entryId: row.entry_id,
    localUri: uri,
    remoteUrl: row.remote_url,
    thumbnailUri: uri,
    width: row.width,
    height: row.height,
    takenAt: row.taken_at,
    sortOrder: row.sort_order,
  };
}

/** A row (with its nested photos) pulled from Postgres → a local `Entry`. */
export function remoteToEntry(row: RemoteEntryRow & { photos?: RemotePhotoRow[] | null }): Entry {
  const hasLocation = row.location_lat != null && row.location_lng != null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    categories: (row.categories ?? []) as Entry['categories'],
    colors: (row.colors ?? []) as Entry['colors'],
    notes: row.notes ?? '',
    photos: (row.photos ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(remoteToPhoto),
    location: hasLocation
      ? { latitude: row.location_lat as number, longitude: row.location_lng as number }
      : null,
    locationSource: (row.location_source as Entry['locationSource']) ?? null,
    locationLabel: row.location_label,
    sightedAt: row.sighted_at,
    tags: row.tags ?? [],
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    // A row we just pulled is, by definition, in sync with the server.
    syncStatus: 'synced',
  };
}
