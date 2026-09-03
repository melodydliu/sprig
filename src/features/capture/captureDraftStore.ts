import { create } from 'zustand';

import type { PhotoInput } from '@/data/repositories';
import type { Category, ColorName, EntryDraft, GeoPoint, LocationSource } from '@/types/entry';

/** Ephemeral state for the in-progress capture. Cleared after save or discard. */
interface CaptureDraftState extends EntryDraft {
  photos: PhotoInput[];
  /** GPS captured in the background while the photo was taken. */
  gpsLocation: GeoPoint | null;
  /** EXIF GPS found on a picked library photo, if any. */
  exifLocation: GeoPoint | null;

  reset: () => void;
  setPhotos: (photos: PhotoInput[]) => void;
  addPhotos: (photos: PhotoInput[]) => void;
  removePhotoAt: (index: number) => void;
  setField: <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => void;
  patch: (partial: Partial<EntryDraft>) => void;
  toggleColor: (color: ColorName) => void;
  setCategory: (category: Category) => void;
  setLocation: (
    point: GeoPoint | null,
    source: LocationSource | null,
    label?: string | null,
  ) => void;
  setGpsLocation: (point: GeoPoint | null) => void;
  setExifLocation: (point: GeoPoint | null) => void;
  toDraft: () => EntryDraft;
}

function emptyDraft(): EntryDraft {
  return {
    name: null,
    category: 'flower',
    colors: [],
    notes: '',
    location: null,
    locationSource: null,
    locationLabel: null,
    sightedAt: new Date().toISOString(),
    tags: [],
    isFavorite: false,
  };
}

export const useCaptureDraft = create<CaptureDraftState>((set, get) => ({
  ...emptyDraft(),
  photos: [],
  gpsLocation: null,
  exifLocation: null,

  reset: () => set({ ...emptyDraft(), photos: [], gpsLocation: null, exifLocation: null }),

  setPhotos: (photos) => set({ photos }),
  addPhotos: (photos) => set({ photos: [...get().photos, ...photos].slice(0, 10) }),
  removePhotoAt: (index) => set({ photos: get().photos.filter((_, i) => i !== index) }),

  setField: (key, value) => set({ [key]: value } as Partial<CaptureDraftState>),

  patch: (partial) => set(partial as Partial<CaptureDraftState>),

  toggleColor: (color) => {
    const colors = get().colors;
    set({
      colors: colors.includes(color)
        ? colors.filter((c) => c !== color)
        : [...colors, color],
    });
  },

  setCategory: (category) => set({ category }),

  setLocation: (point, source, label) =>
    set({
      location: point,
      locationSource: source,
      locationLabel: label === undefined ? get().locationLabel : label,
    }),

  setGpsLocation: (point) => set({ gpsLocation: point }),
  setExifLocation: (point) => set({ exifLocation: point }),

  toDraft: () => {
    const s = get();
    return {
      name: s.name,
      category: s.category,
      colors: s.colors,
      notes: s.notes,
      location: s.location,
      locationSource: s.locationSource,
      locationLabel: s.locationLabel,
      sightedAt: s.sightedAt,
      tags: s.tags,
      isFavorite: s.isFavorite,
    };
  },
}));
