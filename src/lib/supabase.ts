import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client.
 *
 * Milestone 5b wires the config only — nothing calls this yet. Milestone 5c
 * (sync queue) and Milestone 6 (auth) are the first consumers.
 *
 * Returns `null` until `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
 * are set (in `.env.local`), so callers can fall back to local-only behaviour.
 * See `supabase/README.md`.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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
