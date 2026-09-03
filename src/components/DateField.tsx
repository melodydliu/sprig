import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { fullDate } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  value: string; // ISO
  onChange: (iso: string) => void;
  label?: string;
}

export function DateField({ value, onChange, label = 'Date captured' }: Props) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const date = new Date(value);

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) onChange(selected.toISOString());
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="label" color="textSecondary" style={styles.label}>
        {label.toUpperCase()}
      </Text>
      <Pressable
        onPress={() => setShowPicker((s) => !s)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <CalendarDays size={18} color={theme.colors.textSecondary} strokeWidth={2.2} />
        <Text variant="bodyMedium">{fullDate(value)}</Text>
      </Pressable>

      {showPicker ? (
        <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}>
          <DateTimePicker
            value={Number.isNaN(date.getTime()) ? new Date() : date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={handleChange}
            themeVariant={theme.scheme}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setShowPicker(false)} style={styles.doneBtn}>
              <Text variant="label" color="primary">
                Done
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginLeft: 2, letterSpacing: 0.5 },
  row: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iosPicker: { alignItems: 'center' },
  doneBtn: { alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 6 },
});
