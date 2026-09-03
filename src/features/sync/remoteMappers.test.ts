import type { Entry } from '@/types/entry';

import { entryToRemote, photoToRemote, remoteToEntry } from './remoteMappers';

function entry(over: Partial<Entry>): Entry {
  return {
    id: 'en_1',
    userId: 'local-user',
    name: 'Wild fennel',
    category: 'foliage',
    colors: ['green', 'yellow'],
    notes: 'bike path',
    photos: [],
    location: { latitude: 33.69, longitude: -118.04 },
    locationSource: 'gps',
    locationLabel: 'Bolsa Chica',
    sightedAt: '2026-05-01T00:00:00.000Z',
    tags: ['roadside'],
    isFavorite: true,
    createdAt: '2026-05-01T01:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    deletedAt: null,
    syncStatus: 'pending',
    ...over,
  };
}

describe('entryToRemote', () => {
  it('stamps the sync user id and drops sync-only / nested fields', () => {
    const row = entryToRemote(entry({}), 'auth-uid-123');
    expect(row.user_id).toBe('auth-uid-123');
    expect(row.is_favorite).toBe(true);
    expect(row.location_lat).toBe(33.69);
    expect(row.location_lng).toBe(-118.04);
    expect(row.colors).toEqual(['green', 'yellow']);
    expect(row).not.toHaveProperty('syncStatus');
    expect(row).not.toHaveProperty('photos');
  });

  it('null coordinates when there is no location', () => {
    const row = entryToRemote(entry({ location: null }), 'u');
    expect(row.location_lat).toBeNull();
    expect(row.location_lng).toBeNull();
  });
});

describe('remoteToEntry', () => {
  it('round-trips an entry (user id + sync status become the local view)', () => {
    const original = entry({});
    const back = remoteToEntry({ ...entryToRemote(original, 'auth-uid-123'), photos: [] });
    expect(back).toEqual({ ...original, userId: 'auth-uid-123', syncStatus: 'synced' });
  });

  it('maps nested photos by sort order and uses the remote URL as the local URI', () => {
    const row = {
      ...entryToRemote(entry({}), 'u'),
      photos: [
        photoToRemote(
          { id: 'p2', entryId: 'en_1', localUri: '', remoteUrl: 'https://cdn/p2.jpg', thumbnailUri: '', width: 1, height: 1, takenAt: null, sortOrder: 1 },
          'u',
          'u/en_1/p2.jpg',
          '2026-05-02T00:00:00.000Z',
        ),
        photoToRemote(
          { id: 'p1', entryId: 'en_1', localUri: '', remoteUrl: 'https://cdn/p1.jpg', thumbnailUri: '', width: 1, height: 1, takenAt: null, sortOrder: 0 },
          'u',
          'u/en_1/p1.jpg',
          '2026-05-02T00:00:00.000Z',
        ),
      ],
    };
    const back = remoteToEntry(row);
    expect(back.photos.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(back.photos[0].localUri).toBe('https://cdn/p1.jpg');
    expect(back.photos[0].thumbnailUri).toBe('https://cdn/p1.jpg');
  });
});
