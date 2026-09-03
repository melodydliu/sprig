import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './schema';

/**
 * Lazily-opened singleton handle to `sprig.db`. Every SQLite repository method
 * awaits `getDb()`, so migrations run exactly once, on first access.
 */

const DB_NAME = 'sprig.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const stmt of migration.statements) {
        await tx.execAsync(stmt);
      }
    });
    // PRAGMA can't be parameterised and isn't allowed inside a transaction.
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    current = migration.version;
  }
}
