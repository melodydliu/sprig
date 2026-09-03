import { StyleSheet, View } from 'react-native';
import { Map } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { Entry } from '@/types/entry';

export function JournalMap({ entries }: { entries: Entry[] }) {
  const theme = useTheme();
  const withLoc = entries.filter((e) => e.location).length;
  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.backgroundAlt }]}>
      <Map size={30} color={theme.colors.textMuted} />
      <Text variant="bodyMedium" color="textSecondary">
        Map available on device
      </Text>
      <Text variant="caption" color="textMuted">
        {withLoc} of {entries.length} finds have a location
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
