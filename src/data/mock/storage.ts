import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entry } from '@/types/entry';

const ENTRIES_KEY = 'forage.mock.entries.v1';
const SEEDED_KEY = 'forage.mock.seeded.v1';

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: Entry[] | null = null;

/** Debounced persist so rapid edits don't thrash AsyncStorage. */
export function persistEntries(entries: Entry[], immediate = false): Promise<void> {
  pending = entries;
  if (immediate) {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = null;
    return flush();
  }
  if (!writeTimer) {
    writeTimer = setTimeout(() => {
      writeTimer = null;
      void flush();
    }, 400);
  }
  return Promise.resolve();
}

async function flush(): Promise<void> {
  if (pending == null) return;
  const snapshot = pending;
  pending = null;
  try {
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('[forage] failed to persist entries', err);
  }
}

export async function loadEntries(): Promise<Entry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ENTRIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Entry[]) : null;
  } catch (err) {
    console.warn('[forage] failed to load entries', err);
    return null;
  }
}

export async function hasSeeded(): Promise<boolean> {
  return (await AsyncStorage.getItem(SEEDED_KEY)) === 'true';
}

export async function markSeeded(): Promise<void> {
  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

export async function clearMockStorage(): Promise<void> {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  pending = null;
  await AsyncStorage.multiRemove([ENTRIES_KEY, SEEDED_KEY]);
}
