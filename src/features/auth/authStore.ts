import { create } from 'zustand';

import { authService } from '@/data';
import type { AuthUser } from '@/types/entry';

type Status = 'loading' | 'authed' | 'unauthed';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  error: string | null;
  submitting: boolean;
  bootstrap: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  submitting: false,

  bootstrap: async () => {
    const user = await authService.getCurrentUser();
    set({ user, status: user ? 'authed' : 'unauthed' });
    authService.onAuthStateChange((next) => {
      set({ user: next, status: next ? 'authed' : 'unauthed' });
    });
  },

  signInWithPassword: async (email, password) => {
    set({ submitting: true, error: null });
    try {
      const user = await authService.signInWithPassword(email, password);
      set({ user, status: 'authed', submitting: false });
    } catch (err) {
      set({ submitting: false, error: (err as Error).message });
    }
  },

  signInWithApple: async () => {
    set({ submitting: true, error: null });
    try {
      const user = await authService.signInWithApple();
      set({ user, status: 'authed', submitting: false });
    } catch (err) {
      set({ submitting: false, error: (err as Error).message });
    }
  },

  signInWithGoogle: async () => {
    set({ submitting: true, error: null });
    try {
      const user = await authService.signInWithGoogle();
      set({ user, status: 'authed', submitting: false });
    } catch (err) {
      set({ submitting: false, error: (err as Error).message });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, status: 'unauthed' });
  },

  clearError: () => set({ error: null }),
}));
