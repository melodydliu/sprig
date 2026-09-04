import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { EntryFormFields, type EntryFormValues } from '@/components/EntryFormFields';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { useAddPhotoDraft } from '@/features/capture/addPhotoDraftStore';
import { MAX_PHOTOS } from '@/features/capture/imageSource';
import { PhotoStrip } from '@/features/capture/PhotoStrip';
import { useEntries } from '@/features/entries/entriesStore';
import { useLocationDraft } from '@/features/location/locationDraftStore';
import { useTheme } from '@/theme/ThemeProvider';
import type { EntryDraft } from '@/types/entry';

export default function EditEntryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const entry = useEntries((s) => s.all.find((e) => e.id === id));
  const updateEntry = useEntries((s) => s.update);
  const addPhotos = useEntries((s) => s.addPhotos);
  const removePhoto = useEntries((s) => s.removePhoto);
  const locationDraft = useLocationDraft();
  const addPhotoDraft = useAddPhotoDraft();
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<EntryFormValues | null>(() =>
    entry
      ? {
          name: entry.name,
          category: entry.category,
          colors: entry.colors,
          notes: entry.notes,
          tags: entry.tags,
          location: entry.location,
          locationLabel: entry.locationLabel,
          locationSource: entry.locationSource,
          sightedAt: entry.sightedAt,
        }
      : null,
  );

  useFocusEffect(
    useCallback(() => {
      const committed = locationDraft.consume();
      if (committed) {
        setValues((v) =>
          v
            ? { ...v, location: committed.point, locationLabel: committed.label, locationSource: 'manual' }
            : v,
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Pick up photo(s) added via the camera screen pushed in add mode.
  useFocusEffect(
    useCallback(() => {
      const added = addPhotoDraft.consume();
      if (added && added.length && entry) void addPhotos(entry.id, added);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const photoInputs = useMemo(
    () =>
      (entry?.photos ?? []).map((p) => ({
        uri: p.thumbnailUri,
        width: p.width,
        height: p.height,
      })),
    [entry?.photos],
  );

  if (!entry || !values) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="body" color="textSecondary">
          This find is no longer here.
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text variant="label" color="primary">
            Go back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const patch = (p: Partial<EntryFormValues>) => setValues((v) => (v ? { ...v, ...p } : v));

  const openLocationPicker = () => {
    locationDraft.seed(values.location, values.locationLabel, values.locationSource);
    router.push('/location');
  };

  const handleAddPhotos = () => {
    router.push({ pathname: '/capture', params: { mode: 'add', count: String(entry.photos.length) } });
  };

  const handleRemovePhoto = async (index: number) => {
    const photo = entry.photos[index];
    if (photo && entry.photos.length > 1) await removePhoto(entry.id, photo.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const draftPatch: Partial<EntryDraft> = {
        name: values.name,
        category: values.category,
        colors: values.colors,
        notes: values.notes,
        tags: values.tags,
        location: values.location,
        locationLabel: values.locationLabel,
        locationSource: values.locationSource,
        sightedAt: values.sightedAt,
      };
      await updateEntry(entry.id, draftPatch);
      toast.show('Saved', 'success');
      router.back();
    } catch {
      setSaving(false);
      toast.show('Could not save — try again');
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="bodyMedium" color="textSecondary">
            Cancel
          </Text>
        </Pressable>
        <Text variant="heading">Edit find</Text>
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
            photos={photoInputs}
            onAdd={handleAddPhotos}
            onRemove={handleRemovePhoto}
            max={MAX_PHOTOS}
          />
          <EntryFormFields
            values={values}
            onChange={patch}
            onAdjustLocation={openLocationPicker}
            showTags
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button
            label={saving ? 'Saving…' : 'Save changes'}
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
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
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
