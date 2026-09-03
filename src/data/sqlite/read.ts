import type { SQLiteDatabase } from 'expo-sqlite';

import type { Entry } from '@/types/entry';

import { rowToEntry, type EntryRow, type PhotoRow } from './mappers';

/**
 * Shared read path for the SQLite layer. Both `SqliteEntryRepository` and the
 * sync engine load entries through these so there is exactly one query + one
 * row→domain mapping.
 */

export async function loadEntryRows(
  db: SQLiteDatabase,
  opts: { includeDeleted?: boolean } = {},
): Promise<EntryRow[]> {
  const where = opts.includeDeleted ? '' : ' WHERE deleted_at IS NULL';
  return db.getAllAsync<EntryRow>(`SELECT * FROM entries${where}`);
}

export async function attachPhotos(db: SQLiteDatabase, entryRows: EntryRow[]): Promise<Entry[]> {
  if (entryRows.length === 0) return [];
  const ids = entryRows.map((r) => r.id);
  const marks = ids.map(() => '?').join(', ');
  const photoRows = await db.getAllAsync<PhotoRow>(
    `SELECT * FROM photos WHERE entry_id IN (${marks})`,
    ids,
  );
  const byEntry = new Map<string, PhotoRow[]>();
  for (const pr of photoRows) {
    const list = byEntry.get(pr.entry_id);
    if (list) list.push(pr);
    else byEntry.set(pr.entry_id, [pr]);
  }
  return entryRows.map((er) => rowToEntry(er, byEntry.get(er.id) ?? []));
}

/** Every entry (optionally including soft-deleted), each with its photos. */
export async function loadEntries(
  db: SQLiteDatabase,
  opts?: { includeDeleted?: boolean },
): Promise<Entry[]> {
  return attachPhotos(db, await loadEntryRows(db, opts));
}

/** One entry by id, including soft-deleted; `null` if it doesn't exist. */
export async function loadEntry(db: SQLiteDatabase, id: string): Promise<Entry | null> {
  const row = await db.getFirstAsync<EntryRow>('SELECT * FROM entries WHERE id = ?', id);
  if (!row) return null;
  const [entry] = await attachPhotos(db, [row]);
  return entry ?? null;
}

export async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM meta WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
}
