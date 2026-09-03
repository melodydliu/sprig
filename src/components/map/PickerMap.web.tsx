import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapPin } from 'lucide-react-native';

import { Field } from '@/components/Field';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import type { GeoPoint } from '@/types/entry';

export interface PickerMapHandle {
  animateTo: (point: GeoPoint) => void;
}

interface Props {
  value: GeoPoint;
  onChange: (point: GeoPoint) => void;
}

/** Web fallback — no map. Lets you type raw coordinates so the flow still works. */
export const PickerMap = forwardRef<PickerMapHandle, Props>(function PickerMap(
  { value, onChange },
  ref,
) {
  const theme = useTheme();
  useImperativeHandle(ref, () => ({ animateTo: () => {} }));

  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.backgroundAlt }]}>
      <MapPin size={28} color={theme.colors.textMuted} />
      <Text variant="bodyMedium" color="textSecondary">
        Interactive map is available on device
      </Text>
      <View style={styles.row}>
        <Field
          label="Latitude"
          defaultValue={String(value.latitude)}
          keyboardType="numbers-and-punctuation"
          onChangeText={(t) => {
            const n = Number(t);
            if (!Number.isNaN(n)) onChange({ ...value, latitude: n });
          }}
          style={styles.input}
        />
        <Field
          label="Longitude"
          defaultValue={String(value.longitude)}
          keyboardType="numbers-and-punctuation"
          onChangeText={(t) => {
            const n = Number(t);
            if (!Number.isNaN(n)) onChange({ ...value, longitude: n });
          }}
          style={styles.input}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  row: { flexDirection: 'row', gap: 12 },
  input: { minWidth: 140 },
});
