import { BottomSheetTextInput, TouchableOpacity } from '@gorhom/bottom-sheet';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Search, X } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** All tags in use, already ordered most-used first. */
  allTags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}

const MAX_SUGGESTIONS = 10;
const MAX_DEFAULT = 8;

/**
 * Type-to-complete tag filter. Shows selected tags as removable chips, a search
 * field, and a short suggestion list (top tags when empty, matches while typing).
 */
export function TagFilterField({ allTags, selected, onToggle }: Props) {
  const theme = useTheme();
  const [query, setQuery] = useState('');

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = allTags.filter((t) => !selected.includes(t));
    if (!q) return pool.slice(0, MAX_DEFAULT);
    return pool.filter((t) => t.includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [allTags, selected, query]);

  return (
    <View style={styles.wrap}>
      {selected.length > 0 ? (
        <View style={styles.selectedRow}>
          {selected.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggle(tag)}
              style={[styles.selectedChip, { backgroundColor: theme.colors.primary }]}
            >
              <Text variant="label" style={{ color: theme.colors.onPrimary }}>
                #{tag}
              </Text>
              <X size={12} color={theme.colors.onPrimary} strokeWidth={2.8} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Search size={16} color={theme.colors.textMuted} strokeWidth={2.3} />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={selected.length ? 'Add another tag' : 'Type to filter by tag'}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, theme.typography.body, { color: theme.colors.text }]}
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color={theme.colors.textMuted} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => {
                onToggle(tag);
                setQuery('');
              }}
              style={[
                styles.suggestChip,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <Text variant="label" color="textSecondary">
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : query.trim().length > 0 ? (
        <Text variant="caption" color="textMuted" style={styles.emptyNote}>
          No tags match “{query.trim()}”
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  field: {
    minHeight: 44,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 10 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  suggestChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  emptyNote: { marginLeft: 2 },
});
