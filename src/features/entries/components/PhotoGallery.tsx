import { Image } from 'expo-image';
import { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { Photo } from '@/types/entry';

interface Props {
  photos: Photo[];
  width: number;
  height: number;
}

export function PhotoGallery({ photos, width, height }: Props) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={{ width, height, backgroundColor: theme.colors.backgroundAlt }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {photos.map((p) => (
          <Image
            key={p.id}
            source={{ uri: p.localUri }}
            style={{ width, height }}
            contentFit="cover"
            transition={180}
          />
        ))}
      </ScrollView>

      {photos.length > 1 ? (
        <View style={styles.dots}>
          {photos.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.45)',
                  width: i === index ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
});
