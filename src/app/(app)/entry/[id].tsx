import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { CategoryChip } from '@/features/entries/components/CategoryChip';
import { ColorDots } from '@/features/entries/components/ColorDots';
import { useEntries } from '@/features/entries/entriesStore';
import { fullDate } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

/** Basic detail view — full gallery, edit, share, directions land in Milestone 3. */
export default function EntryDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useEntries((s) => s.all.find((e) => e.id === id));
  const toggleFavorite = useEntries((s) => s.toggleFavorite);

  if (!entry) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text variant="body" color="textSecondary">
            This find could not be found.
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text variant="label" color="primary">
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ height: width, backgroundColor: theme.colors.backgroundAlt }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {entry.photos.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.localUri }}
                style={{ width, height: width }}
                contentFit="cover"
                transition={160}
              />
            ))}
          </ScrollView>
          <SafeAreaView style={styles.overlayTop} edges={['top']}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.circleBtn, { backgroundColor: theme.colors.surface }]}
            >
              <ChevronLeft size={22} color={theme.colors.text} strokeWidth={2.4} />
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(entry.id)}
              style={[styles.circleBtn, { backgroundColor: theme.colors.surface }]}
            >
              <Star
                size={20}
                color={theme.colors.favorite}
                fill={entry.isFavorite ? theme.colors.favorite : 'transparent'}
                strokeWidth={2.2}
              />
            </Pressable>
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
            Sighted {fullDate(entry.sightedAt)}
          </Text>

          {entry.locationLabel ? (
            <Text variant="bodyMedium" style={{ marginTop: 4 }}>
              {entry.locationLabel}
            </Text>
          ) : null}

          {entry.notes ? (
            <Text variant="body" color="textSecondary" style={{ marginTop: 10, lineHeight: 23 }}>
              {entry.notes}
            </Text>
          ) : null}

          {entry.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {entry.tags.map((t) => (
                <View
                  key={t}
                  style={[
                    styles.tag,
                    { backgroundColor: theme.colors.backgroundAlt, borderRadius: theme.radius.pill },
                  ]}
                >
                  <Text variant="caption" color="textSecondary">
                    #{t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
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
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20, gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  tag: { paddingHorizontal: 10, paddingVertical: 5 },
});
