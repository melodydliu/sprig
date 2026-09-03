import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Units = 'mi' | 'km';

const KEY = 'forage.settings.v1';

interface SettingsState {
  units: Units;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setUnits: (u: Units) => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  units: 'mi',
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        if (parsed.units === 'mi' || parsed.units === 'km') set({ units: parsed.units });
      }
    } catch {
      /* keep defaults */
    }
    set({ hydrated: true });
  },

  setUnits: (units) => {
    set({ units });
    void AsyncStorage.setItem(KEY, JSON.stringify({ units: get().units }));
  },
}));
