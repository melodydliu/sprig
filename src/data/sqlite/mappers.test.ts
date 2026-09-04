import type { Entry, Photo } from '@/types/entry';

import {
  entryToRow,
  parseStringArray,
  photoToRow,
  rowToEntry,
  rowToPhoto,
  type EntryRow,
  type PhotoRow,
} from './mappers';

const baseEntryRow: EntryRow = {
  id: 'en_1',
  user_id: 'mock-user-sprig',
  name: 'Wild fennel',
  categories: '["foliage"]',
  colors: '["green","yellow"]',
  notes: 'Along the bike path.',
  location_lat: 33.693,
  location_lng: -118.047,
  location_source: 'gps',
  location_label: 'Bolsa Chica',
  sighted_at: '2026-08-01T10:00:00.000Z',
  tags: '["roadside","summer"]',
  is_favorite: 1,
  created_at: '2026-08-01T11:00:00.000Z',
  updated_at: '2026-08-02T09:00:00.000Z',
  deleted_at: null,
  sync_status: 'synced',
};

const photoRow = (over: Partial<PhotoRow>): PhotoRow => ({
  id: 'ph_1',
  entry_id: 'en_1',
  local_uri: 'file:///photos/en_1_ph_1.jpg',
  remote_url: null,
  thumbnail_uri: 'file:///photos/en_1_ph_1_thumb.jpg',
  width: 1600,
  height: 1200,
  taken_at: null,
  sort_order: 0,
  ...over,
});

describe('parseStringArray', () => {
  it('parses a JSON array of strings', () => {
    expect(parseStringArray('["a","b"]')).toEqual(['a', 'b']);
  });

  it('returns [] for an empty-array string', () => {
    expect(parseStringArray('[]')).toEqual([]);
  });

  it('returns [] for non-JSON, non-strings, and non-array JSON', () => {
    expect(parseStringArray('not json')).toEqual([]);
    expect(parseStringArray(null)).toEqual([]);
    expect(parseStringArray(undefined)).toEqual([]);
    expect(parseStringArray('{"a":1}')).toEqual([]);
    expect(parseStringArray('42')).toEqual([]);
  });

  it('drops non-string members', () => {
    expect(parseStringArray('["a",1,null,"b"]')).toEqual(['a', 'b']);
  });
});

describe('rowToEntry', () => {
  it('maps a full row and sorts photos by sort_order', () => {
    const photos = [
      photoRow({ id: 'ph_b', sort_order: 1 }),
      photoRow({ id: 'ph_a', sort_order: 0 }),
    ];
    const entry = rowToEntry(baseEntryRow, photos);

    expect(entry.id).toBe('en_1');
    expect(entry.categories).toEqual(['foliage']);
    expect(entry.colors).toEqual(['green', 'yellow']);
    expect(entry.tags).toEqual(['roadside', 'summer']);
    expect(entry.isFavorite).toBe(true);
    expect(entry.location).toEqual({ latitude: 33.693, longitude: -118.047 });
    expect(entry.photos.map((p) => p.id)).toEqual(['ph_a', 'ph_b']);
  });

  it('is_favorite 0 -> false', () => {
    expect(rowToEntry({ ...baseEntryRow, is_favorite: 0 }, []).isFavorite).toBe(false);
  });

  it('null location when either coordinate is missing', () => {
    expect(rowToEntry({ ...baseEntryRow, location_lat: null }, []).location).toBeNull();
    expect(rowToEntry({ ...baseEntryRow, location_lng: null }, []).location).toBeNull();
  });

  it('tolerates garbage colors/tags/categories columns', () => {
    const entry = rowToEntry({ ...baseEntryRow, categories: 'oops', colors: 'oops', tags: '' }, []);
    expect(entry.categories).toEqual([]);
    expect(entry.colors).toEqual([]);
    expect(entry.tags).toEqual([]);
  });

  it('falls back to pending when sync_status is empty', () => {
    expect(rowToEntry({ ...baseEntryRow, sync_status: '' }, []).syncStatus).toBe('pending');
  });
});

describe('round trips', () => {
  it('entryToRow -> rowToEntry preserves the entry', () => {
    const entry: Entry = {
      id: 'en_9',
      userId: 'mock-user-sprig',
      name: null,
      categories: ['flower', 'seed_pod_dried'],
      colors: ['purple'],
      notes: '',
      photos: [],
      location: null,
      locationSource: null,
      locationLabel: null,
      sightedAt: '2026-07-04T00:00:00.000Z',
      tags: [],
      isFavorite: false,
      createdAt: '2026-07-04T01:00:00.000Z',
      updatedAt: '2026-07-04T01:00:00.000Z',
      deletedAt: null,
      syncStatus: 'pending',
    };
    expect(rowToEntry(entryToRow(entry), [])).toEqual(entry);
  });

  it('photoToRow -> rowToPhoto preserves the photo', () => {
    const photo: Photo = {
      id: 'ph_9',
      entryId: 'en_9',
      localUri: 'file:///photos/a.jpg',
      remoteUrl: 'https://cdn.example/a.jpg',
      thumbnailUri: 'file:///photos/a_thumb.jpg',
      width: 800,
      height: 600,
      takenAt: '2026-07-04T00:00:00.000Z',
      sortOrder: 2,
    };
    expect(rowToPhoto(photoToRow(photo))).toEqual(photo);
  });
});
