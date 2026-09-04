import { getDb } from '@/data/sqlite/db';
import { clearAllPhotos } from '@/lib/images';

import { clearSyncUserId } from './identity';
import { resolveLocalForUser } from './plan';
import { useSync } from './syncStore';

/**
 * Keeps the on-device database tied to one account. The local SQLite file is a
 * cache of the signed-in user's cloud data, so switching accounts (or signing
 * out) clears it — nothing is lost, the next sync pass re-pulls from Supabase.
 */

const USER_KEY = 'sync_user_id';

async function wipeLocal(): Promise<void> {
  const db = await getDb();
  clearAllPhotos();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM photos');
    await tx.runAsync('DELETE FROM entries');
    await tx.runAsync('DELETE FROM meta');
  });
}

/**
 * Call on every auth state change. `userId === null` means signed out.
 * Returns `true` if the local cache was wiped (caller should reload the store).
 */
export async function reconcileLocalAccount(userId: string | null): Promise<boolean> {
  if (!userId) {
    await wipeLocal();
    clearSyncUserId();
    useSync.setState({ status: 'idle', pending: 0, lastSyncedAt: null, error: null });
    return true;
  }

  const db = await getDb();
  const stored =
    (
      await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM meta WHERE key = ?',
        USER_KEY,
      )
    )?.value ?? null;

  let wiped = false;
  if (resolveLocalForUser(stored, userId) === 'wipe') {
    await wipeLocal();
    wiped = true;
  }
  await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', USER_KEY, userId);
  return wiped;
}
