import { create } from 'zustand';

import type { EntryFilter, SortKey } from '@/data/repositories';
import type { Category, ColorName } from '@/types/entry';

import { EMPTY_FILTER } from './query';

export type ViewMode = 'list' | 'map';

interface FilterState {
  search: string;
  filter: EntryFilter;
  sort: SortKey;
  viewMode: ViewMode;

  setSearch: (s: string) => void;
  setSort: (s: SortKey) => void;
  setViewMode: (m: ViewMode) => void;
  toggleCategory: (c: Category) => void;
  toggleColor: (c: ColorName) => void;
  toggleFavoritesOnly: () => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setWithinMiles: (miles: number | null) => void;
  clearFilter: () => void;
  clearOne: (key: keyof EntryFilter) => void;
}

export const useFilters = create<FilterState>((set) => ({
  search: '',
  filter: EMPTY_FILTER,
  sort: 'newest',
  viewMode: 'list',

  setSearch: (search) => set({ search }),
  setSort: (sort) => set({ sort }),
  setViewMode: (viewMode) => set({ viewMode }),

  toggleCategory: (c) =>
    set((state) => ({
      filter: {
        ...state.filter,
        categories: state.filter.categories.includes(c)
          ? state.filter.categories.filter((x) => x !== c)
          : [...state.filter.categories, c],
      },
    })),

  toggleColor: (c) =>
    set((state) => ({
      filter: {
        ...state.filter,
        colors: state.filter.colors.includes(c)
          ? state.filter.colors.filter((x) => x !== c)
          : [...state.filter.colors, c],
      },
    })),

  toggleFavoritesOnly: () =>
    set((state) => ({ filter: { ...state.filter, favoritesOnly: !state.filter.favoritesOnly } })),

  setDateRange: (dateFrom, dateTo) =>
    set((state) => ({ filter: { ...state.filter, dateFrom, dateTo } })),

  setWithinMiles: (withinMiles) =>
    set((state) => ({ filter: { ...state.filter, withinMiles } })),

  clearFilter: () => set({ filter: EMPTY_FILTER }),

  clearOne: (key) =>
    set((state) => ({ filter: { ...state.filter, [key]: EMPTY_FILTER[key] } })),
}));
