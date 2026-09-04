import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Text } from '@/components/Text';
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
        {entry.isFavorite ? (
          <View style={[styles.fav, { backgroundColor: theme.colors.surface }]}>
            <Star
              size={13}
              color={theme.colors.favorite}
              fill={theme.colors.favorite}
              strokeWidth={2}
            />
          </View>
        ) : null}
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
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { gap: 7, paddingHorizontal: 4, paddingBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
