import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { regenerateThumbnail } from '@/lib/images';

import { getMeta, setMeta } from './read';

const META_KEY = 'thumbnails_upgraded_v1080';

interface PhotoThumbRow {
  id: string;
  entry_id: string;
  local_uri: string;
  thumbnail_uri: string;
  remote_url: string | null;
  width: number;
  height: number;
}

/**
 * One-time upgrade for photos captured before the Journal list switched to
 * full-width cards: their on-disk thumbnail was generated at the old, much
 * smaller size (`THUMB_LONG_EDGE` used to be 420px) and now looks blurry
 * stretched across a card. Regenerates each *local* thumbnail from its
 * full-res local file at the current, larger size.
 *
 * Skips photos whose thumbnail already points at a synced-from-cloud
 * full-res URL (`remoteToPhoto` reuses `remote_url` as the "thumbnail" since
 * there's no separate remote thumb) — those are already full quality.
 * Best-effort per photo; gated by a `meta` flag so it only ever runs once.
 */
export async function upgradeThumbnailsOnce(db: SQLiteDatabase): Promise<void> {
  if (await getMeta(db, META_KEY)) return;

  const rows = await db.getAllAsync<PhotoThumbRow>(
    'SELECT id, entry_id, local_uri, thumbnail_uri, remote_url, width, height FROM photos',
  );

  for (const row of rows) {
    if (!row.local_uri || row.thumbnail_uri === row.remote_url || row.thumbnail_uri === row.local_uri) {
      continue;
    }

    const next = await regenerateThumbnail(
      `${row.entry_id}_${row.id}`,
      row.local_uri,
      row.width,
      row.height,
    );
    if (!next) continue;

    await db.runAsync('UPDATE photos SET thumbnail_uri = ? WHERE id = ?', next.uri, row.id);
    try {
      const old = new File(row.thumbnail_uri);
      if (old.exists) old.delete();
    } catch {
      // best effort — an orphaned old thumb file isn't worth failing over
    }
  }

  await setMeta(db, META_KEY, '1');
}
