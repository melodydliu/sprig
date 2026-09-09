/** Core domain model for Sprig. Kept backend-agnostic on purpose. */

export const CATEGORIES = [
  'flower',
  'foliage',
  'fruit_vegetable',
  'branch_stem',
  'seed_pod_dried',
  'other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  flower: 'Flower',
  foliage: 'Foliage',
  fruit_vegetable: 'Fruit / Veg',
  branch_stem: 'Branch / Stem',
  seed_pod_dried: 'Seed / Pod / Dried',
  other: 'Other',
};

/**
 * Roughly how much of the plant is there to forage — a single optional
 * self-assessment, not a measurement. `null` means the forager didn't record it.
 */
export const AVAILABILITY_LEVELS = ['sparse', 'moderate', 'abundant'] as const;
export type Availability = (typeof AVAILABILITY_LEVELS)[number];

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  sparse: 'Sparse',
  moderate: 'Moderate',
  abundant: 'Abundant',
};

/** One-liners shown under the picker / on the detail screen. */
export const AVAILABILITY_HINTS: Record<Availability, string> = {
  sparse: 'Only a few stems — take little or nothing',
  moderate: 'Enough to pick a small amount',
  abundant: 'Plenty here for cutting',
};

export const COLOR_NAMES = [
  'white',
  'cream',
  'yellow',
  'orange',
  'red',
  'pink',
  'purple',
  'blue',
  'green',
  'brown',
  'black',
  'multi',
] as const;
export type ColorName = (typeof COLOR_NAMES)[number];

export type LocationSource = 'gps' | 'manual' | 'photo_exif';

/** Local-only: reflects whether the row has been pushed to the cloud yet. */
export type SyncStatus = 'pending' | 'synced' | 'error';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Photo {
  id: string;
  entryId: string;
  /** File URI on device (source of truth locally). */
  localUri: string;
  /** Populated after upload to cloud storage; null until then. */
  remoteUrl: string | null;
  /** Small pre-generated thumbnail for lists/markers. */
  thumbnailUri: string;
  width: number;
  height: number;
  takenAt: string | null;
  sortOrder: number;
}

export interface Entry {
  id: string;
  userId: string;
  name: string | null;
  /** At least one category; the first is treated as primary for map pins etc. */
  categories: Category[];
  colors: ColorName[];
  /** How much there is to forage; `null` if not recorded. */
  availability: Availability | null;
  notes: string;
  photos: Photo[];
  location: GeoPoint | null;
  locationSource: LocationSource | null;
  locationLabel: string | null;
  sightedAt: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncStatus: SyncStatus;
}

/** Shape used by the capture/edit form before it becomes an Entry. */
export interface EntryDraft {
  name: string | null;
  categories: Category[];
  colors: ColorName[];
  availability: Availability | null;
  notes: string;
  location: GeoPoint | null;
  locationSource: LocationSource | null;
  locationLabel: string | null;
  sightedAt: string;
  tags: string[];
  isFavorite: boolean;
}

export interface Profile {
  id: string;
  displayName: string;
  defaultMapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}
