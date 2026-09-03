/**
 * Pure query helpers for the journal: search, filter, sort.
 * No React, no I/O — unit-tested in query.test.ts.
 */

import { distanceMiles } from '@/lib/geo';
import type { EntryFilter, EntryQuery, SortKey } from '@/data/repositories';
import type { Entry, GeoPoint } from '@/types/entry';

export const EMPTY_FILTER: EntryFilter = {
  categories: [],
  colors: [],
  tags: [],
  favoritesOnly: false,
  dateFrom: null,
  dateTo: null,
  withinMiles: null,
};

export function isFilterActive(f: EntryFilter): boolean {
  return (
    f.categories.length > 0 ||
    f.colors.length > 0 ||
    f.tags.length > 0 ||
    f.favoritesOnly ||
    f.dateFrom != null ||
    f.dateTo != null ||
    f.withinMiles != null
  );
}

export function countActiveFilters(f: EntryFilter): number {
  let n = 0;
  n += f.categories.length;
  n += f.colors.length;
  n += f.tags.length;
  if (f.favoritesOnly) n += 1;
  if (f.dateFrom != null || f.dateTo != null) n += 1;
  if (f.withinMiles != null) n += 1;
  return n;
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Matches name, notes, tags, and location label. */
export function matchesSearch(entry: Entry, rawTerm: string): boolean {
  const term = normalize(rawTerm);
  if (!term) return true;
  const haystacks = [
    entry.name ?? '',
    entry.notes,
    entry.locationLabel ?? '',
    ...entry.tags,
  ];
  return haystacks.some((h) => normalize(h).includes(term));
}

export function matchesFilter(
  entry: Entry,
  filter: EntryFilter,
  origin?: GeoPoint | null,
): boolean {
  if (filter.categories.length > 0 && !filter.categories.includes(entry.category)) {
    return false;
  }
  if (filter.colors.length > 0 && !filter.colors.some((c) => entry.colors.includes(c))) {
    return false;
  }
  if (filter.tags.length > 0 && !filter.tags.some((t) => entry.tags.includes(t))) {
    return false;
  }
  if (filter.favoritesOnly && !entry.isFavorite) {
    return false;
  }
  if (filter.dateFrom && entry.sightedAt < filter.dateFrom) {
    return false;
  }
  if (filter.dateTo && entry.sightedAt > endOfDay(filter.dateTo)) {
    return false;
  }
  if (filter.withinMiles != null) {
    if (!origin || !entry.location) return false;
    if (distanceMiles(origin, entry.location) > filter.withinMiles) return false;
  }
  return true;
}

function endOfDay(iso: string): string {
  // Allow `dateTo` to be a plain date and still include that whole day.
  if (iso.length <= 10) return `${iso}T23:59:59.999Z`;
  return iso;
}

export function compareEntries(
  a: Entry,
  b: Entry,
  sort: SortKey,
  origin?: GeoPoint | null,
): number {
  switch (sort) {
    case 'oldest':
      return a.sightedAt.localeCompare(b.sightedAt);
    case 'name': {
      const an = (a.name ?? '').toLowerCase();
      const bn = (b.name ?? '').toLowerCase();
      // Unnamed entries sink to the bottom.
      if (!an && !bn) return b.sightedAt.localeCompare(a.sightedAt);
      if (!an) return 1;
      if (!bn) return -1;
      return an.localeCompare(bn);
    }
    case 'recently_updated':
      return b.updatedAt.localeCompare(a.updatedAt);
    case 'nearest': {
      if (!origin) return b.sightedAt.localeCompare(a.sightedAt);
      const ad = a.location ? distanceMiles(origin, a.location) : Number.POSITIVE_INFINITY;
      const bd = b.location ? distanceMiles(origin, b.location) : Number.POSITIVE_INFINITY;
      if (ad === bd) return b.sightedAt.localeCompare(a.sightedAt);
      return ad - bd;
    }
    case 'newest':
    default:
      return b.sightedAt.localeCompare(a.sightedAt);
  }
}

/** Full pipeline: drop soft-deleted, search, filter, then sort a copy. */
export function runQuery(entries: Entry[], query: EntryQuery = {}): Entry[] {
  const { search = '', filter, sort = 'newest', origin } = query;
  const out = entries.filter((e) => {
    if (e.deletedAt) return false;
    if (!matchesSearch(e, search)) return false;
    if (filter && !matchesFilter(e, filter, origin)) return false;
    return true;
  });
  out.sort((a, b) => compareEntries(a, b, sort, origin));
  return out;
}
