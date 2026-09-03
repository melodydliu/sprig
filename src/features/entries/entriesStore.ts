import { create } from 'zustand';

import { entryRepository } from '@/data';
import { syncEngine } from '@/features/sync';
import type { EntryDraft, Entry } from '@/types/entry';
import type { PhotoInput } from '@/data/repositories';

interface EntriesState {
  all: Entry[];
  loading: boolean;
  refreshing: boolean;
  loaded: boolean;
  error: string | null;

  load: (opts?: { force?: boolean; refreshing?: boolean }) => Promise<void>;
  getById: (id: string) => Entry | undefined;
  create: (draft: EntryDraft, photos: PhotoInput[]) => Promise<Entry>;
  update: (id: string, patch: Partial<EntryDraft>) => Promise<Entry>;
  toggleFavorite: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addPhotos: (id: string, photos: PhotoInput[]) => Promise<Entry>;
  removePhoto: (entryId: string, photoId: string) => Promise<Entry>;
  resetToSampleData: () => Promise<void>;
}

function upsert(list: Entry[], entry: Entry): Entry[] {
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx === -1) return [entry, ...list];
  const next = list.slice();
  next[idx] = entry;
  return next;
}

export const useEntries = create<EntriesState>((set, get) => ({
  all: [],
  loading: false,
  refreshing: false,
  loaded: false,
  error: null,

  load: async (opts) => {
    if (get().loading) return;
    if (get().loaded && !opts?.force && !opts?.refreshing) return;
    set(opts?.refreshing ? { refreshing: true } : { loading: true });
    try {
      const all = await entryRepository.list();
      set({ all, loaded: true, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  getById: (id) => get().all.find((e) => e.id === id),

  create: async (draft, photos) => {
    const entry = await entryRepository.create(draft, photos);
    set({ all: upsert(get().all, entry) });
    syncEngine.requestSync();
    return entry;
  },

  update: async (id, patch) => {
    const entry = await entryRepository.update(id, patch);
    set({ all: upsert(get().all, entry) });
    syncEngine.requestSync();
    return entry;
  },

  toggleFavorite: async (id) => {
    const current = get().all.find((e) => e.id === id);
    if (!current) return;
    // optimistic
    set({ all: upsert(get().all, { ...current, isFavorite: !current.isFavorite }) });
    try {
      const entry = await entryRepository.setFavorite(id, !current.isFavorite);
      set({ all: upsert(get().all, entry) });
      syncEngine.requestSync();
    } catch {
      set({ all: upsert(get().all, current) });
    }
  },

  remove: async (id) => {
    await entryRepository.remove(id);
    set({ all: get().all.filter((e) => e.id !== id) });
    syncEngine.requestSync();
  },

  addPhotos: async (id, photos) => {
    const entry = await entryRepository.addPhotos(id, photos);
    set({ all: upsert(get().all, entry) });
    syncEngine.requestSync();
    return entry;
  },

  removePhoto: async (entryId, photoId) => {
    const entry = await entryRepository.removePhoto(entryId, photoId);
    set({ all: upsert(get().all, entry) });
    syncEngine.requestSync();
    return entry;
  },

  resetToSampleData: async () => {
    set({ loading: true });
    try {
      await entryRepository.resetToSampleData();
      const all = await entryRepository.list();
      set({ all, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
}));
