import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { Crosshair } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { CategoryChips, CATEGORY_ICONS } from '@/features/entries/components/CategoryChip';
import { useClusters } from '@/features/map/useClusters';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { relativeDate } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import type { Entry } from '@/types/entry';

const OC_REGION: Region = {
  latitude: 33.68,
  longitude: -117.9,
  latitudeDelta: 0.55,
  longitudeDelta: 0.55,
};

export function JournalMap({ entries }: { entries: Entry[] }) {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const { point: me } = useCurrentLocation();

  const initialRegion = useMemo<Region>(() => {
    const withLoc = entries.filter((e) => e.location);
    if (withLoc.length === 0) return OC_REGION;
    const lats = withLoc.map((e) => e.location!.latitude);
    const lngs = withLoc.map((e) => e.location!.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.04, (maxLat - minLat) * 1.4),
      longitudeDelta: Math.max(0.04, (maxLng - minLng) * 1.4),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [region, setRegion] = useState<Region>(initialRegion);
  const [selected, setSelected] = useState<Entry | null>(null);
  const { clusters, index } = useClusters(entries, region);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.25} pressBehavior="close" />
    ),
    [],
  );

  const onClusterPress = (clusterId: number, latitude: number, longitude: number) => {
    const zoom = index.getClusterExpansionZoom(clusterId);
    const delta = Math.max(0.005, 360 / 2 ** zoom);
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: delta, longitudeDelta: delta },
      300,
    );
  };

  const centerOnMe = () => {
    if (me) {
      mapRef.current?.animateToRegion(
        { ...me, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        350,
      );
    }
  };

  return (
    <View style={styles.flex}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {clusters.map((c) =>
          c.count > 1 ? (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitude, longitude: c.longitude }}
              onPress={() => onClusterPress(c.clusterId!, c.latitude, c.longitude)}
              tracksViewChanges={false}
            >
              <View style={[styles.cluster, { backgroundColor: theme.colors.primary }]}>
                <Text variant="label" style={{ color: theme.colors.onPrimary }}>
                  {c.count}
                </Text>
              </View>
            </Marker>
          ) : (
            <Marker
              key={c.id}
              coordinate={{ latitude: c.latitude, longitude: c.longitude }}
              onPress={() => {
                setSelected(c.entry ?? null);
                sheetRef.current?.present();
              }}
              tracksViewChanges={false}
            >
              <Pin category={c.entry?.categories[0] ?? 'other'} />
            </Marker>
          ),
        )}
      </MapView>

      <View style={styles.controls} pointerEvents="box-none">
        <Pressable
          onPress={centerOnMe}
          style={[styles.meBtn, theme.elevation(2), { backgroundColor: theme.colors.surface }]}
        >
          <Crosshair size={20} color={theme.colors.primary} strokeWidth={2.3} />
        </Pressable>
      </View>

      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
      >
        <BottomSheetView style={styles.preview}>
          {selected ? (
            <>
              <View style={styles.previewRow}>
                {selected.photos[0] ? (
                  <Image
                    source={{ uri: selected.photos[0].thumbnailUri }}
                    style={styles.previewThumb}
                    contentFit="cover"
                  />
                ) : null}
                <View style={styles.previewMeta}>
                  <Text
                    variant="title"
                    numberOfLines={1}
                    style={!selected.name ? { color: theme.colors.textMuted, fontStyle: 'italic' } : undefined}
                  >
                    {selected.name ?? 'Unnamed'}
                  </Text>
                  <View style={styles.previewChips}>
                    <CategoryChips categories={selected.categories} />
                  </View>
                  <Text variant="caption" color="textMuted">
                    {relativeDate(selected.sightedAt)}
                  </Text>
                </View>
              </View>
              <Button
                label="View entry"
                onPress={() => {
                  sheetRef.current?.dismiss();
                  router.push(`/entry/${selected.id}`);
                }}
                fullWidth
              />
            </>
          ) : null}
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

function Pin({ category }: { category: Entry['categories'][number] }) {
  const theme = useTheme();
  const { color } = theme.categoryColor(category);
  const Icon = CATEGORY_ICONS[category];
  return (
    <View style={styles.pinWrap}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Icon size={14} color="#fff" strokeWidth={2.6} />
      </View>
      <View style={[styles.pinTail, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cluster: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinWrap: { alignItems: 'center' },
  pin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  controls: { position: 'absolute', right: 18, bottom: 96 },
  meBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  preview: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28, gap: 14 },
  previewRow: { flexDirection: 'row', gap: 12 },
  previewThumb: { width: 74, height: 74, borderRadius: 12 },
  previewMeta: { flex: 1, gap: 6, justifyContent: 'center' },
  previewChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
