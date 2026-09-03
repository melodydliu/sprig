import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

import { useFilters } from '@/features/filters/filterStore';
import { useTheme } from '@/theme/ThemeProvider';

export function SearchBar() {
  const theme = useTheme();
  const search = useFilters((s) => s.search);
  const setSearch = useFilters((s) => s.setSearch);

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
      <Search size={17} color={theme.colors.textMuted} strokeWidth={2.3} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search finds, notes, places, tags"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, theme.typography.body, { color: theme.colors.text }]}
      />
      {search.length > 0 ? (
        <Pressable onPress={() => setSearch('')} hitSlop={8}>
          <X size={16} color={theme.colors.textMuted} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    height: 42,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 0 },
});
