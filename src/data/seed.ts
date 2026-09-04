import { uid } from '@/lib/id';
import { copyBundledPhoto } from '@/lib/images';
import type { Category, ColorName, Entry, LocationSource, Photo } from '@/types/entry';

import { SEED_IMAGE_H, SEED_IMAGE_W, seedImages, type SeedImageKey } from './mock/seedImages';

/**
 * The sample foraging journal. Backend-neutral: `buildSeedEntries()` returns
 * plain `Entry[]`, so both the mock layer and the SQLite layer seed from here.
 */

/** Stable local-user id. Matches the id `mockAuthService` hands out until real auth (M6). */
export const MOCK_USER_ID = 'mock-user-sprig';

const DAY = 86_400_000;

interface SeedSpec {
  name: string | null;
  categories: Category[];
  colors: ColorName[];
  notes: string;
  images: SeedImageKey[];
  label: string;
  lat: number;
  lng: number;
  daysAgo: number;
  favorite?: boolean;
  tags?: string[];
  source?: LocationSource;
  noLocation?: boolean;
}

const SPECS: SeedSpec[] = [
  {
    name: 'Wild fennel',
    categories: ['foliage'],
    colors: ['green', 'yellow'],
    notes:
      'Huge stand of it along the bike path, taller than me. Smells like licorice when you brush past. The flower umbels are just starting to open — come back in ~2 weeks for the acid-yellow pollen heads, they are unreal in arrangements and last about a week in water. Watch for the dog-walkers in the morning, easier to cut midday.',
    images: ['foliage-1', 'foliage-3'],
    label: 'Bike path, Bolsa Chica wetlands',
    lat: 33.693,
    lng: -118.047,
    daysAgo: 5,
    favorite: true,
    tags: ['roadside', 'aromatic', 'summer'],
  },
  {
    name: 'Nasturtium',
    categories: ['flower'],
    colors: ['orange', 'red', 'yellow'],
    notes:
      'Spilling over a retaining wall on the corner. Neighbor said take as much as I want. Jewel tones, edible, but they wilt fast — cut early and condition in cold water.',
    images: ['flower-1'],
    label: 'Corner of 11th & Orange, downtown HB',
    lat: 33.6595,
    lng: -117.9988,
    daysAgo: 9,
    favorite: true,
    tags: ['edible', 'fence-line'],
  },
  {
    name: null,
    categories: ['seed_pod_dried'],
    colors: ['brown', 'cream'],
    notes: 'Some kind of dried pod on a tall stalk. Rattly. Need to ID.',
    images: ['pod-1'],
    label: 'Vacant lot behind the Vons on Adams',
    lat: 33.648,
    lng: -117.993,
    daysAgo: 14,
    tags: ['unidentified', 'dried'],
  },
  {
    name: 'Pampas grass',
    categories: ['branch_stem'],
    colors: ['cream', 'white'],
    notes:
      'Three big clumps at the edge of the parking lot. Plumes are full and not shedding yet. Invasive here so nobody minds if I take a lot. Bring the loppers — stems are tough and the leaf edges cut like paper.',
    images: ['branch-1'],
    label: 'Park & ride lot, Goldenwest & Yorktown',
    lat: 33.666,
    lng: -118.005,
    daysAgo: 21,
    tags: ['invasive', 'dramatic', 'dried-ok'],
  },
  {
    name: 'Matilija poppy',
    categories: ['flower'],
    colors: ['white', 'yellow'],
    notes:
      'The "fried egg" poppy. Enormous crepe-paper white petals, yellow center. Only a few open at a time so plan around it. Sap bleeds — sear the stems.',
    images: ['flower-2'],
    label: 'Fairview Park native area, Costa Mesa',
    lat: 33.662,
    lng: -117.943,
    daysAgo: 33,
    favorite: true,
    tags: ['native', 'showstopper'],
  },
  {
    name: 'Toyon berries',
    categories: ['fruit_vegetable', 'branch_stem'],
    colors: ['red', 'green'],
    notes: 'Not ripe yet — still green. Mark for December, the branches are gorgeous for holiday work.',
    images: ['fruit-1'],
    label: 'Bommer Canyon trailhead, Irvine',
    lat: 33.625,
    lng: -117.77,
    daysAgo: 47,
    tags: ['native', 'winter', 'berries'],
  },
  {
    name: 'Eucalyptus (silver dollar)',
    categories: ['foliage'],
    colors: ['green', 'blue'],
    notes:
      'Long low branch hanging over the sidewalk, easy reach. Round juvenile leaves, very silvery. Someone already trims this so I do not feel bad taking a few stems.',
    images: ['foliage-2'],
    label: 'Alley off Adams Ave',
    lat: 33.648,
    lng: -117.9935,
    daysAgo: 60,
    favorite: true,
    tags: ['filler', 'silver', 'evergreen'],
  },
  {
    name: null,
    categories: ['flower'],
    colors: ['purple'],
    notes: '',
    images: ['flower-3'],
    label: 'Median on Beach Blvd near Slater',
    lat: 33.712,
    lng: -117.988,
    daysAgo: 78,
    tags: ['median'],
  },
  {
    name: 'Statice',
    categories: ['flower'],
    colors: ['purple', 'white'],
    notes: 'Papery, basically dries itself. Big patch gone a bit wild in an unmaintained yard.',
    images: ['flower-1', 'flower-2'],
    label: 'Empty house, 8th St',
    lat: 33.6602,
    lng: -117.999,
    daysAgo: 95,
    tags: ['everlasting', 'dried-ok'],
  },
  {
    name: 'Jacaranda',
    categories: ['branch_stem'],
    colors: ['purple', 'blue'],
    notes:
      'Street trees dropping blossoms everywhere. Can only get low branches or fallen ones but the color is worth it for one big statement piece. Very messy in the car.',
    images: ['branch-2'],
    label: 'Santa Ana, Centennial Park neighborhood',
    lat: 33.736,
    lng: -117.92,
    daysAgo: 110,
    tags: ['street-tree', 'spring', 'messy'],
  },
  {
    name: 'Rosemary',
    categories: ['foliage'],
    colors: ['green', 'blue'],
    notes: 'Massive hedge along the sidewalk, woody and huge. Little blue flowers right now. Smells amazing, good for wreaths.',
    images: ['foliage-3'],
    label: 'Sidewalk hedge, Yorktown Ave',
    lat: 33.6668,
    lng: -118.001,
    daysAgo: 125,
    tags: ['herb', 'hedge', 'aromatic'],
  },
  {
    name: null,
    categories: ['other'],
    colors: ['multi'],
    notes:
      'Weird spiky architectural thing, almost like a small dragon fruit cactus but not. Growing out of a crack by the storm drain. Taking a photo now, will research before I try to cut anything — might be spiny or have irritating sap.',
    images: ['other-1'],
    label: 'Storm drain, PCH & Warner',
    lat: 33.686,
    lng: -118.03,
    daysAgo: 140,
    tags: ['unidentified', 'caution'],
  },
  {
    name: 'California buckwheat',
    categories: ['seed_pod_dried'],
    colors: ['brown', 'pink', 'cream'],
    notes: 'Flower heads have gone rusty-pink and papery. Holds shape beautifully dried. Whole hillside of it.',
    images: ['pod-2'],
    label: 'Heisler Park bluff, Laguna Beach',
    lat: 33.546,
    lng: -117.795,
    daysAgo: 155,
    favorite: true,
    tags: ['native', 'dried', 'texture'],
  },
  {
    name: 'Lemon branches',
    categories: ['fruit_vegetable', 'branch_stem', 'foliage'],
    colors: ['yellow', 'green'],
    notes: 'Tree branches hang way over the back fence into the alley. Fruit + glossy leaves + the odd blossom all at once. Owner waved, said help yourself.',
    images: ['fruit-2', 'fruit-3'],
    label: 'Alley behind Delaware St',
    lat: 33.657,
    lng: -117.997,
    daysAgo: 170,
    favorite: true,
    tags: ['citrus', 'fence-line', 'fragrant'],
  },
  {
    name: 'Sea lavender',
    categories: ['flower'],
    colors: ['purple'],
    notes: 'Hazy purple clouds of tiny flowers right at the edge of the marsh. Check the tide chart, the good patch is only reachable at low tide.',
    images: ['flower-3'],
    label: 'Back Bay loop, Newport',
    lat: 33.63,
    lng: -117.888,
    daysAgo: 185,
    tags: ['marsh', 'airy'],
  },
  {
    name: null,
    categories: ['foliage'],
    colors: ['green'],
    notes: 'Ferny green stuff in the shade under a big pine. Good filler if it holds up. Test a stem first.',
    images: ['foliage-1'],
    label: 'Mile Square Park, Fountain Valley',
    lat: 33.71,
    lng: -117.943,
    daysAgo: 200,
  },
  {
    name: 'Bottlebrush',
    categories: ['flower'],
    colors: ['red'],
    notes: 'Big shrubs by the tennis courts, in full red bloom. Bees love it so go gently. Woody stems, bring snips.',
    images: ['flower-1'],
    label: 'Seal Beach tennis courts',
    lat: 33.7414,
    lng: -118.1048,
    daysAgo: 220,
    tags: ['shrub', 'pollinator'],
  },
  {
    name: 'Pepper tree berries',
    categories: ['fruit_vegetable', 'branch_stem'],
    colors: ['pink', 'red'],
    notes: 'Cascading clusters of tiny pink peppercorns. Delicate, drapes really nicely. Drops bits everywhere though.',
    images: ['fruit-1'],
    label: 'Old pepper tree, Garden Grove',
    lat: 33.774,
    lng: -117.941,
    daysAgo: 245,
    favorite: true,
    tags: ['drapey', 'pink', 'delicate'],
  },
  {
    name: 'Acacia',
    categories: ['flower'],
    colors: ['yellow'],
    notes: 'First one blooming — fuzzy little yellow pompoms, whole tree glowing. Short window, maybe 10 days. Sneezy.',
    images: ['flower-2'],
    label: 'Westminster, near the library',
    lat: 33.759,
    lng: -117.99,
    daysAgo: 275,
    tags: ['winter-bloom', 'yellow', 'fleeting'],
  },
  {
    name: null,
    categories: ['branch_stem'],
    colors: ['brown'],
    notes:
      'Bare twisty branches on a shrub that dropped all its leaves. Really sculptural, almost black. No idea what it is but I want it for a tall bare-branch arrangement. Coming back with the good loppers and will ask the house if anyone is home.',
    images: ['branch-1'],
    label: 'Front yard, Magnolia St',
    lat: 33.703,
    lng: -117.988,
    daysAgo: 300,
    tags: ['bare-branch', 'sculptural', 'winter', 'unidentified'],
  },
  {
    name: 'Wild mustard',
    categories: ['flower'],
    colors: ['yellow', 'green'],
    notes: 'The whole vacant field turns yellow with it. Leggy and a bit weedy up close but a big loose armful in a bucket looks like spring itself.',
    images: ['flower-3'],
    label: 'Vacant field, Edwards St',
    lat: 33.68,
    lng: -118.01,
    daysAgo: 330,
    tags: ['field', 'spring', 'abundant'],
  },
  {
    name: 'Dusty miller',
    categories: ['foliage'],
    colors: ['white', 'green'],
    notes: 'Silvery felted leaves in a commercial landscaping strip. Nobody will miss a few stems. Great cool-toned filler.',
    images: ['foliage-2'],
    label: 'Office park planting, Fountain Valley',
    lat: 33.709,
    lng: -117.945,
    daysAgo: 350,
    tags: ['silver', 'filler'],
  },
];

async function buildPhotos(entryId: string, keys: SeedImageKey[]): Promise<Photo[]> {
  const photos: Photo[] = [];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const { localUri, thumbnailUri } = await copyBundledPhoto(
      seedImages[key],
      `${entryId}_${i}_${key}`,
    );
    photos.push({
      id: uid('ph_'),
      entryId,
      localUri,
      remoteUrl: null,
      thumbnailUri,
      width: SEED_IMAGE_W,
      height: SEED_IMAGE_H,
      takenAt: null,
      sortOrder: i,
    });
  }
  return photos;
}

/** Builds the full sample entry set, copying bundled photos into app storage. */
export async function buildSeedEntries(now: number = Date.now()): Promise<Entry[]> {
  const entries: Entry[] = [];
  for (const spec of SPECS) {
    const id = uid('en_');
    const sighted = new Date(now - spec.daysAgo * DAY).toISOString();
    const created = new Date(now - spec.daysAgo * DAY + 3_600_000).toISOString();
    const photos = await buildPhotos(id, spec.images);
    entries.push({
      id,
      userId: MOCK_USER_ID,
      name: spec.name,
      categories: spec.categories,
      colors: spec.colors,
      notes: spec.notes,
      photos,
      location: spec.noLocation ? null : { latitude: spec.lat, longitude: spec.lng },
      locationSource: spec.noLocation ? null : (spec.source ?? 'gps'),
      locationLabel: spec.noLocation ? null : spec.label,
      sightedAt: sighted,
      tags: spec.tags ?? [],
      isFavorite: spec.favorite ?? false,
      createdAt: created,
      updatedAt: created,
      deletedAt: null,
      // Sample data has never been backed up — the first sync pass pushes it.
      syncStatus: 'pending',
    });
  }
  return entries;
}
