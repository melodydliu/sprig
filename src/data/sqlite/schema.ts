/**
 * SQLite schema for Sprig's local database (`sprig.db`).
 *
 * Migrations run in order, keyed off `PRAGMA user_version`. To evolve the
 * schema, append a new entry — never edit an existing one. Milestone 5c will
 * add a migration for the `sync_queue` table.
 */

export interface Migration {
  version: number;
  statements: string[];
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE entries (
        id              TEXT PRIMARY KEY NOT NULL,
        user_id         TEXT NOT NULL,
        name            TEXT,
        category        TEXT NOT NULL,
        colors          TEXT NOT NULL DEFAULT '[]',
        notes           TEXT NOT NULL DEFAULT '',
        location_lat    REAL,
        location_lng    REAL,
        location_source TEXT,
        location_label  TEXT,
        sighted_at      TEXT NOT NULL,
        tags            TEXT NOT NULL DEFAULT '[]',
        is_favorite     INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL,
        deleted_at      TEXT,
        sync_status     TEXT NOT NULL DEFAULT 'pending'
      )`,
      `CREATE INDEX idx_entries_sighted_at ON entries (sighted_at)`,
      `CREATE INDEX idx_entries_sync_status ON entries (sync_status)`,
      `CREATE TABLE photos (
        id            TEXT PRIMARY KEY NOT NULL,
        entry_id      TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
        local_uri     TEXT NOT NULL,
        remote_url    TEXT,
        thumbnail_uri TEXT NOT NULL,
        width         INTEGER NOT NULL DEFAULT 0,
        height        INTEGER NOT NULL DEFAULT 0,
        taken_at      TEXT,
        sort_order    INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE INDEX idx_photos_entry_id ON photos (entry_id)`,
      `CREATE TABLE meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;
