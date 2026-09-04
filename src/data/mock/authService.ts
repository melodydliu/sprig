import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthService } from '@/data/repositories';
import type { AuthUser } from '@/types/entry';

/**
 * Web-only stand-in for `AuthService` (see `src/data/index.web.ts`). `npm run web`
 * is for layout checks; this accepts any email/password and persists a fake
 * session so the login wall doesn't block iteration. Native uses the real
 * Supabase auth service.
 */

const SESSION_KEY = 'sprig.mock.session.v1';

function makeUser(email: string): AuthUser {
  const normalized = email.trim().toLowerCase();
  return {
    id: `mock-${normalized}`,
    email: normalized,
    profile: {
      id: `mock-${normalized}`,
      displayName: normalized.split('@')[0] || 'Forager',
      defaultMapRegion: {
        latitude: 33.6595,
        longitude: -117.9988,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      },
    },
  };
}

class MockAuthService implements AuthService {
  private user: AuthUser | null = null;
  private loaded = false;
  private listeners = new Set<(u: AuthUser | null) => void>();

  private async ensureLoaded() {
    if (this.loaded) return;
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      this.user = raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      this.user = null;
    }
    this.loaded = true;
  }

  private async setSession(user: AuthUser | null) {
    this.user = user;
    if (user) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(SESSION_KEY);
    this.listeners.forEach((cb) => cb(user));
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    await this.ensureLoaded();
    return this.user;
  }

  async signUp(email: string, _password: string): Promise<AuthUser> {
    const user = makeUser(email);
    await this.setSession(user);
    return user;
  }

  async signIn(email: string, _password: string): Promise<AuthUser> {
    const user = makeUser(email);
    await this.setSession(user);
    return user;
  }

  async signOut(): Promise<void> {
    await this.setSession(null);
  }

  async sendPasswordReset(): Promise<void> {
    /* no-op on web */
  }

  async updatePassword(): Promise<void> {
    /* no-op on web */
  }

  async deleteAccount(): Promise<void> {
    await this.setSession(null);
  }

  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const mockAuthService = new MockAuthService();
