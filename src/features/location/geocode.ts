import * as Location from 'expo-location';

import type { GeoPoint } from '@/types/entry';

/**
 * Turn coordinates into a short human label like "Elm St, Huntington Beach".
 * Uses the OS geocoder (free, no key). Returns null on any failure — callers
 * should treat the label as optional.
 */
export async function reverseGeocode(point: GeoPoint): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(point);
    const first = results[0];
    if (!first) return null;

    const street =
      first.street ??
      (first.name && !/^\d+$/.test(first.name) ? first.name : null) ??
      first.district ??
      null;
    const city = first.city ?? first.subregion ?? first.region ?? null;

    const parts = [street, city].filter(Boolean);
    if (parts.length === 0) return first.region ?? null;
    return parts.join(', ');
  } catch {
    return null;
  }
}

/**
 * Forward geocode a free-text address to coordinates. OS geocoder — reliable on
 * iOS, sometimes empty on Android. Returns null if nothing was found.
 */
export async function forwardGeocode(query: string): Promise<GeoPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const results = await Location.geocodeAsync(trimmed);
    const first = results[0];
    if (!first) return null;
    return { latitude: first.latitude, longitude: first.longitude };
  } catch {
    return null;
  }
}
