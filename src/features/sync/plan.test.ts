import type { Entry, Photo } from '@/types/entry';

import { mergeRemote, planPhotoUploads, planPush, storagePath } from './plan';

function entry(over: Partial<Entry>): Entry {
  return {
    id: 'en_1',
    userId: 'u1',
    name: null,
    category: 'flower',
    colors: [],
    notes: '',
    photos: [],
    location: null,
    locationSource: null,
    locationLabel: null,
    sightedAt: '2026-01-01T00:00:00.000Z',
    tags: [],
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    syncStatus: 'synced',
    ...over,
  };
}

function photo(over: Partial<Photo>): Photo {
  return {
    id: 'ph_1',
    entryId: 'en_1',
    localUri: 'file:///a.jpg',
    remoteUrl: null,
    thumbnailUri: 'file:///a_thumb.jpg',
    width: 100,
    height: 100,
    takenAt: null,
    sortOrder: 0,
    ...over,
  };
}

describe('planPush', () => {
  it('returns only non-synced entries, oldest updatedAt first', () => {
    const list = [
      entry({ id: 'a', syncStatus: 'synced', updatedAt: '2026-01-05T00:00:00.000Z' }),
      entry({ id: 'b', syncStatus: 'pending', updatedAt: '2026-01-03T00:00:00.000Z' }),
      entry({ id: 'c', syncStatus: 'error', updatedAt: '2026-01-01T00:00:00.000Z' }),
      entry({ id: 'd', syncStatus: 'pending', updatedAt: '2026-01-04T00:00:00.000Z' }),
    ];
    expect(planPush(list).map((e) => e.id)).toEqual(['c', 'b', 'd']);
  });

  it('does not mutate the input array', () => {
    const list = [
      entry({ id: 'a', syncStatus: 'pending', updatedAt: '2026-02-01T00:00:00.000Z' }),
      entry({ id: 'b', syncStatus: 'pending', updatedAt: '2026-01-01T00:00:00.000Z' }),
    ];
    planPush(list);
    expect(list.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('planPhotoUploads', () => {
  it('returns only photos without a remote URL', () => {
    const e = entry({
      photos: [
        photo({ id: 'p1', remoteUrl: 'https://cdn/p1.jpg' }),
        photo({ id: 'p2', remoteUrl: null }),
        photo({ id: 'p3', remoteUrl: '' }),
      ],
    });
    expect(planPhotoUploads(e).map((p) => p.id)).toEqual(['p2', 'p3']);
  });
});

describe('mergeRemote', () => {
  const local = entry({ updatedAt: '2026-03-10T00:00:00.000Z' });

  it('insert when there is no local row', () => {
    expect(mergeRemote(undefined, local)).toBe('insert');
  });

  it('update when the remote row is newer', () => {
    expect(mergeRemote(local, entry({ updatedAt: '2026-03-11T00:00:00.000Z' }))).toBe('update');
  });

  it('skip when local is newer or the same age', () => {
    expect(mergeRemote(local, entry({ updatedAt: '2026-03-09T00:00:00.000Z' }))).toBe('skip');
    expect(mergeRemote(local, entry({ updatedAt: '2026-03-10T00:00:00.000Z' }))).toBe('skip');
  });

  it('a remote tombstone still applies when it is newer', () => {
    const tombstone = entry({
      updatedAt: '2026-03-12T00:00:00.000Z',
      deletedAt: '2026-03-12T00:00:00.000Z',
    });
    expect(mergeRemote(local, tombstone)).toBe('update');
  });
});

describe('storagePath', () => {
  it('is uid / entry / photo .jpg', () => {
    expect(storagePath('u-1', 'en_9', 'ph_9')).toBe('u-1/en_9/ph_9.jpg');
  });
});
