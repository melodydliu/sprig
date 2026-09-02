/** Static require() map for bundled seed photos. All 1200x1500. */

export const SEED_IMAGE_W = 1200;
export const SEED_IMAGE_H = 1500;

export const seedImages = {
  'flower-1': require('@/assets/seed/flower-1.jpg'),
  'flower-2': require('@/assets/seed/flower-2.jpg'),
  'flower-3': require('@/assets/seed/flower-3.jpg'),
  'foliage-1': require('@/assets/seed/foliage-1.jpg'),
  'foliage-2': require('@/assets/seed/foliage-2.jpg'),
  'foliage-3': require('@/assets/seed/foliage-3.jpg'),
  'fruit-1': require('@/assets/seed/fruit-1.jpg'),
  'fruit-2': require('@/assets/seed/fruit-2.jpg'),
  'fruit-3': require('@/assets/seed/fruit-3.jpg'),
  'branch-1': require('@/assets/seed/branch-1.jpg'),
  'branch-2': require('@/assets/seed/branch-2.jpg'),
  'pod-1': require('@/assets/seed/pod-1.jpg'),
  'pod-2': require('@/assets/seed/pod-2.jpg'),
  'other-1': require('@/assets/seed/other-1.jpg'),
  'other-2': require('@/assets/seed/other-2.jpg'),
} as const;

export type SeedImageKey = keyof typeof seedImages;
