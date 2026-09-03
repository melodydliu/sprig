import { getDb } from '@/data/sqlite/db';
import {
  ENTRY_COLUMNS,
  entryRowValues,
  entryToRow,
  PHOTO_COLUMNS,
  photoRowValues,
  photoToRow,
} from '@/data/sqlite/mappers';
import { getMeta, loadEntries, setMeta } from '@/data/sqlite/read';
import type { Entry, SyncStatus } from '@/types/entry';

/** Local (SQLite) half of `SyncDeps`. */

const ENTRY_UPSERT = `INSERT INTO entries (${ENTRY_COLUMNS.join(', ')})
  VALUES (${ENTRY_COLUMNS.map(() => '?').join(', ')})
  ON CONFLICT(id) DO UPDATE SET ${ENTRY_COLUMNS.filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ')}`;

const PHOTO_INSERT = `INSERT INTO photos (${PHOTO_COLUMNS.join(', ')})
  VALUES (${PHOTO_COLUMNS.map(() => '?').join(', ')})`;

export const localDeps = {
  async loadLocalEntries(): Promise<Entry[]> {
    return loadEntries(await getDb(), { includeDeleted: true });
  },

  async getMeta(key: string): Promise<string | null> {
    return getMeta(await getDb(), key);
  },

  async setMeta(key: string, value: string): Promise<void> {
    return setMeta(await getDb(), key, value);
  },

  async markEntrySync(id: string, status: SyncStatus): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE entries SET sync_status = ? WHERE id = ?', status, id);
  },

  async setPhotoRemote(photoId: string, remoteUrl: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE photos SET remote_url = ? WHERE id = ?', remoteUrl, photoId);
  },

  /** Overwrite the local row + its photos with a pulled one (already `synced`). */
  async applyRemoteEntry(entry: Entry): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync(ENTRY_UPSERT, entryRowValues(entryToRow(entry)));
      await tx.runAsync('DELETE FROM photos WHERE entry_id = ?', entry.id);
      for (const photo of entry.photos) {
        await tx.runAsync(PHOTO_INSERT, photoRowValues(photoToRow(photo)));
      }
    });
  },
};
