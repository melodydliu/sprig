import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Crosshair, Search } from 'lucide-react-native';

import { Button } from '@/components/Button';
import { PickerMap, type PickerMapHandle } from '@/components/map/PickerMap';
import { Text } from '@/components/Text';
import { forwardGeocode, reverseGeocode } from '@/features/location/geocode';
import { useLocationDraft } from '@/features/location/locationDraftStore';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint } from '@/types/entry';

const HB_FALLBACK: GeoPoint = { latitude: 33.6595, longitude: -117.9988 };

/** Shared location picker. Reads the seed from `useLocationDraft`, writes `committed`. */
export default function LocationPickerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { seedPoint, commit } = useLocationDraft();
  const mapRef = useRef<PickerMapHandle>(null);
  const { request: requestLocation } = useCurrentLocation(false);

  const [point, setPoint] = useState<GeoPoint>(seedPoint ?? HB_FALLBACK);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const runSearch = async () => {
    Keyboard.dismiss();
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    const found = await forwardGeocode(query);
    setSearching(false);
    if (found) {
      setPoint(found);
      mapRef.current?.animateTo(found);
    } else {
      setNotFound(true);
    }
  };

  const centerOnMe = async () => {
    const me = await requestLocation();
    if (me) {
      setPoint(me);
      mapRef.current?.animateTo(me);
    }
  };

  const confirm = async () => {
    const label = await reverseGeocode(point);
    commit(point, label);
    router.back();
  };

  return (
    <View style={styles.flex}>
      <PickerMap ref={mapRef} value={point} onChange={setPoint} />

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
          >
            <ChevronLeft size={22} color={theme.colors.text} strokeWidth={2.4} />
          </Pressable>

          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Search size={16} color={theme.colors.textMuted} />
            <TextInputLite
              placeholder="Search an address or place"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
            />
            {searching ? <ActivityIndicator size="small" color={theme.colors.textMuted} /> : null}
          </View>
        </View>

        {notFound ? (
          <View style={[styles.notFound, { backgroundColor: theme.colors.surface }]}>
            <Text variant="caption" color="textSecondary">
              Nothing found for that. Drag the map to place the pin instead.
            </Text>
          </View>
        ) : null}
      </SafeAreaView>

      <SafeAreaView style={styles.bottom} edges={['bottom']} pointerEvents="box-none">
        <Pressable
          onPress={centerOnMe}
          style={[styles.meBtn, theme.elevation(2), { backgroundColor: theme.colors.surface }]}
        >
          <Crosshair size={20} color={theme.colors.primary} strokeWidth={2.3} />
        </Pressable>
        <View style={[styles.confirmBar, theme.elevation(2), { backgroundColor: theme.colors.surface }]}>
          <Text variant="caption" color="textMuted" center>
            {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
          </Text>
          <Button label="Use this spot" onPress={confirm} fullWidth />
        </View>
      </SafeAreaView>
    </View>
  );
}

function TextInputLite(props: ComponentProps<typeof TextInput>) {
  const theme = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.colors.textMuted}
      returnKeyType="search"
      style={[{ flex: 1, color: theme.colors.text }, theme.typography.body]}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, gap: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  notFound: { padding: 10, borderRadius: 10, marginHorizontal: 48 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 12 },
  meBtn: {
    alignSelf: 'flex-end',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBar: { borderRadius: 18, padding: 14, gap: 10 },
});
