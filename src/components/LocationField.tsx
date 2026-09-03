import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, MapPin, MapPinOff } from 'lucide-react-native';

import { MiniMap } from '@/components/map/MiniMap';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint, LocationSource } from '@/types/entry';

interface Props {
  point: GeoPoint | null;
  label: string | null;
  source: LocationSource | null;
  onPress: () => void;
  /** Optional inline suggestion, e.g. "Use the photo's location". */
  suggestion?: { text: string; onAccept: () => void } | null;
}

const SOURCE_LABEL: Record<LocationSource, string> = {
  gps: 'From GPS',
  manual: 'Set manually',
  photo_exif: "From the photo",
};

export function LocationField({ point, label, source, onPress, suggestion }: Props) {
  const theme = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        LOCATION
      </Text>

      {point ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.card,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.94 : 1,
            },
          ]}
        >
          <MiniMap point={point} height={128} rounded={false} />
          <View style={styles.cardFooter}>
            <MapPin size={16} color={theme.colors.accent} strokeWidth={2.3} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" numberOfLines={1}>
                {label ?? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`}
              </Text>
              {source ? (
                <Text variant="caption" color="textMuted">
                  {SOURCE_LABEL[source]} · tap to adjust
                </Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={theme.colors.textMuted} />
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.empty,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <MapPinOff size={18} color={theme.colors.textMuted} strokeWidth={2.2} />
          <Text variant="bodyMedium" color="textSecondary">
            No location — tap to add
          </Text>
        </Pressable>
      )}

      {suggestion ? (
        <Pressable
          onPress={suggestion.onAccept}
          style={[styles.suggestion, { backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.sm }]}
        >
          <Text variant="caption" style={{ color: theme.colors.onAccentSoft }}>
            {suggestion.text}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginLeft: 2, letterSpacing: 0.5 },
  card: { borderWidth: 1.5, overflow: 'hidden' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  empty: {
    minHeight: 52,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  suggestion: { paddingHorizontal: 12, paddingVertical: 9 },
});
