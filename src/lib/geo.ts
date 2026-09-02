import type { GeoPoint } from '@/types/entry';

const EARTH_RADIUS_MI = 3958.7613;
const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in miles. */
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  return haversine(a, b) * EARTH_RADIUS_MI;
}

/** Great-circle distance between two points, in kilometers. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  return haversine(a, b) * EARTH_RADIUS_KM;
}

function haversine(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type DistanceUnit = 'mi' | 'km';

/** Human-friendly distance string, e.g. "0.3 mi", "12 mi", "450 ft". */
export function formatDistance(
  from: GeoPoint,
  to: GeoPoint,
  unit: DistanceUnit = 'mi',
): string {
  if (unit === 'km') {
    const km = distanceKm(from, to);
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }
  const mi = distanceMiles(from, to);
  if (mi < 0.19) return `${Math.round(mi * 5280)} ft`;
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}
