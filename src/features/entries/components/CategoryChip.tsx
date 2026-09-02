import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Flower2,
  Leaf,
  Apple,
  TreeDeciduous,
  Wheat,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { CATEGORY_LABELS, type Category } from '@/types/entry';

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  flower: Flower2,
  foliage: Leaf,
  fruit_vegetable: Apple,
  branch_stem: TreeDeciduous,
  seed_pod_dried: Wheat,
  other: Sparkles,
};

interface Props {
  category: Category;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function CategoryChip({ category, size = 'sm', style }: Props) {
  const theme = useTheme();
  const { color, soft } = theme.categoryColor(category);
  const Icon = CATEGORY_ICONS[category];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: soft,
          borderRadius: theme.radius.pill,
          paddingHorizontal: size === 'sm' ? 8 : 10,
          paddingVertical: size === 'sm' ? 4 : 6,
        },
        style,
      ]}
    >
      <Icon size={iconSize} color={color} strokeWidth={2.4} />
      <Text variant="caption" style={{ color }}>
        {CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
}
