import { Linking, Platform } from 'react-native';

import type { GeoPoint } from '@/types/entry';

/** Opens the platform maps app with directions to the point. */
export async function openDirections(point: GeoPoint, label?: string | null): Promise<void> {
  const { latitude, longitude } = point;
  const name = label ? encodeURIComponent(label) : '';

  const url =
    Platform.OS === 'ios'
      ? `maps://?daddr=${latitude},${longitude}${name ? `&q=${name}` : ''}`
      : `google.navigation:q=${latitude},${longitude}`;

  const web = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    const ok = await Linking.canOpenURL(url);
    await Linking.openURL(ok ? url : web);
  } catch {
    await Linking.openURL(web).catch(() => {});
  }
}
