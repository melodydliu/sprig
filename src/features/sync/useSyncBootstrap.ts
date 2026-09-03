import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import { syncEngine } from './index';

/**
 * Mount once (in the authed layout). Kicks an initial sync, keeps the pending
 * count fresh, and re-syncs whenever the app comes back to the foreground.
 * Also drives Supabase's token auto-refresh off the app's active state, per the
 * supabase-js React Native guidance.
 */
export function useSyncBootstrap(): void {
  useEffect(() => {
    void syncEngine.refreshPending();
    if (!isSupabaseConfigured) return;

    void syncEngine.requestSync();
    if (supabase) supabase.auth.startAutoRefresh();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase?.auth.startAutoRefresh();
        void syncEngine.requestSync();
      } else {
        supabase?.auth.stopAutoRefresh();
      }
    });

    return () => {
      sub.remove();
      supabase?.auth.stopAutoRefresh();
    };
  }, []);
}
