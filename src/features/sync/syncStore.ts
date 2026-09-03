import { create } from 'zustand';

export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  /** Local rows not yet confirmed on the server. */
  pending: number;
  lastSyncedAt: string | null;
  error: string | null;
  set: (patch: Partial<SyncState>) => void;
}

/**
 * `status` starts `idle`; `src/features/sync/index.ts` flips it to `disabled`
 * at load time when Supabase isn't configured. Kept free of the `@/lib/supabase`
 * import so the engine stays unit-testable without the native/AsyncStorage graph.
 */
export const useSync = create<SyncState>((set) => ({
  status: 'idle',
  pending: 0,
  lastSyncedAt: null,
  error: null,
  set: (patch) => set(patch),
}));
