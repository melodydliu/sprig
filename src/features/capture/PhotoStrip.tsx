import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { PhotoInput } from '@/data/repositories';

interface Props {
  photos: PhotoInput[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  max: number;
}

export function PhotoStrip({ photos, onAdd, onRemove, max }: Props) {
  const theme = useTheme();
  const canAdd = photos.length < max;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {photos.map((photo, index) => (
        <View key={`${photo.uri}-${index}`} style={styles.item}>
          <Image
            source={{ uri: photo.uri }}
            style={[styles.thumb, { borderRadius: theme.radius.md }]}
            contentFit="cover"
          />
          {index === 0 ? (
            <View style={[styles.coverTag, { backgroundColor: theme.colors.primary }]}>
              <Text variant="caption" style={{ color: theme.colors.onPrimary, fontSize: 10 }}>
                Cover
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => onRemove(index)}
            hitSlop={8}
            style={[styles.remove, { backgroundColor: theme.colors.text }]}
          >
            <X size={12} color={theme.colors.background} strokeWidth={3} />
          </Pressable>
        </View>
      ))}

      {canAdd ? (
        <Pressable
          onPress={onAdd}
          style={[
            styles.add,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Plus size={22} color={theme.colors.textSecondary} strokeWidth={2.4} />
          <Text variant="caption" color="textMuted">
            Add
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 2 },
  item: { position: 'relative' },
  thumb: { width: 92, height: 92 },
  coverTag: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 92,
    height: 92,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
