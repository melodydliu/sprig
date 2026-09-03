import type { SQLiteBindValue } from 'expo-sqlite';

import type { ColorName, Entry, Photo } from '@/types/entry';

/**
 * Pure row <-> domain mapping. No SQLite calls here so it can be unit-tested
 * without the native module. `colors`/`tags` are stored as JSON text columns;
 * `location` is split into `location_lat` / `location_lng`.
 */

export interface EntryRow {
  id: string;
  user_id: string;
  name: string | null;
  category: string;
  colors: string;
  notes: string;
  location_lat: number | null;
  location_lng: number | null;
  location_source: string | null;
  location_label: string | null;
  sighted_at: string;
  tags: string;
  is_favorite: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sync_status: string;
}

export interface PhotoRow {
  id: string;
  entry_id: string;
  local_uri: string;
  remote_url: string | null;
  thumbnail_uri: string;
  width: number;
  height: number;
  taken_at: string | null;
  sort_order: number;
}

/** Tolerant JSON-array parse: anything unexpected collapses to `[]`. */
export function parseStringArray(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function rowToPhoto(row: PhotoRow): Photo {
  return {
    id: row.id,
    entryId: row.entry_id,
    localUri: row.local_uri,
    remoteUrl: row.remote_url,
    thumbnailUri: row.thumbnail_uri,
    width: row.width,
    height: row.height,
    takenAt: row.taken_at,
    sortOrder: row.sort_order,
  };
}

export function rowToEntry(row: EntryRow, photoRows: PhotoRow[]): Entry {
  const hasLocation = row.location_lat != null && row.location_lng != null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category as Entry['category'],
    colors: parseStringArray(row.colors) as ColorName[],
    notes: row.notes,
    photos: photoRows
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToPhoto),
    location: hasLocation
      ? { latitude: row.location_lat as number, longitude: row.location_lng as number }
      : null,
    locationSource: (row.location_source as Entry['locationSource']) ?? null,
    locationLabel: row.location_label,
    sightedAt: row.sighted_at,
    tags: parseStringArray(row.tags),
    isFavorite: row.is_favorite === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: (row.sync_status as Entry['syncStatus']) || 'pending',
  };
}

export function entryToRow(entry: Entry): EntryRow {
  return {
    id: entry.id,
    user_id: entry.userId,
    name: entry.name,
    category: entry.category,
    colors: JSON.stringify(entry.colors ?? []),
    notes: entry.notes ?? '',
    location_lat: entry.location?.latitude ?? null,
    location_lng: entry.location?.longitude ?? null,
    location_source: entry.locationSource ?? null,
    location_label: entry.locationLabel ?? null,
    sighted_at: entry.sightedAt,
    tags: JSON.stringify(entry.tags ?? []),
    is_favorite: entry.isFavorite ? 1 : 0,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    deleted_at: entry.deletedAt,
    sync_status: entry.syncStatus,
  };
}

export function photoToRow(photo: Photo): PhotoRow {
  return {
    id: photo.id,
    entry_id: photo.entryId,
    local_uri: photo.localUri,
    remote_url: photo.remoteUrl,
    thumbnail_uri: photo.thumbnailUri,
    width: photo.width,
    height: photo.height,
    taken_at: photo.takenAt,
    sort_order: photo.sortOrder,
  };
}

/** Column order used by INSERT statements — keep in sync with `entryToRow`. */
export const ENTRY_COLUMNS: (keyof EntryRow)[] = [
  'id',
  'user_id',
  'name',
  'category',
  'colors',
  'notes',
  'location_lat',
  'location_lng',
  'location_source',
  'location_label',
  'sighted_at',
  'tags',
  'is_favorite',
  'created_at',
  'updated_at',
  'deleted_at',
  'sync_status',
];

export const PHOTO_COLUMNS: (keyof PhotoRow)[] = [
  'id',
  'entry_id',
  'local_uri',
  'remote_url',
  'thumbnail_uri',
  'width',
  'height',
  'taken_at',
  'sort_order',
];

/** Ordered bind values for an `INSERT INTO entries` — matches `ENTRY_COLUMNS`. */
export function entryRowValues(row: EntryRow): SQLiteBindValue[] {
  return ENTRY_COLUMNS.map((c) => row[c]);
}

/** Ordered bind values for an `INSERT INTO photos` — matches `PHOTO_COLUMNS`. */
export function photoRowValues(row: PhotoRow): SQLiteBindValue[] {
  return PHOTO_COLUMNS.map((c) => row[c]);
}
