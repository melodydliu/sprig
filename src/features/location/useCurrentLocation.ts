import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { GeoPoint } from '@/types/entry';

type PermissionState = 'undetermined' | 'granted' | 'denied';

interface CurrentLocation {
  point: GeoPoint | null;
  permission: PermissionState;
  loading: boolean;
  /** Ask for permission + a fresh fix. Safe to call from a button. */
  request: () => Promise<GeoPoint | null>;
  refresh: () => Promise<GeoPoint | null>;
}

let cachedPoint: GeoPoint | null = null;

/**
 * Foreground location with graceful degradation. Never throws; if permission is
 * denied it simply returns `point: null` and `permission: 'denied'`.
 */
export function useCurrentLocation(auto = true): CurrentLocation {
  const [point, setPoint] = useState<GeoPoint | null>(cachedPoint);
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [loading, setLoading] = useState(false);
  const inFlight = useRef<Promise<GeoPoint | null> | null>(null);

  const fetchFix = useCallback(async (ask: boolean): Promise<GeoPoint | null> => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      setLoading(true);
      try {
        const perm = ask
          ? await Location.requestForegroundPermissionsAsync()
          : await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') {
          setPermission('denied');
          return null;
        }
        setPermission('granted');
        const last = await Location.getLastKnownPositionAsync();
        const pos =
          last ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        cachedPoint = next;
        setPoint(next);
        return next;
      } catch {
        return cachedPoint;
      } finally {
        setLoading(false);
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;
  }, []);

  useEffect(() => {
    if (auto) void fetchFix(false);
  }, [auto, fetchFix]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && auto) void fetchFix(false);
    });
    return () => sub.remove();
  }, [auto, fetchFix]);

  return {
    point,
    permission,
    loading,
    request: () => fetchFix(true),
    refresh: () => fetchFix(false),
  };
}
