import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useEntries } from '@/features/entries/entriesStore';
import { relativeDate } from '@/lib/format';
import { formatDistance } from '@/lib/geo';
import { useTheme } from '@/theme/ThemeProvider';
import type { Entry, GeoPoint } from '@/types/entry';

import { CategoryChips } from './CategoryChip';
import { ColorDots } from './ColorDots';

interface Props {
  entry: Entry;
  origin?: GeoPoint | null;
  unit?: 'mi' | 'km';
}

function EntryCardImpl({ entry, origin, unit = 'mi' }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const toggleFavorite = useEntries((s) => s.toggleFavorite);
  const cover = entry.photos[0];
  const distance =
    origin && entry.location ? formatDistance(origin, entry.location, unit) : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/entry/${entry.id}`)}
      style={({ pressed }) => [
        styles.card,
        theme.elevation(1),
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.thumbWrap, { backgroundColor: theme.colors.backgroundAlt }]}>
        {cover ? (
          <Image
            source={{ uri: cover.thumbnailUri }}
            style={styles.thumb}
            contentFit="cover"
            transition={140}
          />
        ) : null}
        <Pressable
          onPress={() => toggleFavorite(entry.id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: entry.isFavorite }}
          style={({ pressed }) => [
            styles.fav,
            { backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Heart
            size={15}
            color={theme.colors.favorite}
            fill={entry.isFavorite ? theme.colors.favorite : 'transparent'}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text
          variant="title"
          numberOfLines={1}
          style={!entry.name ? { color: theme.colors.textMuted, fontStyle: 'italic' } : undefined}
        >
          {entry.name ?? 'Unnamed'}
        </Text>

        <View style={styles.metaRow}>
          <CategoryChips categories={entry.categories} />
          <ColorDots colors={entry.colors} />
        </View>

        <View style={styles.footRow}>
          <Text variant="caption" color="textMuted">
            {relativeDate(entry.sightedAt)}
          </Text>
          {distance ? (
            <>
              <Text variant="caption" color="textMuted">
                ·
              </Text>
              <Text variant="caption" color="textMuted">
                {distance}
              </Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const EntryCard = memo(EntryCardImpl);

const styles = StyleSheet.create({
  card: {
    padding: 10,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  fav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: 7, paddingHorizontal: 4, paddingBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
