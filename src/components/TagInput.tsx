import { useState } from 'react';
import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
}

const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export function TagInput({ value, onChange }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const tag = clean(raw);
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft('');
  };

  const handleChange = (text: string) => {
    if (/[,\s]$/.test(text)) add(text);
    else setDraft(text);
  };

  const handleKey = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      {value.map((tag) => (
        <Pressable
          key={tag}
          onPress={() => onChange(value.filter((t) => t !== tag))}
          style={[styles.chip, { backgroundColor: theme.colors.backgroundAlt }]}
        >
          <Text variant="caption" color="textSecondary">
            #{tag}
          </Text>
          <X size={11} color={theme.colors.textMuted} strokeWidth={2.6} />
        </Pressable>
      ))}
      <TextInput
        value={draft}
        onChangeText={handleChange}
        onKeyPress={handleKey}
        onSubmitEditing={() => add(draft)}
        onEndEditing={() => add(draft)}
        placeholder={value.length ? 'Add tag' : 'roadside, fence-line, spring…'}
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        style={[styles.input, theme.typography.body, { color: theme.colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    borderWidth: 1.5,
    padding: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  input: { flexGrow: 1, minWidth: 120, paddingVertical: 4, paddingHorizontal: 4 },
});
