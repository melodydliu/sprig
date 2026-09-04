import { create } from 'zustand';

import type { PhotoInput } from '@/data/repositories';

/**
 * Scratch store for the shared camera screen (`/capture`) when it's pushed in
 * `mode: 'add'` to add photo(s) to an entry that's already in progress — a
 * draft being composed (capture/details) or one already saved (entry edit).
 * The caller pushes `/capture` with `mode: 'add'`, then reads `committed`
 * back via `useFocusEffect` on return. Mirrors `locationDraftStore`.
 */
interface AddPhotoDraftState {
  committed: PhotoInput[] | null;

  commit: (photos: PhotoInput[]) => void;
  consume: () => PhotoInput[] | null;
}

export const useAddPhotoDraft = create<AddPhotoDraftState>((set, get) => ({
  committed: null,

  commit: (photos) => set({ committed: photos }),

  consume: () => {
    const c = get().committed;
    set({ committed: null });
    return c;
  },
}));
