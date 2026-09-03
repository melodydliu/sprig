import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Navigation,
  Pencil,
  Share2,
  Star,
  Trash2,
} from 'lucide-react-native';

import { MiniMap } from '@/components/map/MiniMap';
import { Text } from '@/components/Text';
import { useToast } from '@/components/Toast';
import { CategoryChip } from '@/features/entries/components/CategoryChip';
import { ColorDots } from '@/features/entries/components/ColorDots';
import { PhotoGallery } from '@/features/entries/components/PhotoGallery';
import { useEntries } from '@/features/entries/entriesStore';
import { openDirections } from '@/lib/directions';
import { fullDate } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

export default function EntryDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const entry = useEntries((s) => s.all.find((e) => e.id === id));
  const toggleFavorite = useEntries((s) => s.toggleFavorite);
  const removeEntry = useEntries((s) => s.remove);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!entry) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
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

  const handleShare = async () => {
    const parts = [
      entry.name ?? 'A foraging find',
      entry.locationLabel ? `📍 ${entry.locationLabel}` : null,
      entry.notes || null,
    ].filter(Boolean);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message: parts.join('\n\n'), url: entry.photos[0]?.localUri ?? '' }
          : { message: parts.join('\n\n') },
      );
    } catch {
      /* user cancelled */
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this find?', 'It will be removed from your journal.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          await removeEntry(entry.id);
          toast.show('Deleted');
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View>
          <PhotoGallery photos={entry.photos} width={width} height={width} />
          <SafeAreaView style={styles.overlayTop} edges={['top']} pointerEvents="box-none">
            <CircleButton icon={ChevronLeft} onPress={() => router.back()} />
            <View style={styles.overlayRight}>
              <CircleButton
                icon={Star}
                fill={entry.isFavorite}
                onPress={() => toggleFavorite(entry.id)}
              />
              <CircleButton icon={Share2} onPress={handleShare} />
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <Text
            variant="display"
            style={!entry.name ? { color: theme.colors.textMuted, fontStyle: 'italic' } : undefined}
          >
            {entry.name ?? 'Unnamed'}
          </Text>

          <View style={styles.metaRow}>
            <CategoryChip category={entry.category} size="md" />
            <ColorDots colors={entry.colors} size={14} />
          </View>

          <Text variant="caption" color="textMuted">
            Captured {fullDate(entry.sightedAt)}
          </Text>

          {entry.notes ? (
            <Text variant="body" color="textSecondary" style={styles.notes}>
              {entry.notes}
            </Text>
          ) : null}

          {entry.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {entry.tags.map((t) => (
                <View
                  key={t}
                  style={[styles.tag, { backgroundColor: theme.colors.backgroundAlt }]}
                >
                  <Text variant="caption" color="textSecondary">
                    #{t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {entry.location ? (
            <View style={styles.locationBlock}>
              {entry.locationLabel ? (
                <Text variant="bodyMedium">{entry.locationLabel}</Text>
              ) : null}
              <MiniMap point={entry.location} height={160} />
              <Pressable
                onPress={() => openDirections(entry.location!, entry.locationLabel)}
                style={({ pressed }) => [
                  styles.directions,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radius.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Navigation size={16} color={theme.colors.onPrimarySoft} strokeWidth={2.4} />
                <Text variant="label" style={{ color: theme.colors.onPrimarySoft }}>
                  Directions
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <ActionButton
              icon={Pencil}
              label="Edit"
              onPress={() => router.push(`/entry/${entry.id}/edit`)}
            />
            <ActionButton icon={Trash2} label="Delete" tone="danger" onPress={confirmDelete} disabled={busy} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function CircleButton({
  icon: Icon,
  onPress,
  fill,
}: {
  icon: typeof Star;
  onPress: () => void;
  fill?: boolean;
}) {
  const theme = useTheme();
  const isStar = Icon === Star;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.circle,
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Icon
        size={20}
        color={isStar ? theme.colors.favorite : theme.colors.text}
        fill={isStar && fill ? theme.colors.favorite : 'transparent'}
        strokeWidth={2.3}
      />
    </Pressable>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onPress,
  tone = 'default',
  disabled,
}: {
  icon: typeof Pencil;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Icon size={17} color={color} strokeWidth={2.3} />
      <Text variant="label" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  overlayRight: { flexDirection: 'row', gap: 10 },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  notes: { marginTop: 6, lineHeight: 23 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  locationBlock: { gap: 10, marginTop: 8 },
  directions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
});
