import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { AVAILABILITY_LABELS, AVAILABILITY_LEVELS, type Availability } from '@/types/entry';

interface Props {
  value: Availability | null;
  onChange: (value: Availability | null) => void;
}

/**
 * Single-select, optional. Tapping the active chip clears it, so the field can
 * go back to "not recorded" the same way an empty text field does.
 */
export function AvailabilityPicker({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {AVAILABILITY_LEVELS.map((level) => (
        <Chip
          key={level}
          label={AVAILABILITY_LABELS[level]}
          selected={value === level}
          onPress={() => onChange(value === level ? null : level)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
