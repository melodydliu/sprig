import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint } from '@/types/entry';

interface Props {
  point: GeoPoint;
  height?: number;
  /** Half-width of the visible span, in degrees. Smaller = more zoomed in. */
  span?: number;
  style?: StyleProp<ViewStyle>;
  rounded?: boolean;
}

/** Small, non-interactive map with a single pin. Used in forms and detail views. */
export function MiniMap({ point, height = 150, span = 0.008, style, rounded = true }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        { height, borderRadius: rounded ? theme.radius.md : 0, overflow: 'hidden' },
        { borderWidth: rounded ? StyleSheet.hairlineWidth : 0, borderColor: theme.colors.border },
        style,
      ]}
      pointerEvents="none"
    >
      <MapView
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        region={{
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: span * 2,
          longitudeDelta: span * 2,
        }}
      >
        <Marker coordinate={point} tracksViewChanges={false}>
          <Pin color={theme.colors.accent} ring={theme.colors.surface} />
        </Marker>
      </MapView>
    </View>
  );
}

export function Pin({ color, ring }: { color: string; ring: string }) {
  return (
    <View style={[styles.pinOuter, { backgroundColor: ring }]}>
      <View style={[styles.pinInner, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pinOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  pinInner: { width: 12, height: 12, borderRadius: 6 },
});
