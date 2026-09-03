import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * The Supabase user id sync writes rows under.
 *
 * Milestone 5c: real auth (M6) isn't wired yet, so we use an **anonymous**
 * Supabase session — a real `auth.users` row + UUID, persisted via the
 * AsyncStorage adapter in `src/lib/supabase.ts`. RLS still applies
 * (`auth.uid() = user_id`). M6 upgrades this anon user to a real account.
 *
 * Requires "Anonymous sign-ins" enabled in the Supabase dashboard
 * (Authentication ▸ Providers). Returns `null` if Supabase isn't configured or
 * the sign-in fails — callers then stay local-only.
 */

let cached: string | null = null;
let inFlight: Promise<string | null> | null = null;

export function knownSyncUserId(): string | null {
  return cached;
}

export async function getSyncUserId(): Promise<string | null> {
  if (cached) return cached;
  if (!isSupabaseConfigured || !supabase) return null;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData.session?.user?.id ?? null;

      if (!userId) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('[sprig] anonymous sign-in failed', error.message);
          return null;
        }
        userId = data.user?.id ?? null;
      }

      cached = userId;
      return userId;
    } catch (err) {
      console.warn('[sprig] getSyncUserId failed', err);
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
