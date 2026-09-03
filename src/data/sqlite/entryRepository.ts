import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import type { EntryQuery, EntryRepository, PhotoInput } from '@/data/repositories';
import { buildSeedEntries, MOCK_USER_ID } from '@/data/seed';
import { runQuery } from '@/features/filters/query';
import { uid } from '@/lib/id';
import { clearAllPhotos } from '@/lib/images';
import type { Entry, EntryDraft, Photo } from '@/types/entry';

import { getDb } from './db';
import {
  ENTRY_COLUMNS,
  entryRowValues,
  entryToRow,
  PHOTO_COLUMNS,
  photoRowValues,
  photoToRow,
  type PhotoRow,
} from './mappers';
import { sqlitePhotoRepository } from './photoRepository';
import { loadEntries, loadEntry } from './read';

const ENTRY_INSERT = buildInsert('entries', ENTRY_COLUMNS);
const PHOTO_INSERT = buildInsert('photos', PHOTO_COLUMNS);

function buildInsert(table: string, columns: readonly string[]): string {
  const cols = columns.join(', ');
  const marks = columns.map(() => '?').join(', ');
  return `INSERT INTO ${table} (${cols}) VALUES (${marks})`;
}

const nowIso = () => new Date().toISOString();

/**
 * SQLite-backed entry store — the on-device source of truth. Mirrors the mock
 * repository method-for-method; only persistence changes. The zustand
 * `entriesStore` still holds the working set in memory, so reads load every
 * non-deleted row and hand it to the same `runQuery` the mock used.
 */
class SqliteEntryRepository implements EntryRepository {
  private seeded: Promise<void> | null = null;

  private async ready(): Promise<SQLiteDatabase> {
    const db = await getDb();
    if (!this.seeded) this.seeded = this.ensureSeeded(db);
    await this.seeded;
    return db;
  }

  /** Clean-seed on first run: no import from the old AsyncStorage mock data. */
  private async ensureSeeded(db: SQLiteDatabase): Promise<void> {
    const flag = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      'seeded',
    );
    if (flag?.value === 'true') return;

    const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM entries');
    if ((count?.n ?? 0) === 0) {
      const entries = await buildSeedEntries();
      await this.insertEntries(db, entries);
    }
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', 'seeded', 'true');
  }

  private async insertEntries(db: SQLiteDatabase, entries: Entry[]): Promise<void> {
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const entry of entries) {
        await tx.runAsync(ENTRY_INSERT, entryRowValues(entryToRow(entry)));
        for (const photo of entry.photos) {
          await tx.runAsync(PHOTO_INSERT, photoRowValues(photoToRow(photo)));
        }
      }
    });
  }

  private async requireEntry(db: SQLiteDatabase, id: string): Promise<Entry> {
    const entry = await loadEntry(db, id);
    if (!entry) throw new Error(`Entry ${id} not found`);
    return entry;
  }

  private async ingestAll(
    entryId: string,
    inputs: PhotoInput[],
    startOrder: number,
  ): Promise<Photo[]> {
    const out: Photo[] = [];
    for (let i = 0; i < inputs.length; i += 1) {
      const sortOrder = startOrder + i;
      const ingested = await sqlitePhotoRepository.ingest(entryId, inputs[i], sortOrder);
      out.push({
        id: ingested.id,
        entryId,
        localUri: ingested.localUri,
        remoteUrl: null,
        thumbnailUri: ingested.thumbnailUri,
        width: ingested.width,
        height: ingested.height,
        takenAt: ingested.takenAt,
        sortOrder,
      });
    }
    return out;
  }

  async list(query?: EntryQuery): Promise<Entry[]> {
    const db = await this.ready();
    const entries = await loadEntries(db);
    return runQuery(entries, query);
  }

  async get(id: string): Promise<Entry | null> {
    const db = await this.ready();
    const entry = await loadEntry(db, id);
    return entry && !entry.deletedAt ? entry : null;
  }

  async create(draft: EntryDraft, photoInputs: PhotoInput[]): Promise<Entry> {
    const db = await this.ready();
    const id = uid('en_');
    const now = nowIso();
    const photos = await this.ingestAll(id, photoInputs, 0);
    const entry: Entry = {
      id,
      userId: MOCK_USER_ID,
      name: draft.name?.trim() ? draft.name.trim() : null,
      category: draft.category,
      colors: draft.colors,
      notes: draft.notes,
      photos,
      location: draft.location,
      locationSource: draft.locationSource,
      locationLabel: draft.locationLabel,
      sightedAt: draft.sightedAt,
      tags: draft.tags,
      isFavorite: draft.isFavorite,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending',
    };
    await this.insertEntries(db, [entry]);
    return this.requireEntry(db, id);
  }

  async update(id: string, patch: Partial<EntryDraft>): Promise<Entry> {
    const db = await this.ready();
    const sets: string[] = [];
    const params: SQLiteBindValue[] = [];
    const set = (col: string, value: SQLiteBindValue) => {
      sets.push(`${col} = ?`);
      params.push(value);
    };

    if (patch.name !== undefined) set('name', patch.name?.trim() ? patch.name.trim() : null);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.colors !== undefined) set('colors', JSON.stringify(patch.colors));
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (patch.location !== undefined) {
      set('location_lat', patch.location?.latitude ?? null);
      set('location_lng', patch.location?.longitude ?? null);
    }
    if (patch.locationSource !== undefined) set('location_source', patch.locationSource ?? null);
    if (patch.locationLabel !== undefined) set('location_label', patch.locationLabel ?? null);
    if (patch.sightedAt !== undefined) set('sighted_at', patch.sightedAt);
    if (patch.tags !== undefined) set('tags', JSON.stringify(patch.tags));
    if (patch.isFavorite !== undefined) set('is_favorite', patch.isFavorite ? 1 : 0);

    // Same as the mock's touch(): every write re-queues the row for sync.
    set('updated_at', nowIso());
    set('sync_status', 'pending');
    params.push(id);

    await db.runAsync(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`, params);
    return this.requireEntry(db, id);
  }

  async remove(id: string): Promise<void> {
    const db = await this.ready();
    const now = nowIso();
    await db.runAsync(
      'UPDATE entries SET deleted_at = ?, updated_at = ?, sync_status = ? WHERE id = ?',
      now,
      now,
      'pending',
      id,
    );
  }

  async setFavorite(id: string, value: boolean): Promise<Entry> {
    const db = await this.ready();
    await db.runAsync(
      'UPDATE entries SET is_favorite = ?, updated_at = ?, sync_status = ? WHERE id = ?',
      value ? 1 : 0,
      nowIso(),
      'pending',
      id,
    );
    return this.requireEntry(db, id);
  }

  async addPhotos(id: string, photoInputs: PhotoInput[]): Promise<Entry> {
    const db = await this.ready();
    const existing = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM photos WHERE entry_id = ?',
      id,
    );
    const photos = await this.ingestAll(id, photoInputs, existing?.n ?? 0);
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const photo of photos) {
        await tx.runAsync(PHOTO_INSERT, photoRowValues(photoToRow(photo)));
      }
      await tx.runAsync(
        'UPDATE entries SET updated_at = ?, sync_status = ? WHERE id = ?',
        nowIso(),
        'pending',
        id,
      );
    });
    return this.requireEntry(db, id);
  }

  async removePhoto(entryId: string, photoId: string): Promise<Entry> {
    const db = await this.ready();
    const target = await db.getFirstAsync<PhotoRow>('SELECT * FROM photos WHERE id = ?', photoId);
    if (target) {
      await sqlitePhotoRepository.deleteFiles(target.local_uri, target.thumbnail_uri);
    }
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM photos WHERE id = ?', photoId);
      const remaining = await tx.getAllAsync<PhotoRow>(
        'SELECT * FROM photos WHERE entry_id = ? ORDER BY sort_order',
        entryId,
      );
      for (let i = 0; i < remaining.length; i += 1) {
        if (remaining[i].sort_order !== i) {
          await tx.runAsync('UPDATE photos SET sort_order = ? WHERE id = ?', i, remaining[i].id);
        }
      }
      await tx.runAsync(
        'UPDATE entries SET updated_at = ?, sync_status = ? WHERE id = ?',
        nowIso(),
        'pending',
        entryId,
      );
    });
    return this.requireEntry(db, entryId);
  }

  async reorderPhotos(entryId: string, order: string[]): Promise<Entry> {
    const db = await this.ready();
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (let i = 0; i < order.length; i += 1) {
        await tx.runAsync(
          'UPDATE photos SET sort_order = ? WHERE id = ? AND entry_id = ?',
          i,
          order[i],
          entryId,
        );
      }
      await tx.runAsync(
        'UPDATE entries SET updated_at = ?, sync_status = ? WHERE id = ?',
        nowIso(),
        'pending',
        entryId,
      );
    });
    return this.requireEntry(db, entryId);
  }

  async resetToSampleData(): Promise<void> {
    // Publish the in-flight promise as `seeded` so any concurrent `ready()`
    // call piggybacks on the reset instead of racing a second seed.
    this.seeded = this.rebuildSampleData();
    await this.seeded;
  }

  private async rebuildSampleData(): Promise<void> {
    const db = await getDb();
    clearAllPhotos();
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync('DELETE FROM photos');
      await tx.runAsync('DELETE FROM entries');
      await tx.runAsync('DELETE FROM meta');
    });
    const entries = await buildSeedEntries();
    await this.insertEntries(db, entries);
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', 'seeded', 'true');
  }
}

export const sqliteEntryRepository = new SqliteEntryRepository();
