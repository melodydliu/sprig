import * as ImagePicker from 'expo-image-picker';

import type { PhotoInput } from '@/data/repositories';
import type { GeoPoint } from '@/types/entry';

export const MAX_PHOTOS = 10;

/** Pull a GeoPoint out of an EXIF blob, handling the common iOS/Android shapes. */
export function exifToGeoPoint(exif: Record<string, any> | null | undefined): GeoPoint | null {
  if (!exif) return null;

  // iOS sometimes nests under "{GPS}" or "GPS"
  const gps = exif['{GPS}'] ?? exif.GPS ?? exif;

  let lat = num(gps.Latitude ?? gps.GPSLatitude ?? exif.GPSLatitude);
  let lng = num(gps.Longitude ?? gps.GPSLongitude ?? exif.GPSLongitude);
  if (lat == null || lng == null) return null;

  const latRef = gps.LatitudeRef ?? gps.GPSLatitudeRef ?? exif.GPSLatitudeRef;
  const lngRef = gps.LongitudeRef ?? gps.GPSLongitudeRef ?? exif.GPSLongitudeRef;
  if (latRef === 'S' && lat > 0) lat = -lat;
  if (lngRef === 'W' && lng > 0) lng = -lng;

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { latitude: lat, longitude: lng };
}

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && !Number.isNaN(n) ? n : null;
}

function assetToPhotoInput(asset: ImagePicker.ImagePickerAsset): PhotoInput {
  return {
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    takenAt: asset.exif?.DateTimeOriginal
      ? parseExifDate(asset.exif.DateTimeOriginal)
      : null,
    exifLocation: exifToGeoPoint(asset.exif),
  };
}

function parseExifDate(raw: string): string | null {
  // EXIF format: "2026:08:14 09:32:11"
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function pickFromLibrary(remainingSlots: number): Promise<PhotoInput[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, remainingSlots),
    exif: true,
    quality: 1,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, remainingSlots).map(assetToPhotoInput);
}
