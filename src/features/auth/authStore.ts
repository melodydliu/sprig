import { create } from 'zustand';

import { authService } from '@/data';
import { useEntries } from '@/features/entries/entriesStore';
import { syncEngine } from '@/features/sync';
import { reconcileLocalAccount } from '@/features/sync/account';
import type { AuthUser } from '@/types/entry';

type Status = 'loading' | 'authed' | 'unauthed';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  error: string | null;
  submitting: boolean;
  bootstrap: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  clearError: () => void;
}

/** The last user id we reconciled local data for — guards against re-running on
 *  token refreshes, which fire `onAuthStateChange` with the same user. */
let lastUserId: string | null | undefined;

async function onUser(user: AuthUser | null): Promise<void> {
  const uid = user?.id ?? null;
  useAuth.setState({ user, status: user ? 'authed' : 'unauthed' });
  if (uid === lastUserId) return;
  lastUserId = uid;

  try {
    await reconcileLocalAccount(uid);
  } catch (err) {
    console.warn('[sprig] account reconcile failed', err);
  }
  useEntries.getState().reset();

  if (uid) {
    await useEntries.getState().load({ force: true });
    syncEngine.requestSync();
  }
}

async function attempt(
  set: (p: Partial<AuthState>) => void,
  fn: () => Promise<void>,
): Promise<boolean> {
  set({ submitting: true, error: null });
  try {
    await fn();
    set({ submitting: false });
    return true;
  } catch (err) {
    set({ submitting: false, error: (err as Error).message });
    return false;
  }
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  submitting: false,

  bootstrap: async () => {
    try {
      await onUser(await authService.getCurrentUser());
    } catch {
      set({ status: 'unauthed' });
    }
    authService.onAuthStateChange((next) => {
      void onUser(next);
    });
  },

  signUp: (email, password) =>
    attempt(set, async () => {
      await onUser(await authService.signUp(email, password));
    }),

  signIn: (email, password) =>
    attempt(set, async () => {
      await onUser(await authService.signIn(email, password));
    }),

  signOut: async () => {
    try {
      await authService.signOut();
    } finally {
      await onUser(null);
    }
  },

  sendPasswordReset: (email) => attempt(set, () => authService.sendPasswordReset(email)),

  updatePassword: (password) => attempt(set, () => authService.updatePassword(password)),

  clearError: () => set({ error: null }),
}));
