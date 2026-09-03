import { create } from 'zustand';

import type { GeoPoint, LocationSource } from '@/types/entry';

/**
 * Scratch store for the shared location-picker screen. A caller seeds it with the
 * current value, navigates to `/location`, and reads `committed` back on return.
 */
interface LocationDraftState {
  seedPoint: GeoPoint | null;
  seedLabel: string | null;
  seedSource: LocationSource | null;

  /** Set by the picker when the user confirms; consumed + cleared by the caller. */
  committed: { point: GeoPoint; label: string | null; source: LocationSource } | null;

  seed: (point: GeoPoint | null, label: string | null, source: LocationSource | null) => void;
  commit: (point: GeoPoint, label: string | null) => void;
  consume: () => LocationDraftState['committed'];
  reset: () => void;
}

export const useLocationDraft = create<LocationDraftState>((set, get) => ({
  seedPoint: null,
  seedLabel: null,
  seedSource: null,
  committed: null,

  seed: (seedPoint, seedLabel, seedSource) =>
    set({ seedPoint, seedLabel, seedSource, committed: null }),

  commit: (point, label) => set({ committed: { point, label, source: 'manual' } }),

  consume: () => {
    const c = get().committed;
    set({ committed: null });
    return c;
  },

  reset: () =>
    set({ seedPoint: null, seedLabel: null, seedSource: null, committed: null }),
}));
