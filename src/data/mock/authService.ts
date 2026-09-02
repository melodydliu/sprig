import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthService } from '@/data/repositories';
import type { AuthUser } from '@/types/entry';

import { MOCK_USER_ID } from './seed';

const SESSION_KEY = 'forage.mock.session.v1';

/** The one hardcoded credential that works in the mock. */
export const TEST_EMAIL = 'test@forage.app';
export const TEST_PASSWORD = 'forage123';

function makeUser(email: string): AuthUser {
  return {
    id: MOCK_USER_ID,
    email,
    profile: {
      id: MOCK_USER_ID,
      displayName: email.split('@')[0] || 'Forager',
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
    if (user) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
    this.listeners.forEach((cb) => cb(user));
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    await this.ensureLoaded();
    // Dev convenience: skip the login wall while iterating on the rest of the UI.
    // Set EXPO_PUBLIC_FORAGE_DEV_AUTOLOGIN=1 in .env.local (never committed).
    if (!this.user && process.env.EXPO_PUBLIC_FORAGE_DEV_AUTOLOGIN === '1') {
      this.user = makeUser(TEST_EMAIL);
    }
    return this.user;
  }

  async signInWithPassword(email: string, password: string): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 450));
    const normalized = email.trim().toLowerCase();
    if (normalized !== TEST_EMAIL || password !== TEST_PASSWORD) {
      throw new Error('Those details did not match. Try the test login below.');
    }
    const user = makeUser(normalized);
    await this.setSession(user);
    return user;
  }

  async signInWithApple(): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 350));
    const user = makeUser('forager@icloud.com');
    await this.setSession(user);
    return user;
  }

  async signInWithGoogle(): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 350));
    const user = makeUser('forager@gmail.com');
    await this.setSession(user);
    return user;
  }

  async signOut(): Promise<void> {
    await this.setSession(null);
  }

  onAuthStateChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const mockAuthService = new MockAuthService();
