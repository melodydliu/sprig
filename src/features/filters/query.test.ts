import type { EntryFilter } from '@/data/repositories';
import type { Entry } from '@/types/entry';

import {
  EMPTY_FILTER,
  compareEntries,
  countActiveFilters,
  isFilterActive,
  matchesFilter,
  matchesSearch,
  runQuery,
} from './query';

const HB = { latitude: 33.6595, longitude: -117.9988 };
const LAGUNA = { latitude: 33.5427, longitude: -117.7854 }; // ~15 mi from HB

function makeEntry(over: Partial<Entry> = {}): Entry {
  return {
    id: over.id ?? 'e1',
    userId: 'u1',
    name: 'Wild fennel',
    category: 'foliage',
    colors: ['green', 'yellow'],
    notes: 'along the bike path',
    photos: [],
    location: HB,
    locationSource: 'gps',
    locationLabel: 'Bike path, Bolsa Chica',
    sightedAt: '2026-06-01T12:00:00.000Z',
    tags: ['roadside', 'aromatic'],
    isFavorite: false,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
    deletedAt: null,
    syncStatus: 'synced',
    ...over,
  };
}

const filter = (over: Partial<EntryFilter> = {}): EntryFilter => ({ ...EMPTY_FILTER, ...over });

describe('matchesSearch', () => {
  const e = makeEntry();

  it('returns true for an empty term', () => {
    expect(matchesSearch(e, '')).toBe(true);
    expect(matchesSearch(e, '   ')).toBe(true);
  });

  it('matches name, notes, tags and location label case-insensitively', () => {
    expect(matchesSearch(e, 'FENNEL')).toBe(true);
    expect(matchesSearch(e, 'bike path')).toBe(true);
    expect(matchesSearch(e, 'aromatic')).toBe(true);
    expect(matchesSearch(e, 'bolsa')).toBe(true);
  });

  it('does not match unrelated terms', () => {
    expect(matchesSearch(e, 'rose')).toBe(false);
  });

  it('handles unnamed entries', () => {
    expect(matchesSearch(makeEntry({ name: null }), 'fennel')).toBe(false);
  });
});

describe('matchesFilter', () => {
  it('filters by category (multi = OR)', () => {
    const e = makeEntry({ category: 'flower' });
    expect(matchesFilter(e, filter({ categories: ['flower', 'foliage'] }))).toBe(true);
    expect(matchesFilter(e, filter({ categories: ['fruit_vegetable'] }))).toBe(false);
  });

  it('filters by color (any overlap)', () => {
    const e = makeEntry({ colors: ['green', 'yellow'] });
    expect(matchesFilter(e, filter({ colors: ['red', 'yellow'] }))).toBe(true);
    expect(matchesFilter(e, filter({ colors: ['red', 'blue'] }))).toBe(false);
  });

  it('filters by tag (any overlap)', () => {
    const e = makeEntry({ tags: ['roadside', 'aromatic'] });
    expect(matchesFilter(e, filter({ tags: ['aromatic'] }))).toBe(true);
    expect(matchesFilter(e, filter({ tags: ['fence-line', 'roadside'] }))).toBe(true);
    expect(matchesFilter(e, filter({ tags: ['fence-line'] }))).toBe(false);
    expect(matchesFilter(makeEntry({ tags: [] }), filter({ tags: ['roadside'] }))).toBe(false);
  });

  it('combines category + tag as AND across facets', () => {
    const e = makeEntry({ category: 'flower', tags: ['spring'] });
    expect(matchesFilter(e, filter({ categories: ['flower'], tags: ['spring'] }))).toBe(true);
    expect(matchesFilter(e, filter({ categories: ['flower'], tags: ['winter'] }))).toBe(false);
  });

  it('filters favorites only', () => {
    expect(matchesFilter(makeEntry({ isFavorite: false }), filter({ favoritesOnly: true }))).toBe(
      false,
    );
    expect(matchesFilter(makeEntry({ isFavorite: true }), filter({ favoritesOnly: true }))).toBe(
      true,
    );
  });

  it('filters by date range, inclusive of the whole end day', () => {
    const e = makeEntry({ sightedAt: '2026-06-15T09:00:00.000Z' });
    expect(matchesFilter(e, filter({ dateFrom: '2026-06-01', dateTo: '2026-06-30' }))).toBe(true);
    expect(matchesFilter(e, filter({ dateFrom: '2026-07-01' }))).toBe(false);
    expect(matchesFilter(e, filter({ dateTo: '2026-06-15' }))).toBe(true);
    expect(matchesFilter(e, filter({ dateTo: '2026-06-14' }))).toBe(false);
  });

  it('filters within a mile radius of the origin', () => {
    const near = makeEntry({ id: 'near', location: HB });
    const far = makeEntry({ id: 'far', location: LAGUNA });
    const f = filter({ withinMiles: 5 });
    expect(matchesFilter(near, f, HB)).toBe(true);
    expect(matchesFilter(far, f, HB)).toBe(false);
  });

  it('excludes entries with no location when a radius filter is set', () => {
    const noLoc = makeEntry({ location: null });
    expect(matchesFilter(noLoc, filter({ withinMiles: 50 }), HB)).toBe(false);
  });
});

describe('compareEntries', () => {
  const older = makeEntry({ id: 'old', sightedAt: '2026-01-01T00:00:00.000Z' });
  const newer = makeEntry({ id: 'new', sightedAt: '2026-08-01T00:00:00.000Z' });

  it('sorts newest and oldest', () => {
    expect([older, newer].sort((a, b) => compareEntries(a, b, 'newest'))[0].id).toBe('new');
    expect([older, newer].sort((a, b) => compareEntries(a, b, 'oldest'))[0].id).toBe('old');
  });

  it('sorts by name with unnamed entries last', () => {
    const apple = makeEntry({ id: 'a', name: 'Apple' });
    const zinnia = makeEntry({ id: 'z', name: 'Zinnia' });
    const unnamed = makeEntry({ id: 'u', name: null });
    const sorted = [zinnia, unnamed, apple].sort((a, b) => compareEntries(a, b, 'name'));
    expect(sorted.map((e) => e.id)).toEqual(['a', 'z', 'u']);
  });

  it('sorts nearest by distance to origin, missing locations last', () => {
    const near = makeEntry({ id: 'near', location: HB });
    const far = makeEntry({ id: 'far', location: LAGUNA });
    const noLoc = makeEntry({ id: 'noloc', location: null });
    const sorted = [far, noLoc, near].sort((a, b) => compareEntries(a, b, 'nearest', HB));
    expect(sorted.map((e) => e.id)).toEqual(['near', 'far', 'noloc']);
  });
});

describe('runQuery', () => {
  const entries = [
    makeEntry({ id: 'a', name: 'Acacia', category: 'flower', sightedAt: '2026-03-01T00:00:00.000Z' }),
    makeEntry({ id: 'b', name: 'Bottlebrush', category: 'flower', isFavorite: true, sightedAt: '2026-05-01T00:00:00.000Z' }),
    makeEntry({ id: 'c', name: 'Cedar', category: 'branch_stem', sightedAt: '2026-07-01T00:00:00.000Z' }),
    makeEntry({ id: 'd', name: null, category: 'foliage', deletedAt: '2026-07-02T00:00:00.000Z' }),
  ];

  it('drops soft-deleted entries', () => {
    expect(runQuery(entries).map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('applies search + filter + sort together', () => {
    const result = runQuery(entries, {
      filter: filter({ categories: ['flower'] }),
      sort: 'oldest',
    });
    expect(result.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('returns favorites only when asked', () => {
    const result = runQuery(entries, { filter: filter({ favoritesOnly: true }) });
    expect(result.map((e) => e.id)).toEqual(['b']);
  });
});

describe('filter helpers', () => {
  it('isFilterActive / countActiveFilters', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(countActiveFilters(EMPTY_FILTER)).toBe(0);
    const f = filter({ categories: ['flower', 'foliage'], favoritesOnly: true, dateFrom: '2026-01-01' });
    expect(isFilterActive(f)).toBe(true);
    expect(countActiveFilters(f)).toBe(4);
  });
});
