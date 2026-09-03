import { isSupabaseConfigured } from '@/lib/supabase';

import { createSyncEngine, type SyncDeps } from './engine';
import { getSyncUserId } from './identity';
import { localDeps } from './local';
import { remoteDeps } from './remote';
import { useSync } from './syncStore';

/**
 * The app's single sync engine: local SQLite is the source of truth, Supabase is
 * backup + cross-device sync. Triggered from `entriesStore` after each write,
 * from `useSyncBootstrap` on app foreground, and from Settings / pull-to-refresh.
 */
const deps: SyncDeps = {
  getUserId: getSyncUserId,
  ...localDeps,
  ...remoteDeps,
};

export const syncEngine = createSyncEngine(deps);

if (!isSupabaseConfigured) useSync.getState().set({ status: 'disabled' });

export { useSync } from './syncStore';
export type { SyncStatus } from './syncStore';
