import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * The Supabase user id sync writes rows under — the signed-in account
 * (Milestone 6). Returns `null` when signed out or unconfigured, in which case
 * the sync engine idles.
 */

let cached: string | null = null;

export function knownSyncUserId(): string | null {
  return cached;
}

/** Call on sign-out so the next pass re-reads the (now empty) session. */
export function clearSyncUserId(): void {
  cached = null;
}

export async function getSyncUserId(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    cached = data.session?.user?.id ?? null;
    return cached;
  } catch (err) {
    console.warn('[sprig] getSyncUserId failed', err);
    return null;
  }
}
