import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, type Region } from 'react-native-maps';

import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint } from '@/types/entry';

import { Pin } from './MiniMap';

export interface PickerMapHandle {
  animateTo: (point: GeoPoint) => void;
}

interface Props {
  value: GeoPoint;
  onChange: (point: GeoPoint) => void;
}

/**
 * Full-bleed interactive map. The pin stays centered; panning the map moves the
 * selected point (feels better one-handed than dragging a tiny marker).
 */
export const PickerMap = forwardRef<PickerMapHandle, Props>(function PickerMap(
  { value, onChange },
  ref,
) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateTo: (point) => {
      mapRef.current?.animateToRegion(
        {
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        350,
      );
    },
  }));

  const handleRegionChange = (region: Region) => {
    onChange({ latitude: region.latitude, longitude: region.longitude });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: value.latitude,
          longitude: value.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      />
      {/* Fixed center pin */}
      <View style={styles.centerPin} pointerEvents="none">
        <Pin color={theme.colors.accent} ring={theme.colors.surface} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -11,
    marginTop: -11,
  },
});
