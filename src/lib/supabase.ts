import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Supabase client.
 *
 * Milestone 5b wires the config only — nothing calls this yet. Milestone 5c
 * (sync queue) and Milestone 6 (auth) are the first consumers.
 *
 * Returns `null` until the Supabase URL + anon key are available, so callers can
 * fall back to local-only behaviour. See `supabase/README.md`.
 *
 * Config resolution order:
 *   1. `EXPO_PUBLIC_SUPABASE_*` env vars (local dev via `.env.local`).
 *   2. `expo.extra.supabase*` in `app.json` — always embedded in the JS bundle,
 *      including OTA updates, where env-var inlining is unreliable.
 * Both hold the same non-secret publishable values (the anon key ships in the
 * client either way).
 */

const extra = Constants.expoConfig?.extra ?? {};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? (extra.supabaseUrl as string | undefined);
const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (extra.supabaseAnonKey as string | undefined);

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // No web redirect flow on native; magic-link handling is set up in M6.
        detectSessionInUrl: false,
      },
    })
  : null;
