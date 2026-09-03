import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EntryFormFields } from '@/components/EntryFormFields';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useCaptureDraft } from '@/features/capture/captureDraftStore';
import { MAX_PHOTOS, pickFromLibrary } from '@/features/capture/imageSource';
import { PhotoStrip } from '@/features/capture/PhotoStrip';
import { useEntries } from '@/features/entries/entriesStore';
import { reverseGeocode } from '@/features/location/geocode';
import { useLocationDraft } from '@/features/location/locationDraftStore';
import { useCurrentLocation } from '@/features/location/useCurrentLocation';
import { distanceMiles } from '@/lib/geo';
import { useTheme } from '@/theme/ThemeProvider';

export default function CaptureDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const createEntry = useEntries((s) => s.create);

  const draft = useCaptureDraft();
  const locationDraft = useLocationDraft();
  const [saving, setSaving] = useState(false);
  const { point: gpsPoint } = useCurrentLocation();

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

  // Reverse-geocode a label whenever the point changes and it's not user-typed.
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

  // Pick up a location chosen on the shared picker screen.
  useFocusEffect(
    useCallback(() => {
      const committed = locationDraft.consume();
      if (committed) {
        draft.patch({
          location: committed.point,
          locationLabel: committed.label,
          locationSource: 'manual',
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const openLocationPicker = () => {
    locationDraft.seed(draft.location, draft.locationLabel, draft.locationSource);
    router.push('/location');
  };

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

          <EntryFormFields
            values={{
              name: draft.name,
              category: draft.category,
              colors: draft.colors,
              notes: draft.notes,
              tags: draft.tags,
              location: draft.location,
              locationLabel: draft.locationLabel,
              locationSource: draft.locationSource,
              sightedAt: draft.sightedAt,
            }}
            onChange={draft.patch}
            onAdjustLocation={openLocationPicker}
            locationSuggestion={exifSuggestion}
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
  sheet: { flex: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  body: { paddingHorizontal: 20, paddingBottom: 32, gap: 18 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
