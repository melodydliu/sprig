import type { User } from '@supabase/supabase-js';

import type { AuthService } from '@/data/repositories';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types/entry';

import { friendlyAuthError as friendly } from './authErrors';

/** Deep link the password-reset email points back at (→ `src/app/reset-password.tsx`). */
export const RESET_REDIRECT_URL = 'sprig://reset-password';

function client() {
  if (!supabase) {
    throw new Error('Sign-in is unavailable — the app is missing its Supabase configuration.');
  }
  return supabase;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  default_map_region: AuthUser['profile']['defaultMapRegion'];
}

async function loadProfile(userId: string, email: string | null): Promise<AuthUser['profile']> {
  const fallbackName = email?.split('@')[0] || 'Forager';
  try {
    const { data } = await client()
      .from('profiles')
      .select('id, display_name, default_map_region')
      .eq('id', userId)
      .maybeSingle<ProfileRow>();

    if (data) {
      return {
        id: data.id,
        displayName: data.display_name?.trim() || fallbackName,
        defaultMapRegion: data.default_map_region ?? null,
      };
    }
    // The handle_new_user trigger normally creates this; upsert if it's missing.
    await client().from('profiles').upsert({ id: userId, display_name: fallbackName });
  } catch {
    // Offline or transient — fall back to a local-only profile view.
  }
  return { id: userId, displayName: fallbackName, defaultMapRegion: null };
}

async function toAuthUser(user: User): Promise<AuthUser> {
  const profile = await loadProfile(user.id, user.email ?? null);
  return { id: user.id, email: user.email ?? '', profile };
}

class SupabaseAuthService implements AuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await client().auth.getSession();
    const user = data.session?.user;
    return user ? toAuthUser(user) : null;
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await client().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(friendly(error.message));
    if (!data.user) throw new Error('Could not create the account. Try again.');
    if (!data.session) {
      // Email confirmation is on for this project.
      throw new Error('Account created — check your email to confirm it, then sign in.');
    }
    return toAuthUser(data.user);
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await client().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(friendly(error.message));
    return toAuthUser(data.user);
  }

  async signOut(): Promise<void> {
    await client().auth.signOut();
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await client().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: RESET_REDIRECT_URL,
    });
    if (error) throw new Error(friendly(error.message));
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await client().auth.updateUser({ password: newPassword });
    if (error) throw new Error(friendly(error.message));
  }

  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void {
    const { data } = client().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void toAuthUser(session.user).then(cb);
      } else {
        cb(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }
}

export const supabaseAuthService = new SupabaseAuthService();
