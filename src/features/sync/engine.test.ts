import type { Entry, Photo, SyncStatus } from '@/types/entry';

import { createSyncEngine, type SyncDeps } from './engine';
import { useSync } from './syncStore';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function entry(over: Partial<Entry>): Entry {
  return {
    id: 'en_1',
    userId: 'local',
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
    width: 10,
    height: 10,
    takenAt: null,
    sortOrder: 0,
    ...over,
  };
}

interface FakeOpts {
  userId?: string | null;
  local?: Entry[];
  remoteChanges?: Entry[];
  uploadFails?: number;
}

function makeFake(opts: FakeOpts = {}) {
  const local = new Map<string, Entry>((opts.local ?? []).map((e) => [e.id, clone(e)]));
  const meta = new Map<string, string>();
  const calls: string[] = [];
  let uploadsToFail = opts.uploadFails ?? 0;

  const deps: SyncDeps = {
    async getUserId() {
      return opts.userId === undefined ? 'user-1' : opts.userId;
    },
    async loadLocalEntries() {
      return [...local.values()].map(clone);
    },
    async getMeta(k) {
      return meta.get(k) ?? null;
    },
    async setMeta(k, v) {
      meta.set(k, v);
    },
    async markEntrySync(id, status: SyncStatus) {
      calls.push(`markEntrySync:${id}:${status}`);
      const e = local.get(id);
      if (e) e.syncStatus = status;
    },
    async setPhotoRemote(photoId, url) {
      calls.push(`setPhotoRemote:${photoId}`);
      for (const e of local.values()) {
        const p = e.photos.find((x) => x.id === photoId);
        if (p) p.remoteUrl = url;
      }
    },
    async applyRemoteEntry(e) {
      calls.push(`applyRemoteEntry:${e.id}`);
      local.set(e.id, clone(e));
    },
    async uploadPhoto(path) {
      calls.push(`uploadPhoto:${path}`);
      if (uploadsToFail > 0) {
        uploadsToFail -= 1;
        throw new Error('upload boom');
      }
      return `https://cdn/${path}`;
    },
    async upsertRemoteEntry(row) {
      calls.push(`upsertRemoteEntry:${row.id}`);
    },
    async upsertRemotePhotos(rows) {
      calls.push(`upsertRemotePhotos:${rows.map((r) => r.id).join(',')}`);
    },
    async prunePhotos(entryId, keep) {
      calls.push(`prunePhotos:${entryId}:${keep.join(',')}`);
    },
    async removeStorageObjects(paths) {
      calls.push(`removeStorageObjects:${paths.join(',')}`);
    },
    async fetchRemoteChanges() {
      return (opts.remoteChanges ?? []).map(clone);
    },
  };

  return { deps, local, meta, calls };
}

beforeEach(() => {
  useSync.setState({ status: 'idle', pending: 0, lastSyncedAt: null, error: null });
});

test('happy path: photo bytes upload before the entry row; entry ends synced', async () => {
  const e = entry({
    id: 'en_a',
    syncStatus: 'pending',
    updatedAt: '2026-01-01T00:00:00.000Z',
    photos: [photo({ id: 'ph_a', entryId: 'en_a', remoteUrl: null })],
  });
  const { deps, local, calls } = makeFake({ local: [e] });

  await createSyncEngine(deps).runOnce();

  const upIdx = calls.indexOf('uploadPhoto:user-1/en_a/ph_a.jpg');
  const rowIdx = calls.indexOf('upsertRemoteEntry:en_a');
  expect(upIdx).toBeGreaterThanOrEqual(0);
  expect(upIdx).toBeLessThan(rowIdx);
  expect(local.get('en_a')!.syncStatus).toBe('synced');
  expect(local.get('en_a')!.photos[0].remoteUrl).toBe('https://cdn/user-1/en_a/ph_a.jpg');
  expect(useSync.getState()).toMatchObject({ status: 'idle', pending: 0 });
});

test('retry: a failed upload marks the entry error, the next pass recovers it', async () => {
  const e = entry({
    id: 'en_b',
    syncStatus: 'pending',
    updatedAt: '2026-01-01T00:00:00.000Z',
    photos: [photo({ id: 'ph_b', entryId: 'en_b' })],
  });
  const { deps, local } = makeFake({ local: [e], uploadFails: 1 });
  const engine = createSyncEngine(deps);

  await engine.runOnce();
  expect(local.get('en_b')!.syncStatus).toBe('error');
  expect(useSync.getState().status).toBe('error');

  await engine.runOnce();
  expect(local.get('en_b')!.syncStatus).toBe('synced');
  expect(useSync.getState().status).toBe('idle');
});

test('pull: applies newer/new remote rows, skips stale ones (LWW)', async () => {
  const localNewer = entry({ id: 'en_c', updatedAt: '2026-02-10T00:00:00.000Z' });
  const localOlder = entry({ id: 'en_d', updatedAt: '2026-02-01T00:00:00.000Z' });
  const remoteChanges = [
    entry({ id: 'en_c', updatedAt: '2026-02-05T00:00:00.000Z' }), // stale -> skip
    entry({ id: 'en_d', updatedAt: '2026-02-09T00:00:00.000Z' }), // newer -> update
    entry({ id: 'en_e', updatedAt: '2026-02-09T00:00:00.000Z' }), // unknown -> insert
  ];
  const { deps, calls } = makeFake({ local: [localNewer, localOlder], remoteChanges });

  await createSyncEngine(deps).runOnce();

  expect(calls.filter((c) => c.startsWith('applyRemoteEntry')).sort()).toEqual([
    'applyRemoteEntry:en_d',
    'applyRemoteEntry:en_e',
  ]);
});

test('push order follows updatedAt, oldest first', async () => {
  const { deps, calls } = makeFake({
    local: [
      entry({ id: 'x', syncStatus: 'pending', updatedAt: '2026-01-03T00:00:00.000Z' }),
      entry({ id: 'y', syncStatus: 'pending', updatedAt: '2026-01-01T00:00:00.000Z' }),
      entry({ id: 'z', syncStatus: 'pending', updatedAt: '2026-01-02T00:00:00.000Z' }),
    ],
  });

  await createSyncEngine(deps).runOnce();

  expect(calls.filter((c) => c.startsWith('upsertRemoteEntry:'))).toEqual([
    'upsertRemoteEntry:y',
    'upsertRemoteEntry:z',
    'upsertRemoteEntry:x',
  ]);
});

test('a deleted entry pushes a tombstone and clears its storage objects', async () => {
  const e = entry({
    id: 'en_g',
    syncStatus: 'pending',
    updatedAt: '2026-04-01T00:00:00.000Z',
    deletedAt: '2026-04-01T00:00:00.000Z',
    photos: [photo({ id: 'ph_g', entryId: 'en_g', remoteUrl: 'https://cdn/old.jpg' })],
  });
  const { deps, calls } = makeFake({ local: [e] });

  await createSyncEngine(deps).runOnce();

  expect(calls).toContain('upsertRemoteEntry:en_g');
  expect(calls).toContain('removeStorageObjects:user-1/en_g/ph_g.jpg');
});

test('no sync user id: no network calls, status stays idle', async () => {
  const { deps, calls } = makeFake({
    userId: null,
    local: [entry({ id: 'en_f', syncStatus: 'pending' })],
  });

  await createSyncEngine(deps).runOnce();

  expect(calls).toEqual([]);
  expect(useSync.getState().status).toBe('idle');
});
