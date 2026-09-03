import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ColorPicker } from '@/components/ColorPicker';
import { DateField } from '@/components/DateField';
import { Field } from '@/components/Field';
import { LocationField } from '@/components/LocationField';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useCaptureDraft } from '@/features/capture/captureDraftStore';
import { MAX_PHOTOS, pickFromLibrary } from '@/features/capture/imageSource';
import { PhotoStrip } from '@/features/capture/PhotoStrip';
import { useEntries } from '@/features/entries/entriesStore';
import { reverseGeocode } from '@/features/location/geocode';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { distanceMiles } from '@/lib/geo';
import { useTheme } from '@/theme/ThemeProvider';

export default function CaptureDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const createEntry = useEntries((s) => s.create);

  const draft = useCaptureDraft();
  const [saving, setSaving] = useState(false);
  const { point: gpsPoint } = useCurrentLocation();

  // Guard: no photo means there's nothing to save — go back to the camera.
  useEffect(() => {
    if (draft.photos.length === 0) router.replace('/capture');
  }, [draft.photos.length, router]);

  // Backfill GPS if the camera screen didn't get a fix in time.
  useEffect(() => {
    if (!draft.location && !draft.exifLocation && gpsPoint) {
      draft.setLocation(gpsPoint, 'gps');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsPoint]);

  // Auto reverse-geocode a fresh label whenever the point changes and the user
  // hasn't typed their own.
  useEffect(() => {
    if (!draft.location) return;
    if (draft.locationLabel && draft.locationSource === 'manual') return;
    let cancelled = false;
    reverseGeocode(draft.location).then((label) => {
      if (!cancelled && label) draft.setField('locationLabel', label);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.location?.latitude, draft.location?.longitude]);

  const exifSuggestion = useMemo(() => {
    const exif = draft.exifLocation;
    if (!exif) return null;
    if (draft.location && distanceMiles(exif, draft.location) < 0.03) return null;
    return {
      text: draft.location
        ? "This photo has its own location — use it instead?"
        : "Use this photo's location?",
      onAccept: () => {
        draft.setLocation(exif, 'photo_exif', null);
        draft.setExifLocation(null);
      },
    };
  }, [draft]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await createEntry(draft.toDraft(), draft.photos);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      draft.reset();
      router.replace('/');
      toast.show('Saved', 'success');
    } catch {
      setSaving(false);
      toast.show('Could not save — try again');
    }
  };

  const handleCancel = () => {
    draft.reset();
    router.replace('/');
  };

  const addMorePhotos = async () => {
    const picked = await pickFromLibrary(MAX_PHOTOS - draft.photos.length);
    if (picked.length) {
      draft.addPhotos(picked);
      const exif = picked.find((p) => p.exifLocation)?.exifLocation;
      if (exif && !draft.exifLocation) draft.setExifLocation(exif);
    }
  };

  return (
    <SafeAreaView style={[styles.sheet, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text variant="bodyMedium" color="textSecondary">
            Cancel
          </Text>
        </Pressable>
        <Text variant="heading">New find</Text>
        <View style={{ width: 52 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PhotoStrip
            photos={draft.photos}
            onAdd={addMorePhotos}
            onRemove={draft.removePhotoAt}
            max={MAX_PHOTOS}
          />

          <Field
            label="Name"
            placeholder="Leave blank if you're not sure"
            value={draft.name ?? ''}
            onChangeText={(t) => draft.setField('name', t.length ? t : null)}
            returnKeyType="done"
          />

          <View style={styles.group}>
            <Text variant="label" color="textSecondary" style={styles.groupLabel}>
              CATEGORY
            </Text>
            <CategoryPicker value={draft.category} onChange={draft.setCategory} />
          </View>

          <View style={styles.group}>
            <Text variant="label" color="textSecondary" style={styles.groupLabel}>
              COLORS
            </Text>
            <ColorPicker value={draft.colors} onToggle={draft.toggleColor} />
          </View>

          <Field
            label="Notes"
            placeholder="Where exactly, how much there is, when to come back…"
            value={draft.notes}
            onChangeText={(t) => draft.setField('notes', t)}
            multiline
            style={styles.notes}
          />

          <LocationField
            point={draft.location}
            label={draft.locationLabel}
            source={draft.locationSource}
            onPress={() => router.push('/capture/location')}
            suggestion={exifSuggestion}
          />

          <DateField
            value={draft.sightedAt}
            onChange={(iso) => draft.setField('sightedAt', iso)}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button
            label={saving ? 'Saving…' : 'Save find'}
            size="lg"
            loading={saving}
            haptic
            onPress={handleSave}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  group: { gap: 8 },
  groupLabel: { marginLeft: 2, letterSpacing: 0.5 },
  notes: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
