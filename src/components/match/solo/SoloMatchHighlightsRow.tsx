import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SoloMatchHighlight } from '../../../mock';
import { colors, spacing } from '../../../theme';
import { getTeamMatchAccentColor } from './soloMatchTheme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type SoloMatchHighlightsRowProps = {
  highlights: SoloMatchHighlight[];
};

export function SoloMatchHighlightsRow({ highlights }: SoloMatchHighlightsRowProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {highlights.map((highlight) => {
        const accentColor = highlight.accent
          ? getTeamMatchAccentColor(highlight.accent)
          : colors.textSecondary;

        return (
          <View key={highlight.id} style={styles.card}>
            <Ionicons color={accentColor} name={highlight.icon as IoniconsName} size={14} />
            <Text style={styles.label}>{highlight.label.toUpperCase()}</Text>
            <Text style={styles.value}>{highlight.value}</Text>
            <Text style={styles.subtext}>{highlight.subtext}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  card: {
    width: 132,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  subtext: {
    color: colors.textSecondary,
    fontSize: 9,
  },
});
