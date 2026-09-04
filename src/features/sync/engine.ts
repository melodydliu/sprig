import type { Entry, Photo, SyncStatus } from '@/types/entry';

import { mergeRemote, planPhotoUploads, planPush, storagePath } from './plan';
import { entryToRemote, photoToRemote, type RemoteEntryRow, type RemotePhotoRow } from './remoteMappers';
import { useSync } from './syncStore';

const LAST_PULLED_KEY = 'last_pulled_at';
const EPOCH = '1970-01-01T00:00:00.000Z';
const DEBOUNCE_MS = 2000;

/**
 * Everything the engine touches, injected so `engine.ts` can be unit-tested
 * with an in-memory fake (see engine.test.ts). `local.ts` / `remote.ts` provide
 * the real implementations.
 */
export interface SyncDeps {
  getUserId(): Promise<string | null>;

  loadLocalEntries(): Promise<Entry[]>; // ALL rows, including soft-deleted
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
  markEntrySync(id: string, status: SyncStatus): Promise<void>;
  setPhotoRemote(photoId: string, remoteUrl: string, storagePath: string): Promise<void>;
  applyRemoteEntry(entry: Entry): Promise<void>;

  uploadPhoto(path: string, localUri: string): Promise<string>; // -> remote URL
  upsertRemoteEntry(row: RemoteEntryRow): Promise<void>;
  upsertRemotePhotos(rows: RemotePhotoRow[]): Promise<void>;
  prunePhotos(entryId: string, keepIds: string[]): Promise<void>;
  removeStorageObjects(paths: string[]): Promise<void>;
  fetchRemoteChanges(userId: string, sinceIso: string): Promise<Entry[]>;
}

export interface SyncEngine {
  /** Run one full push+pull pass now. */
  runOnce(): Promise<void>;
  /** Debounced pass — coalesces bursts of local writes. */
  requestSync(): void;
  /** Cancel any pending debounce and run immediately (Settings / pull-to-refresh). */
  syncNow(): Promise<void>;
  /** Update just the pending count in the store (no network). */
  refreshPending(): Promise<void>;
}

export function createSyncEngine(deps: SyncDeps): SyncEngine {
  let running = false;
  let rerun = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function pushEntry(entry: Entry, userId: string): Promise<void> {
    // 1. Photos first: upload bytes, record the remote URL locally.
    const uploaded: Photo[] = [];
    for (const photo of planPhotoUploads(entry)) {
      const path = storagePath(userId, entry.id, photo.id);
      const url = await deps.uploadPhoto(path, photo.localUri);
      await deps.setPhotoRemote(photo.id, url, path);
      uploaded.push({ ...photo, remoteUrl: url });
    }
    const photos = entry.photos.map((p) => uploaded.find((u) => u.id === p.id) ?? p);

    // 2. The entry row.
    await deps.upsertRemoteEntry(entryToRemote(entry, userId));

    // 3. Photo rows, then drop any the entry no longer has.
    if (photos.length > 0) {
      await deps.upsertRemotePhotos(
        photos.map((p) =>
          photoToRemote(p, userId, storagePath(userId, entry.id, p.id), entry.updatedAt),
        ),
      );
    }
    await deps.prunePhotos(entry.id, photos.map((p) => p.id));

    // 4. Deleted entry: best-effort removal of its bytes.
    if (entry.deletedAt) {
      await deps.removeStorageObjects(
        entry.photos.map((p) => storagePath(userId, entry.id, p.id)),
      );
    }
  }

  async function runOnce(): Promise<void> {
    if (running) {
      rerun = true;
      return;
    }

    const userId = await deps.getUserId();
    if (!userId) {
      // Not configured / anonymous sign-in unavailable — stay local-only.
      const status = useSync.getState().status;
      if (status !== 'disabled') useSync.getState().set({ status: 'idle' });
      return;
    }

    running = true;
    const passStart = new Date().toISOString();
    useSync.getState().set({ status: 'syncing', error: null });
    let hadError = false;
    let applied = 0;

    try {
      // ---- PUSH ----
      const local = await deps.loadLocalEntries();
      for (const entry of planPush(local)) {
        try {
          await pushEntry(entry, userId);
          await deps.markEntrySync(entry.id, 'synced');
        } catch (err) {
          hadError = true;
          await deps.markEntrySync(entry.id, 'error');
          console.warn('[sprig] sync push failed for', entry.id, err);
        }
      }

      // ---- PULL ----
      try {
        const since = (await deps.getMeta(LAST_PULLED_KEY)) ?? EPOCH;
        const remote = await deps.fetchRemoteChanges(userId, since);
        const localById = new Map((await deps.loadLocalEntries()).map((e) => [e.id, e]));
        for (const r of remote) {
          if (mergeRemote(localById.get(r.id), r) !== 'skip') {
            await deps.applyRemoteEntry(r);
            applied += 1;
          }
        }
        if (!hadError) await deps.setMeta(LAST_PULLED_KEY, passStart);
      } catch (err) {
        hadError = true;
        console.warn('[sprig] sync pull failed', err);
      }

      const after = await deps.loadLocalEntries();
      const pending = after.filter((e) => e.syncStatus !== 'synced').length;
      const s = useSync.getState();
      s.set({
        status: hadError ? 'error' : 'idle',
        pending,
        lastSyncedAt: hadError ? s.lastSyncedAt : passStart,
        error: hadError ? 'Some changes didn’t sync — will retry' : null,
        appliedRevision: applied > 0 ? s.appliedRevision + 1 : s.appliedRevision,
      });
    } finally {
      running = false;
      if (rerun) {
        rerun = false;
        void runOnce();
      }
    }
  }

  function requestSync(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void runOnce();
    }, DEBOUNCE_MS);
  }

  function syncNow(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    return runOnce();
  }

  async function refreshPending(): Promise<void> {
    try {
      const local = await deps.loadLocalEntries();
      useSync.getState().set({ pending: local.filter((e) => e.syncStatus !== 'synced').length });
    } catch {
      // ignore — best effort
    }
  }

  return { runOnce, requestSync, syncNow, refreshPending };
}
