import { View, StyleSheet } from 'react-native';

import { CategoryPicker } from '@/components/CategoryPicker';
import { ColorPicker } from '@/components/ColorPicker';
import { DateField } from '@/components/DateField';
import { Field } from '@/components/Field';
import { LocationField } from '@/components/LocationField';
import { TagInput } from '@/components/TagInput';
import { Text } from '@/components/Text';
import type { Category, ColorName, GeoPoint, LocationSource } from '@/types/entry';

export interface EntryFormValues {
  name: string | null;
  category: Category;
  colors: ColorName[];
  notes: string;
  tags: string[];
  location: GeoPoint | null;
  locationLabel: string | null;
  locationSource: LocationSource | null;
  sightedAt: string;
}

interface Props {
  values: EntryFormValues;
  onChange: (patch: Partial<EntryFormValues>) => void;
  onAdjustLocation: () => void;
  showTags?: boolean;
  locationSuggestion?: { text: string; onAccept: () => void } | null;
}

/** Shared field set for capture and edit. Purely presentational / prop-driven. */
export function EntryFormFields({
  values,
  onChange,
  onAdjustLocation,
  showTags = false,
  locationSuggestion = null,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Field
        label="Name"
        placeholder="Leave blank if you're not sure"
        value={values.name ?? ''}
        onChangeText={(t) => onChange({ name: t.length ? t : null })}
        returnKeyType="done"
      />

      <Group label="CATEGORY">
        <CategoryPicker value={values.category} onChange={(category) => onChange({ category })} />
      </Group>

      <Group label="COLORS">
        <ColorPicker
          value={values.colors}
          onToggle={(c) =>
            onChange({
              colors: values.colors.includes(c)
                ? values.colors.filter((x) => x !== c)
                : [...values.colors, c],
            })
          }
        />
      </Group>

      <Field
        label="Notes"
        placeholder="Where exactly, how much there is, when to come back…"
        value={values.notes}
        onChangeText={(notes) => onChange({ notes })}
        multiline
        style={styles.notes}
      />

      {showTags ? (
        <Group label="TAGS">
          <TagInput value={values.tags} onChange={(tags) => onChange({ tags })} />
        </Group>
      ) : null}

      <LocationField
        point={values.location}
        label={values.locationLabel}
        source={values.locationSource}
        onPress={onAdjustLocation}
        suggestion={locationSuggestion}
      />

      <DateField value={values.sightedAt} onChange={(sightedAt) => onChange({ sightedAt })} />
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="label" color="textSecondary" style={styles.groupLabel}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  group: { gap: 8 },
  groupLabel: { marginLeft: 2, letterSpacing: 0.5 },
  notes: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
});
